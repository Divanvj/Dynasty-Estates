"use client";

import { dateTime, shortSha, timeAgo, useConsoleData } from "../_lib/console-client";
import type { Deploys } from "../_lib/types";
import { ExternalIcon } from "../_components/console-icons";
import { Empty, ErrorNotice, Facts, PageHeader, Panel, Pill, RefreshButton, SkeletonRows, StateBadge } from "../_components/ui";

function behindBadge(n: number | null, known: boolean) {
  if (!known) return <StateBadge state="unknown" label="Not reported" />;
  if (n === null) return <StateBadge state="unknown" label="Could not compare" />;
  if (n === 0) return <StateBadge state="ok" label="Up to date with main" />;
  return <StateBadge state="warning" label={`${n} commit${n === 1 ? "" : "s"} behind main`} />;
}

const shaLink = (repo: string, sha: string | null) =>
  sha && sha !== "unknown" ? (
    <a href={`https://github.com/${repo}/commit/${sha}`} target="_blank" rel="noreferrer" className="font-mono text-[var(--brand)] hover:underline">
      {shortSha(sha)}
    </a>
  ) : (
    <span className="font-mono">unknown</span>
  );

export default function DeploysPage() {
  const { data, error, loading, refresh, loadedAt } = useConsoleData<Deploys>("/api/console/deploys");

  return (
    <>
      <PageHeader
        title="Deploys and code"
        description="Which commit production and this console are running, how far behind main they are, CI on main, and who has claimed what in WORKING_ON.md. Read from GitHub (public repo) and the sites themselves."
        actions={<RefreshButton onClick={refresh} loading={loading} loadedAt={loadedAt} />}
      />

      {error ? <ErrorNotice error={error} onRetry={refresh} /> : null}
      {!data && loading ? <SkeletonRows rows={8} /> : null}

      {data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Production" description={data.production.url} actions={behindBadge(data.production.commitsBehindMain, Boolean(data.production.sha))}>
            {data.production.sha ? (
              <Facts
                rows={[
                  ["Commit", shaLink(data.github.repo, data.production.sha)],
                  ["Built", data.production.builtAt ? `${dateTime(data.production.builtAt)} (${timeAgo(data.production.builtAt)})` : "unknown"],
                  ["Environment", data.production.env ?? "unknown"],
                ]}
              />
            ) : (
              <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
                Production does not answer <code className="font-mono">/api/platform/build</code> yet, so it was deployed before the
                console existed. Deploy once and this fills in. Vercel is not git-connected:{" "}
                <code className="font-mono text-[var(--ink)]">npx --yes vercel@65.2.0 deploy --prod --yes</code>
              </p>
            )}
          </Panel>

          <Panel title="This console" description="The deployment you are looking at now." actions={behindBadge(data.thisBuild.commitsBehindMain, data.thisBuild.sha !== "unknown")}>
            <Facts
              rows={[
                ["Commit", shaLink(data.github.repo, data.thisBuild.sha)],
                ["Built", data.thisBuild.builtAt ? `${dateTime(data.thisBuild.builtAt)} (${timeAgo(data.thisBuild.builtAt)})` : "unknown"],
                ["Environment", data.thisBuild.env],
              ]}
            />
            {data.thisBuild.env === "development" ? (
              <p className="mt-3 text-xs text-[var(--ink-subtle)]">
                A dev server reads its commit when it starts, so this can lag behind the checked-out branch.
              </p>
            ) : null}
          </Panel>

          <Panel
            title="Main branch"
            description={data.github.reachable ? `github.com/${data.github.repo}` : "GitHub could not be reached"}
            actions={
              data.github.main ? (
                <a href={data.github.main.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)] hover:underline">
                  <ExternalIcon className="h-3.5 w-3.5" /> GitHub
                </a>
              ) : null
            }
            bodyClassName="px-0 py-0"
          >
            {data.github.rateLimited ? (
              <p className="px-5 py-4 text-xs text-amber-200">
                GitHub rate limit reached (60 requests an hour without a token). Add GITHUB_TOKEN to raise it.
              </p>
            ) : null}
            <ul className="divide-y divide-white/[0.05]">
              {data.github.commits.map((c) => (
                <li key={c.sha} className="flex items-baseline gap-3 px-5 py-2.5 text-xs">
                  <a href={c.url} target="_blank" rel="noreferrer" className="shrink-0 font-mono text-[var(--brand)] hover:underline">
                    {c.sha.slice(0, 7)}
                  </a>
                  <span className="min-w-0 flex-1 truncate text-[var(--ink)]" title={c.message}>
                    {c.message}
                  </span>
                  <span className="shrink-0 text-[var(--ink-subtle)]">{timeAgo(c.date)}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <div className="flex flex-col gap-6">
            <Panel title="CI on main" description=".github/workflows/ci.yml" bodyClassName="px-0 py-0">
              {data.github.ci.length === 0 ? (
                <p className="px-5 py-4 text-xs text-[var(--ink-subtle)]">No runs found.</p>
              ) : (
                <ul className="divide-y divide-white/[0.05]">
                  {data.github.ci.map((run) => (
                    <li key={run.id} className="flex items-center gap-3 px-5 py-2.5 text-xs">
                      <StateBadge
                        state={run.status !== "completed" ? "unknown" : run.conclusion === "success" ? "ok" : "error"}
                        label={run.status !== "completed" ? run.status : (run.conclusion ?? "done")}
                      />
                      <a href={run.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-[var(--ink)] hover:underline" title={run.title}>
                        {run.title}
                      </a>
                      <span className="shrink-0 text-[var(--ink-subtle)]">{timeAgo(run.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Claimed work" description="WORKING_ON.md on main: what each machine's agent is doing.">
              {data.github.claims.length === 0 ? (
                <p className="text-xs text-[var(--ink-subtle)]">No open claims.</p>
              ) : (
                <ul className="space-y-3">
                  {data.github.claims.map((c, i) => (
                    <li key={i} className="text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill tone="brand">{c.machine}</Pill>
                        <span className="font-mono text-[var(--ink)]">{c.branch}</span>
                        <span className="text-[var(--ink-subtle)]">since {c.since}</span>
                      </div>
                      <p className="mt-1 text-[var(--ink-muted)]">{c.area}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <Panel
            className="lg:col-span-2"
            title="Vercel deployments"
            description={data.vercel.connected ? "Latest deployments of the dynasty-estates project." : "Not connected."}
            bodyClassName={data.vercel.connected ? "px-0 py-0" : undefined}
          >
            {!data.vercel.connected ? (
              <Empty title="Vercel API not connected">
                Add a VERCEL_TOKEN (and optionally VERCEL_TEAM_ID) to the environment to list deployments here. Production&apos;s
                commit above works without it.
                {"error" in data.vercel && data.vercel.error ? <span className="mt-1 block text-amber-200">{data.vercel.error}</span> : null}
              </Empty>
            ) : (
              <ul className="divide-y divide-white/[0.05]">
                {data.vercel.deployments.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5 text-xs">
                    <StateBadge state={d.state === "READY" ? "ok" : d.state === "ERROR" ? "error" : "unknown"} label={d.state.toLowerCase()} />
                    <Pill tone={d.target === "production" ? "brand" : "neutral"}>{d.target}</Pill>
                    <a href={d.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-[var(--ink)] hover:underline">
                      {d.url.replace("https://", "")}
                    </a>
                    {d.sha ? <span className="font-mono text-[var(--ink-subtle)]">{d.sha.slice(0, 7)}</span> : null}
                    <span className="text-[var(--ink-subtle)]">{timeAgo(d.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      ) : null}
    </>
  );
}
