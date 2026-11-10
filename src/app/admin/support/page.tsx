"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import {
  emptyBoxClass,
  errorBoxClass,
  FilterChips,
  formatAge,
  linkClass,
  PageHeading,
  panelClass,
  secondaryButtonClass,
} from "@/components/dashboard-ui";
import { formatDateTime } from "@/lib/formatters";
import {
  getSupportRequests,
  PACKAGE_REQUEST_PREFIX,
  setSupportRequestStatus,
  type SupportRequest,
  type SupportStatus,
} from "@/lib/support-requests";

// Pattern 10A — Inbox (docs/dashboards/PLAN.md, Phase A). Support & Guidance
// messages and package requests, worked in place: New → In progress → Closed.
// Replies go out by email from the admin's own mailbox; nothing is sent from here.

type Show = "all" | SupportStatus;

const STATUS_LABEL: Record<SupportStatus, string> = { new: "New", in_progress: "In progress", closed: "Closed" };

function asStatus(value: string): SupportStatus {
  return value === "in_progress" || value === "closed" ? value : "new";
}

function SupportInbox() {
  const params = useSearchParams();
  const initial = params.get("show");
  const { user, loading } = useAuth();
  const [requests, setRequests] = useState<SupportRequest[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [show, setShow] = useState<Show>(initial === "new" || initial === "in_progress" || initial === "closed" ? initial : "all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    getSupportRequests()
      .then((rows) => !cancelled && setRequests(rows))
      .catch((error) => {
        console.error(error);
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  async function change(request: SupportRequest, status: SupportStatus) {
    setSavingId(request.id);
    setSaveError(null);
    try {
      await setSupportRequestStatus(request.id, status);
      setRequests((prev) => (prev ?? []).map((row) => (row.id === request.id ? { ...row, status } : row)));
    } catch (error) {
      console.error("Support status change failed:", error);
      setSaveError("That change wasn't saved. Check your connection and try again.");
    } finally {
      setSavingId(null);
    }
  }

  const rows = requests ?? [];
  const count = (status: SupportStatus) => rows.filter((row) => asStatus(row.status) === status).length;
  const visible = rows.filter((row) => show === "all" || asStatus(row.status) === show);

  return (
    <>
      <PageHeading
        title="Support"
        description="Messages from Support & Guidance and package requests, newest first. Reply by email; mark each one so the team knows where it stands."
      />
      <section aria-label="Support requests" className={panelClass}>
        <FilterChips<Show>
          label="Show requests"
          value={show}
          onChange={setShow}
          options={[
            { value: "all", label: "All", count: requests ? rows.length : undefined },
            { value: "new", label: "New", count: requests ? count("new") : undefined },
            { value: "in_progress", label: "In progress", count: requests ? count("in_progress") : undefined },
            { value: "closed", label: "Closed", count: requests ? count("closed") : undefined },
          ]}
        />

        {saveError ? <p role="alert" className={`mb-3 ${errorBoxClass}`}>{saveError}</p> : null}

        {loadError ? (
          <p role="alert" className={errorBoxClass}>Support requests couldn&rsquo;t be loaded. Check your connection and refresh the page.</p>
        ) : !requests ? (
          <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading…</p>
        ) : visible.length === 0 ? (
          <p className={emptyBoxClass}>{show === "all" ? "No support requests yet." : `Nothing ${STATUS_LABEL[show].toLowerCase()}.`}</p>
        ) : (
          <ul className="space-y-3">
            {visible.map((request) => {
              const status = asStatus(request.status);
              const isNew = status === "new";
              const isPackage = request.message.startsWith(PACKAGE_REQUEST_PREFIX);
              const saving = savingId === request.id;
              return (
                <li
                  key={request.id}
                  className={`rounded-control border bg-[#f4f7f7] p-3.5 text-sm dark:bg-surface-ink/70 ${
                    isNew
                      ? "border-slate-200 border-l-4 border-l-emerald-600 dark:border-white/10 dark:border-l-emerald-400"
                      : "border-slate-200 dark:border-white/10"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      {request.userEmail ? (
                        <a href={`mailto:${request.userEmail}`} className={`${linkClass} ${isNew ? "font-bold" : ""} break-all`}>{request.userEmail}</a>
                      ) : (
                        <span className="font-semibold text-slate-900 dark:text-white">{request.userId}</span>
                      )}
                      {isPackage ? (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-900 dark:text-amber-200">Package request</span>
                      ) : null}
                    </div>
                    <span className="text-slate-600 dark:text-slate-400">
                      {request.createdAt ? `${formatDateTime(request.createdAt)} · ${formatAge(new Date(request.createdAt), now)} ago` : "Just now"}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-slate-800 dark:text-slate-200">{request.message}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full border border-slate-300 bg-white/60 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-300">
                      {STATUS_LABEL[status]}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {status === "new" ? (
                        <button type="button" disabled={saving} onClick={() => void change(request, "in_progress")} className={secondaryButtonClass}>
                          {saving ? "Saving…" : "Mark in progress"}
                        </button>
                      ) : null}
                      {status !== "closed" ? (
                        <button type="button" disabled={saving} onClick={() => void change(request, "closed")} className={secondaryButtonClass}>
                          {saving ? "Saving…" : "Close"}
                        </button>
                      ) : (
                        <button type="button" disabled={saving} onClick={() => void change(request, "new")} className={secondaryButtonClass}>
                          {saving ? "Saving…" : "Reopen"}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

export default function AdminSupportPage() {
  return (
    <Suspense fallback={<p role="status" className="text-sm text-slate-600 dark:text-slate-400">Loading…</p>}>
      <SupportInbox />
    </Suspense>
  );
}
