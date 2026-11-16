"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { emptyBoxClass, errorBoxClass, PageHeading, panelClass, secondaryButtonClass } from "@/components/dashboard-ui";
import { formatDateTime } from "@/lib/formatters";
import { getAuditLogs, type AuditLogEntry } from "@/lib/moderation";

// Pattern 10B-style activity feed (docs/dashboards/PLAN.md, Phase A). The
// append-only audit trail, newest first, in plain language, with "Load more".
// It used to be a five-column table of raw action codes.

const PAGE = 25;

const ACTION_LABEL: Record<string, string> = {
  "moderation.approved": "approved and published",
  "moderation.needs_changes": "sent back for changes",
  "moderation.rejected": "rejected",
  "practitioner.verify": "verified the practitioner",
  "practitioner.reject": "turned down the practitioner",
};

export default function AdminAuditPage() {
  const { user, loading } = useAuth();
  const [limit, setLimit] = useState(PAGE);
  const [result, setResult] = useState<{ limit: number; logs: AuditLogEntry[] } | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    getAuditLogs(limit)
      .then((logs) => !cancelled && setResult({ limit, logs }))
      .catch((error) => {
        console.error(error);
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [loading, user, limit]);

  const logs = result?.logs ?? [];
  const fetching = !loadError && result?.limit !== limit;
  const hasMore = result ? result.logs.length >= result.limit : false;

  return (
    <>
      <PageHeading
        title="Audit trail"
        description="Every moderation and agent-verification decision, newest first. Entries can't be edited or deleted, by anyone."
      />
      <section aria-label="Audit trail" className={panelClass}>
        {loadError ? (
          <p role="alert" className={errorBoxClass}>The audit trail couldn&rsquo;t be loaded. Check your connection and refresh the page.</p>
        ) : !result ? (
          <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading…</p>
        ) : logs.length === 0 ? (
          <p className={emptyBoxClass}>No actions recorded yet. Moderation and agent-verification decisions appear here.</p>
        ) : (
          <>
            <ol className="relative ml-1.5 border-l border-[var(--dash-line-2)]">
              {logs.map((log) => {
                const resource = log.resource.replace(/^properties\//, "listing ").replace(/^practitioners\//, "account ");
                const label = ACTION_LABEL[log.action];
                return (
                  <li key={log.id} className="relative flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 pl-6 text-sm before:absolute before:-left-[5px] before:top-[1.15rem] before:size-2.5 before:rounded-full before:border-2 before:border-[var(--dash-card)] before:bg-[var(--dash-d1)]">
                    <div className="min-w-0">
                      <p className="text-slate-900 dark:text-white">
                        <span className="font-semibold">{log.actorEmail ?? log.actorId}</span>{" "}
                        {label ?? <code className="rounded bg-[var(--dash-track)] px-1 text-xs">{log.action}</code>}{" "}
                        <span className="text-slate-600 dark:text-slate-300">{resource}</span>
                      </p>
                      {log.details ? <p className="mt-0.5 text-slate-600 dark:text-slate-400">{log.details}</p> : null}
                    </div>
                    <time dateTime={log.timestamp} className="shrink-0 tabular-nums text-xs text-slate-600 dark:text-slate-400">{formatDateTime(log.timestamp)}</time>
                  </li>
                );
              })}
            </ol>
            {hasMore ? (
              <button type="button" disabled={fetching} onClick={() => setLimit((n) => n + PAGE)} className={`mt-4 ${secondaryButtonClass}`}>
                {fetching ? "Loading…" : "Load more"}
              </button>
            ) : null}
          </>
        )}
      </section>
    </>
  );
}
