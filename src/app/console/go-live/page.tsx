"use client";

import { useConsoleData } from "../_lib/console-client";
import type { GoLiveCheck } from "../_lib/types";
import { CopyFix } from "../_components/copy-fix";
import { ErrorNotice, PageHeader, RefreshButton, RowLink, SkeletonRows, StateBadge } from "../_components/ui";

const ORDER = { error: 0, warning: 1, blocked: 2, unknown: 3, ok: 4 } as const;

export default function GoLivePage() {
  const { data, error, loading, refresh, loadedAt } = useConsoleData<{ checks: GoLiveCheck[] }>("/api/console/go-live");
  const checks = [...(data?.checks ?? [])].sort((a, b) => ORDER[a.state] - ORDER[b.state]);
  const counts = checks.reduce<Record<string, number>>((acc, c) => ((acc[c.state] = (acc[c.state] ?? 0) + 1), acc), {});

  return (
    <>
      <PageHeader
        title="Go-live checklist"
        description="Everything that has to be true before Dynasty Estates takes real traffic. Each line is checked live against Firebase, GitHub and the production site; blocked items wait on the Blaze plan or an access grant."
        actions={<RefreshButton onClick={refresh} loading={loading} loadedAt={loadedAt} />}
      />

      {error ? <ErrorNotice error={error} onRetry={refresh} /> : null}

      {data ? (
        <p className="mb-4 text-xs text-[var(--ink-subtle)] tabular-nums">
          {counts.ok ?? 0} passing · {counts.error ?? 0} problems · {counts.warning ?? 0} need attention · {counts.blocked ?? 0} blocked ·{" "}
          {counts.unknown ?? 0} could not be checked
        </p>
      ) : null}

      <ol className="space-y-3">
        {!data && loading ? (
          <SkeletonRows rows={8} />
        ) : (
          checks.map((check) => (
            <li key={check.id} className="rounded-2xl border border-white/[0.07] bg-[#0a1517] px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-[var(--ink)]">{check.label}</h2>
                <StateBadge state={check.state} />
              </div>
              <p className="mt-1.5 max-w-[80ch] text-xs leading-relaxed text-[var(--ink-muted)]">{check.summary}</p>
              {check.state !== "ok" && check.fix ? <CopyFix text={check.fix} /> : null}
              {check.href ? (
                <div className="mt-2">
                  <RowLink href={check.href}>Details</RowLink>
                </div>
              ) : null}
            </li>
          ))
        )}
      </ol>
    </>
  );
}
