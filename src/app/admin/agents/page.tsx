"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useId, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import {
  emptyBoxClass,
  errorBoxClass,
  FilterChips,
  linkClass,
  PageHeading,
  panelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/dashboard-ui";
import { ComplianceBadge } from "@/components/practitioner-profile";
import { formatDate, formatDateTime } from "@/lib/formatters";
import {
  complianceState,
  EXPIRY_WARNING_DAYS,
  listPractitioners,
  PPRA_URL,
  type Practitioner,
} from "@/lib/practitioners";

// Pattern 10A — Inbox (docs/dashboards/PLAN.md, Phase F). Practitioner
// applications, checked by hand against the PPRA register (link out) and
// decided in the row. Verify grants the agent role; both decisions go through
// /api/admin/practitioners, which writes the audit trail.

type Show = "pending" | "expiring" | "verified" | "rejected" | "all";

const SHOWS: Show[] = ["pending", "expiring", "verified", "rejected", "all"];
const EMPTY_FOR: Record<Show, string> = {
  pending: "No applications are waiting. New ones show here as practitioners file them.",
  expiring: `No verified certificate expires in the next ${EXPIRY_WARNING_DAYS} days.`,
  verified: "No verified practitioners yet.",
  rejected: "No applications have been turned down.",
  all: "No practitioner has filed a certificate yet.",
};

function matches(row: Practitioner, show: Show, now: number): boolean {
  const kind = complianceState(row, now).kind;
  if (show === "all") return true;
  if (show === "pending") return row.status === "pending";
  if (show === "expiring") return row.status === "verified" && (kind === "expiring" || kind === "expired");
  return row.status === show;
}

function AgentsQueue() {
  const params = useSearchParams();
  const initial = params.get("show");
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<Practitioner[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [show, setShow] = useState<Show>(SHOWS.includes(initial as Show) ? (initial as Show) : "pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const noteId = useId();

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    listPractitioners()
      .then((items) => !cancelled && setRows(items))
      .catch((error) => {
        console.error("Could not load practitioner applications:", error);
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  async function decide(row: Practitioner, decision: "verify" | "reject") {
    if (!user) return;
    if (decision === "reject" && !note.trim()) {
      setNoteError("Say why, so the applicant knows what to fix.");
      document.getElementById(noteId)?.focus();
      return;
    }
    setBusyId(row.uid);
    setActionError(null);
    setDone(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/practitioners", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ uid: row.uid, decision, note: decision === "reject" ? note.trim() : "" }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string; roleChange?: unknown } | null;
      if (!response.ok) throw new Error(body?.error ?? "The decision wasn't saved. Try again.");
      const status = decision === "verify" ? "verified" : "rejected";
      setRows((prev) =>
        (prev ?? []).map((item) =>
          item.uid === row.uid
            ? { ...item, status, verifiedAt: decision === "verify" ? new Date() : null, decisionNote: decision === "reject" ? note.trim() : "" }
            : item,
        ),
      );
      setDone(
        decision === "verify"
          ? `${row.fullName} is verified${body?.roleChange ? " and now has agent access (from their next sign-in or within the hour)" : ""}.`
          : `${row.fullName}'s application was turned down. They'll see your note on their profile.`,
      );
      setRejecting(null);
      setNote("");
    } catch (error) {
      setActionError({ id: row.uid, message: error instanceof Error ? error.message : "The decision wasn't saved. Try again." });
    } finally {
      setBusyId(null);
    }
  }

  const all = rows ?? [];
  const visible = all.filter((row) => matches(row, show, now));
  const count = (s: Show) => (rows ? all.filter((row) => matches(row, s, now)).length : undefined);
  const labels: Record<Show, string> = { pending: "Waiting", expiring: "Expiring", verified: "Verified", rejected: "Not accepted", all: "All" };

  return (
    <>
      <PageHeading
        title="Agents"
        description="Practitioner applications. Check each FFC number on the PPRA register, then verify it or say what is wrong. Verifying gives the account agent access."
        action={
          <a href={PPRA_URL} target="_blank" rel="noopener noreferrer" className={secondaryButtonClass}>
            Open the PPRA website<span className="sr-only"> (new tab)</span>
          </a>
        }
      />
      <section aria-label="Practitioner applications" className={panelClass}>
        <FilterChips<Show>
          label="Show applications"
          value={show}
          onChange={setShow}
          options={SHOWS.map((value) => ({ value, label: labels[value], count: count(value) }))}
        />

        {done ? <p role="status" className="mb-3 rounded-control border border-emerald-400/40 bg-emerald-50 p-3.5 text-sm text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-200">{done}</p> : null}

        {loadError ? (
          <p role="alert" className={errorBoxClass}>Applications couldn&rsquo;t be loaded. Check your connection and refresh the page.</p>
        ) : !rows ? (
          <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading…</p>
        ) : visible.length === 0 ? (
          <p className={emptyBoxClass}>{EMPTY_FOR[show]}</p>
        ) : (
          <ul className="space-y-3">
            {visible.map((row) => {
              const state = complianceState(row, now);
              const pending = row.status === "pending";
              const busy = busyId === row.uid;
              const isSelf = row.uid === user?.uid;
              return (
                <li
                  key={row.uid}
                  className={`rounded-control border bg-[#f4f7f7] p-3.5 text-sm dark:bg-surface-ink/70 ${
                    pending
                      ? "border-slate-200 border-l-4 border-l-amber-500 dark:border-white/10 dark:border-l-amber-400"
                      : "border-slate-200 dark:border-white/10"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-slate-900 dark:text-white">{row.fullName || "No name given"}</p>
                      <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                        {row.agencyName || "No agency given"}
                        {row.submittedAt ? ` · Sent ${formatDateTime(row.submittedAt)}` : ""}
                      </p>
                    </div>
                    <ComplianceBadge state={state} />
                  </div>

                  <dl className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-4">
                    <div><dt className="text-xs text-slate-600 dark:text-slate-400">FFC number</dt><dd className="font-semibold text-slate-900 dark:text-white">{row.ffcNumber}</dd></div>
                    <div>
                      <dt className="text-xs text-slate-600 dark:text-slate-400">Expires</dt>
                      <dd className="font-semibold text-slate-900 dark:text-white">
                        {row.ffcExpiry ? formatDate(`${row.ffcExpiry}T12:00:00Z`) : "–"}
                        {state.kind === "expiring" ? <span className="font-normal text-amber-800 dark:text-amber-300"> · in {state.daysLeft} d</span> : null}
                        {state.kind === "expired" ? <span className="font-normal text-rose-700 dark:text-rose-300"> · expired</span> : null}
                      </dd>
                    </div>
                    <div><dt className="text-xs text-slate-600 dark:text-slate-400">Email</dt><dd className="truncate">{row.email ? <a href={`mailto:${row.email}`} className={linkClass}>{row.email}</a> : "–"}</dd></div>
                    <div><dt className="text-xs text-slate-600 dark:text-slate-400">Phone</dt><dd>{row.phone ? <a href={`tel:${row.phone.replace(/\s+/g, "")}`} className={linkClass}>{row.phone}</a> : "–"}</dd></div>
                  </dl>

                  {row.status === "rejected" && row.decisionNote ? (
                    <p className="mt-2 text-slate-700 dark:text-slate-300">Your note: &ldquo;{row.decisionNote}&rdquo;</p>
                  ) : null}

                  {actionError?.id === row.uid ? <p role="alert" className={`mt-3 ${errorBoxClass}`}>{actionError.message}</p> : null}

                  {pending && isSelf ? (
                    <p className="mt-3 text-slate-600 dark:text-slate-400">This is your own application; another admin has to decide it.</p>
                  ) : pending && rejecting === row.uid ? (
                    <div className="mt-3">
                      <label htmlFor={noteId} className="mb-1.5 block font-semibold text-slate-800 dark:text-slate-200">What is wrong?</label>
                      <textarea
                        id={noteId}
                        rows={2}
                        maxLength={500}
                        value={note}
                        onChange={(e) => {
                          setNote(e.target.value);
                          if (noteError) setNoteError("");
                        }}
                        aria-invalid={noteError ? true : undefined}
                        aria-describedby={noteError ? `${noteId}-error` : `${noteId}-hint`}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none aria-[invalid=true]:border-rose-500 dark:border-white/10 dark:bg-surface-ink dark:text-white"
                      />
                      {noteError ? (
                        <p id={`${noteId}-error`} className="mt-1 text-rose-700 dark:text-rose-300">{noteError}</p>
                      ) : (
                        <p id={`${noteId}-hint`} className="mt-1 text-xs text-slate-600 dark:text-slate-400">The applicant sees this on their profile.</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button type="button" disabled={busy} onClick={() => void decide(row, "reject")} className="pill max-lg:min-h-11 bg-rose-700 font-semibold text-white hover:bg-rose-800 disabled:opacity-60">
                          {busy ? "Saving…" : `Turn down ${row.fullName.split(" ")[0] || "application"}`}
                        </button>
                        <button type="button" onClick={() => { setRejecting(null); setNote(""); setNoteError(""); }} className={secondaryButtonClass}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : pending ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" disabled={busy || state.kind === "expired"} onClick={() => void decide(row, "verify")} className={primaryButtonClass}>
                        {busy ? "Saving…" : "Verify and give agent access"}
                      </button>
                      <button type="button" disabled={busy} onClick={() => { setRejecting(row.uid); setNote(""); setNoteError(""); }} className={secondaryButtonClass}>
                        Turn down
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

export default function AdminAgentsPage() {
  return (
    <Suspense fallback={<p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading…</p>}>
      <AgentsQueue />
    </Suspense>
  );
}
