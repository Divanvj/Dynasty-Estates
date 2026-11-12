"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AgencyGate } from "@/components/agency-gate";
import { useAgencyTeam } from "@/components/agency-team";
import CustomSelect from "@/components/custom-select";
import { emptyBoxClass, errorBoxClass, FilterChips, formatAge, PageHeading, panelClass } from "@/components/dashboard-ui";
import { formatDateTime } from "@/lib/formatters";
import { asStage, assignInquiry, STAGE_LABEL, type SellerInquiry } from "@/lib/seller-inquiries";
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
                        className={`rounded-control border bg-[#f4f7f7] p-3.5 text-sm dark:bg-surface-ink/70 ${
                          stage === "new"
                            ? "border-slate-200 border-l-4 border-l-emerald-600 dark:border-white/10 dark:border-l-emerald-400"
                            : "border-slate-200 dark:border-white/10"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                          <div className="min-w-0">
                            <p className={`text-slate-900 dark:text-white ${stage === "new" ? "font-bold" : "font-medium"}`}>
                              {e.kind === "message" ? "Message" : "Viewing request"}
                              <span className="font-medium text-slate-600 dark:text-slate-300"> · {e.propertyTitle}</span>
                            </p>
                            <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                              {e.contactName || "A buyer"}
                              {e.createdAt ? ` · ${formatDateTime(e.createdAt)}` : ""}
                              {` · ${STAGE_LABEL[stage]}`}
                              {stage === "new" && e.createdAt ? ` · waiting ${formatAge(e.createdAt, now)}` : ""}
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
