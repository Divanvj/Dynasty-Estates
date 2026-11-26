"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import {
  AgeChip,
  emptyBoxClass,
  errorBoxClass,
  FilterChips,
  formatAge,
  Initials,
  linkClass,
  PageHeading,
  panelClass,
  secondaryButtonClass,
  SummaryStrip,
} from "@/components/dashboard-ui";
import { QUEUE_TARGET_MS } from "@/lib/dashboard-math";
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
  const oldestNew = rows
    .filter((row) => asStatus(row.status) === "new" && row.createdAt)
    .reduce<Date | null>((old, row) => {
      const at = new Date(row.createdAt!);
      return !old || at < old ? at : old;
    }, null);
  const newLate = oldestNew !== null && now - oldestNew.getTime() > QUEUE_TARGET_MS;
  const openPackages = rows.filter((row) => asStatus(row.status) !== "closed" && row.message.startsWith(PACKAGE_REQUEST_PREFIX)).length;

  return (
    <>
      <PageHeading
        title="Support"
        description="Messages sent through Help & support, and package requests, newest first. Reply by email; mark each one so the team knows where it stands."
      />
      <SummaryStrip
        label="Support at a glance"
        items={[
          {
            label: "New",
            value: requests ? String(count("new")) : null,
            note: oldestNew ? `Oldest ${formatAge(oldestNew, now)}${newLate ? ", past the 24 h target" : ""}` : "Nothing new",
            tone: newLate ? "late" : undefined,
          },
          { label: "In progress", value: requests ? String(count("in_progress")) : null, note: "Being handled" },
          { label: "Package requests", value: requests ? String(openPackages) : null, note: "Open, to invoice by hand", tone: openPackages ? "accent" : undefined },
        ]}
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
                  className={`relative flex gap-3.5 rounded-2xl border p-4 text-sm ${
                    isNew
                      ? "border-[var(--dash-line-2)] bg-[var(--dash-card-2)] before:absolute before:inset-y-4 before:left-0 before:w-[3px] before:rounded-r-full before:bg-[var(--dash-d1)]"
                      : "border-[var(--dash-line)] bg-[var(--dash-card)]"
                  }`}
                >
                  <span className="hidden sm:block">
                    <Initials name={(request.userEmail || "?").split("@")[0].replace(/[._-]+/g, " ")} size={42} />
                  </span>
                  <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      {request.userEmail ? (
                        <a href={`mailto:${request.userEmail}`} className={`${linkClass} ${isNew ? "font-bold" : ""} break-all`}>{request.userEmail}</a>
                      ) : (
                        <span className="font-semibold text-slate-900 dark:text-white">{request.userId}</span>
                      )}
                      {isPackage ? (
                        <AgeChip label="Package request" tone="soon" />
                      ) : null}
                    </div>
                    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      {request.createdAt ? formatDateTime(request.createdAt) : "Just now"}
                      {request.createdAt ? (
                        <AgeChip
                          label={`${formatAge(new Date(request.createdAt), now)} ago`}
                          tone={isNew && now - new Date(request.createdAt).getTime() > QUEUE_TARGET_MS ? "late" : "neutral"}
                        />
                      ) : null}
                    </span>
                  </div>
                  <p className="mt-2.5 whitespace-pre-wrap rounded-xl border border-[var(--dash-line)] bg-[var(--dash-card)] px-3.5 py-2.5 text-slate-800 dark:text-slate-200">{request.message}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <AgeChip label={STATUS_LABEL[status]} tone={status === "in_progress" ? "good" : "neutral"} />
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
