"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AgencyGate } from "@/components/agency-gate";
import { useAgencyTeam } from "@/components/agency-team";
import CustomSelect from "@/components/custom-select";
import { AgeChip, emptyBoxClass, errorBoxClass, FilterChips, formatAge, Initials, PageHeading, panelClass, SummaryStrip } from "@/components/dashboard-ui";
import { REPLY_TARGET_MS } from "@/lib/dashboard-math";
import { formatDateTime } from "@/lib/formatters";
import { asStage, assignInquiry, medianReplyMs, STAGE_LABEL, type SellerInquiry } from "@/lib/seller-inquiries";
import { useAccountUid } from "@/lib/use-owner-listings";

// Pattern 10A — Inbox (docs/dashboards/PLAN.md, Phase G). Every enquiry on the
// agency's listings. The principal hands one to an agent; the agent then works
// it in their own inbox (stages, reply). The principal changes only who
// handles it here — firestore.rules allow nothing else.

type Show = "unassigned" | "assigned" | "open" | "all";
const SHOWS: Show[] = ["unassigned", "assigned", "open", "all"];
const LABEL: Record<Show, string> = { unassigned: "New, not handed out", assigned: "Handed out", open: "Open", all: "All" };
const EMPTY: Record<Show, string> = {
  unassigned: "No new enquiry is waiting to be handed out.",
  assigned: "You haven't handed any enquiry to another agent yet.",
  open: "No open enquiries. Won and lost ones are under All.",
  all: "No enquiries on the agency's listings yet.",
};
const LISTING_AGENT = "__listing_agent__";

function matches(e: SellerInquiry, show: Show) {
  const stage = asStage(e.status);
  if (show === "unassigned") return stage === "new" && !e.assignedTo;
  if (show === "assigned") return Boolean(e.assignedTo);
  if (show === "open") return stage !== "won" && stage !== "lost";
  return true;
}

function AgencyEnquiries() {
  const params = useSearchParams();
  const initial = params.get("show") as Show | null;
  const uid = useAccountUid();
  const { load, reload, now } = useAgencyTeam(uid);
  const [show, setShow] = useState<Show>(initial && SHOWS.includes(initial) ? initial : "open");
  // Local overrides after a save, so the row updates without a full reload.
  const [assigned, setAssigned] = useState<Record<string, string | null>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<{ id: string; message: string } | null>(null);

  return (
    <AgencyGate uid={uid} load={load} reload={reload}>
      {({ agents, enquiries }) => {
        const nameOf = new Map(agents.map((a) => [a.uid, a.isPrincipal ? `${a.name} (you)` : a.name]));
        const rows = enquiries.map((e) => (e.id in assigned ? { ...e, assignedTo: assigned[e.id] } : e));
        const visible = rows.filter((e) => matches(e, show));
        const waiting = rows.filter((e) => asStage(e.status) === "new");
        const oldest = waiting.reduce<Date | null>((old, e) => (e.createdAt && (!old || e.createdAt < old) ? e.createdAt : old), null);
        const late = oldest !== null && now - oldest.getTime() > REPLY_TARGET_MS;
        const reply = medianReplyMs(rows, now, 30);

        async function assign(e: SellerInquiry, value: string) {
          const target = value === LISTING_AGENT || value === e.ownerId ? null : value;
          if ((e.assignedTo ?? null) === target) return;
          setSavingId(e.id);
          setError(null);
          try {
            await assignInquiry(e.id, target);
            setAssigned((prev) => ({ ...prev, [e.id]: target }));
          } catch (err) {
            console.error("Could not hand out the enquiry:", err);
            setError({ id: e.id, message: "That change wasn't saved. Check your connection and try again." });
          } finally {
            setSavingId(null);
          }
        }

        return (
          <>
            <PageHeading
              title="Agency enquiries"
              description="Every enquiry on your agency's listings, newest first. Hand one to another agent and it moves to their inbox; the listing's own agent handles the rest."
            />
            <SummaryStrip
              label="Agency enquiries at a glance"
              items={[
                {
                  label: "Waiting for a reply",
                  value: String(waiting.length),
                  note: oldest ? `Oldest ${formatAge(oldest, now)}${late ? ", past the 1 h target" : ""}` : "Nobody is waiting",
                  tone: late ? "late" : undefined,
                },
                { label: "Median first reply", value: reply ? formatAge(new Date(0), reply.ms) : "–", note: reply ? `${reply.count} replies, last 30 days` : "No first replies in 30 days" },
                { label: "Won, 30 days", value: String(agents.reduce((n, a) => n + a.won30, 0)), note: "Across the team", tone: "accent" },
              ]}
            />
            <section aria-label="Agency enquiries" className={panelClass}>
              <FilterChips<Show>
                label="Show enquiries"
                value={show}
                onChange={setShow}
                options={SHOWS.map((value) => ({ value, label: LABEL[value], count: rows.filter((e) => matches(e, value)).length }))}
              />
              {visible.length === 0 ? (
                <p className={emptyBoxClass}>{EMPTY[show]}</p>
              ) : (
                <ul className="space-y-3">
                  {visible.map((e) => {
                    const stage = asStage(e.status);
                    const handler = e.assignedTo ?? e.ownerId;
                    const options = [
                      { value: LISTING_AGENT, label: `Listing agent: ${nameOf.get(e.ownerId) ?? "agent"}` },
                      ...agents.filter((a) => a.uid !== e.ownerId).map((a) => ({ value: a.uid, label: nameOf.get(a.uid) ?? a.name })),
                      // Handed to an agent who has since left the agency.
                      ...(handler !== e.ownerId && !nameOf.has(handler) ? [{ value: handler, label: "An agent who left the agency" }] : []),
                    ];
                    return (
                      <li
                        key={e.id}
                        className={`relative flex gap-3.5 rounded-2xl border p-4 text-sm ${
                          stage === "new"
                            ? "border-[var(--dash-line-2)] bg-[var(--dash-card-2)] before:absolute before:inset-y-4 before:left-0 before:w-[3px] before:rounded-r-full before:bg-[var(--dash-d1)]"
                            : "border-[var(--dash-line)] bg-[var(--dash-card)]"
                        }`}
                      >
                        <span className="hidden sm:block">
                          <Initials name={e.contactName || "Buyer"} size={42} />
                        </span>
                        <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                          <div className="min-w-0">
                            <p className={`text-base text-slate-900 dark:text-white ${stage === "new" ? "font-bold" : "font-semibold"}`}>
                              {e.contactName || "A buyer"}
                              <span className="ml-2 inline-flex rounded-full bg-[var(--dash-track)] px-2 py-0.5 align-[2px] text-xs font-semibold text-slate-600 dark:text-slate-300">
                                {e.kind === "message" ? "Message" : "Viewing request"}
                              </span>
                            </p>
                            <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                              <span className="font-medium text-slate-700 dark:text-slate-200">{e.propertyTitle}</span>
                              {e.createdAt ? ` · ${formatDateTime(e.createdAt)}` : ""}
                            </p>
                            <p className="mt-2 flex flex-wrap gap-1.5">
                              <AgeChip label={STAGE_LABEL[stage]} tone={stage === "new" || stage === "lost" ? "neutral" : "good"} />
                              {stage === "new" && e.createdAt ? (
                                <AgeChip
                                  label={`Waiting ${formatAge(e.createdAt, now)}`}
                                  tone={now - e.createdAt.getTime() > REPLY_TARGET_MS ? "late" : "soon"}
                                />
                              ) : null}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {savingId === e.id ? <span role="status" className="text-xs text-slate-600 dark:text-slate-400">Saving…</span> : null}
                            <CustomSelect
                              label="Handled by"
                              ariaLabel={`Agent handling the enquiry from ${e.contactName || "a buyer"}`}
                              value={handler === e.ownerId ? LISTING_AGENT : handler}
                              disabled={savingId === e.id}
                              onChange={(value) => void assign(e, value)}
                              options={options}
                              align="right"
                              className="w-60"
                            />
                          </div>
                        </div>
                        {error?.id === e.id ? <p role="alert" className={`mt-3 ${errorBoxClass}`}>{error.message}</p> : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        );
      }}
    </AgencyGate>
  );
}

export default function AgencyEnquiriesPage() {
  return (
    <Suspense fallback={<p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading…</p>}>
      <AgencyEnquiries />
    </Suspense>
  );
}
