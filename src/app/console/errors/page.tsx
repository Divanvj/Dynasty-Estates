"use client";

import { useState } from "react";

import { ConsoleRequestError, consoleJson, dateTime, timeAgo, useConsole, useConsoleData } from "../_lib/console-client";
import type { ErrorGroup, ErrorGroups } from "../_lib/types";
import { ChevronRightIcon } from "../_components/console-icons";
import { Button, Empty, ErrorNotice, PageHeader, Pill, RefreshButton, Segmented, SkeletonRows, cx } from "../_components/ui";

type Filter = "open" | "resolved" | "all";

export default function ErrorsPage() {
  const { user } = useConsole();
  const [days, setDays] = useState<"1" | "7" | "30">("7");
  const [filter, setFilter] = useState<Filter>("open");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<ConsoleRequestError | null>(null);
  const { data, error, loading, refresh, loadedAt } = useConsoleData<ErrorGroups>(`/api/console/errors?days=${days}`);

  const groups = (data?.groups ?? []).filter((g) => (filter === "all" ? true : filter === "open" ? !g.resolved : g.resolved));

  async function setResolved(group: ErrorGroup, resolved: boolean) {
    setBusy(group.fingerprint);
    setActionError(null);
    try {
      await consoleJson(user, "/api/console/errors", {
        method: "PATCH",
        body: JSON.stringify({ fingerprint: group.fingerprint, resolved }),
      });
      await refresh();
    } catch (err) {
      setActionError(err as ConsoleRequestError);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Errors"
        description="Browser errors, server errors and error-page crashes reported by the site, grouped so the same fault on different pages counts once. Resolving a group hides it until it happens again."
        actions={
          <>
            <Segmented
              label="Time range"
              value={days}
              onChange={setDays}
              options={[
                { value: "1", label: "24 h" },
                { value: "7", label: "7 days" },
                { value: "30", label: "30 days" },
              ]}
            />
            <RefreshButton onClick={refresh} loading={loading} loadedAt={loadedAt} />
          </>
        }
      />

      {error ? <ErrorNotice error={error} onRetry={refresh} /> : null}
      {actionError ? (
        <div className="mb-4">
          <ErrorNotice error={actionError} />
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Show"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "open", label: `Open (${data?.groups.filter((g) => !g.resolved).length ?? 0})` },
            { value: "resolved", label: "Resolved" },
            { value: "all", label: "All" },
          ]}
        />
        {data?.truncated ? <span className="text-xs text-amber-200">Showing the latest 2,000 occurrences only.</span> : null}
      </div>

      {!data && loading ? (
        <SkeletonRows rows={5} />
      ) : groups.length === 0 ? (
        <Empty title={filter === "open" ? "No open errors" : "Nothing here"}>
          {filter === "open"
            ? "Nothing has gone wrong in this range, or every error has been resolved. To check the pipeline works end to end, send a test error from Tools."
            : "Change the filter or the time range."}
        </Empty>
      ) : (
        <ul className="space-y-2">
          {groups.map((group) => {
            const open = expanded === group.fingerprint;
            return (
              <li key={group.fingerprint} className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a1517]">
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : group.fingerprint)}
                  aria-expanded={open}
                  className="flex w-full cursor-pointer items-start gap-3 px-5 py-4 text-left hover:bg-white/[0.02] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--brand)]"
                >
                  <ChevronRightIcon className={cx("mt-0.5 h-4 w-4 shrink-0 text-[var(--ink-subtle)] transition-transform duration-200", open && "rotate-90")} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--ink)]">{group.name}</span>
                      <Pill tone={group.source === "server" ? "warn" : "neutral"}>{group.source}</Pill>
                      {group.test ? <Pill tone="brand">test</Pill> : null}
                      {group.resolved ? <Pill tone="good">resolved</Pill> : null}
                    </div>
                    <p className="mt-1 line-clamp-2 break-words text-xs text-[var(--ink-muted)]">{group.message}</p>
                    <p className="mt-1.5 text-xs text-[var(--ink-subtle)]">
                      {group.routes.map(([route]) => route).join(", ")}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-semibold text-[var(--ink)] tabular-nums">{group.count}</p>
                    <p className="text-xs text-[var(--ink-subtle)]">{timeAgo(group.lastSeen)}</p>
                  </div>
                </button>

                {open ? (
                  <div className="border-t border-white/[0.06] px-5 py-4">
                    <dl className="grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                      <Fact k="First seen" v={dateTime(group.firstSeen)} />
                      <Fact k="Last seen" v={dateTime(group.lastSeen)} />
                      <Fact k="Visitors affected" v={`${group.sessions} session${group.sessions === 1 ? "" : "s"}`} />
                      <Fact k="Build" v={group.sample.release ? group.sample.release.slice(0, 7) : "unknown"} mono />
                      {group.sample.digest ? <Fact k="Digest" v={group.sample.digest} mono /> : null}
                      {group.sample.url ? <Fact k="Example URL" v={group.sample.url} /> : null}
                      {group.resolvedBy ? <Fact k="Resolved by" v={group.resolvedBy} /> : null}
                    </dl>
                    <div className="mt-3">
                      <p className="mb-1 text-xs text-[var(--ink-subtle)]">Pages</p>
                      <ul className="flex flex-wrap gap-1.5">
                        {group.routes.map(([route, n]) => (
                          <li key={route}>
                            <Pill>
                              {route} · {n}
                            </Pill>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {group.sample.stack ? (
                      <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-black/40 p-3 font-mono text-xs leading-relaxed text-[var(--ink-muted)]">
                        {group.sample.stack}
                      </pre>
                    ) : (
                      <p className="mt-3 text-xs text-[var(--ink-subtle)]">No stack trace was sent with this error.</p>
                    )}
                    {group.sample.userAgent ? <p className="mt-2 break-words text-xs text-[var(--ink-subtle)]">{group.sample.userAgent}</p> : null}
                    <div className="mt-4 flex gap-2">
                      {group.resolved ? (
                        <Button onClick={() => void setResolved(group, false)} loading={busy === group.fingerprint}>
                          Reopen
                        </Button>
                      ) : (
                        <Button variant="primary" onClick={() => void setResolved(group, true)} loading={busy === group.fingerprint}>
                          Mark resolved
                        </Button>
                      )}
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function Fact({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[var(--ink-subtle)]">{k}</dt>
      <dd className={cx("mt-0.5 break-words text-[var(--ink)]", mono && "font-mono")}>{v}</dd>
    </div>
  );
}
