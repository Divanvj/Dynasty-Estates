"use client";

import { ConsoleRequestError, dateTime, formatInt, useConsoleData } from "../_lib/console-client";
import type { FirebaseStatus } from "../_lib/types";
import { CopyFix } from "../_components/copy-fix";
import { ErrorNotice, Facts, PageHeader, Panel, Pill, RefreshButton, SkeletonRows, StateBadge } from "../_components/ui";

const SERVER_ONLY = new Set(["app_errors", "app_error_groups", "web_vitals", "console_events", "platform_config"]);

export default function FirebasePage() {
  const { data, error, loading, refresh, loadedAt } = useConsoleData<FirebaseStatus>("/api/console/firebase");
  const fb = data && data.connected ? data : null;

  return (
    <>
      <PageHeader
        title="Firebase"
        description="Project dynasty-estates as it is deployed: security rules and indexes compared with main, sign-in settings, collection sizes, and what the Spark plan blocks."
        actions={<RefreshButton onClick={refresh} loading={loading} loadedAt={loadedAt} />}
      />

      {error ? <ErrorNotice error={error} onRetry={refresh} /> : null}
      {!data && loading ? <SkeletonRows rows={8} /> : null}

      {fb ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Firestore security rules" actions={<StateBadge state={fb.rules.state} label={fb.rules.state === "ok" ? "Matches main" : fb.rules.state === "warning" ? "Differs from main" : undefined} />}>
            <Facts
              rows={[
                ["Deployed", fb.rules.deployedAt ? dateTime(new Date(fb.rules.deployedAt).toISOString()) : "unknown"],
                ["Deployed size", fb.rules.deployedLength === null ? "—" : `${formatInt(fb.rules.deployedLength)} characters`],
                ["firestore.rules on main", fb.rules.repoLength === null ? "—" : `${formatInt(fb.rules.repoLength)} characters`],
              ]}
            />
            <p className="mt-3 text-xs leading-relaxed text-[var(--ink-subtle)]">
              Compared with comments and whitespace removed, so a comment-only edit does not count as drift.
            </p>
            {fb.rules.error ? <p className="mt-2 text-xs text-amber-200">{fb.rules.error}</p> : null}
            {fb.rules.state === "warning" ? (
              <CopyFix text="Deploy from a scratch folder holding git show origin/main:firestore.rules (the shared checkout is often on another branch): npx.cmd firebase-tools deploy --only firestore:rules --project dynasty-estates" />
            ) : null}
          </Panel>

          <Panel title="Composite indexes" actions={<StateBadge state={fb.indexes.state} />}>
            {fb.indexes.error ? <p className="mb-2 text-xs text-amber-200">{fb.indexes.error}</p> : null}
            <ul className="space-y-1.5">
              {fb.indexes.deployed.map((i) => (
                <li key={i.key} className="flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 break-all font-mono text-[var(--ink-muted)]">{i.key}</span>
                  <span className="flex shrink-0 gap-1.5">
                    <Pill tone={i.state === "READY" ? "good" : "warn"}>{i.state.toLowerCase()}</Pill>
                    {!i.inRepo ? <Pill tone="warn">not in repo</Pill> : null}
                  </span>
                </li>
              ))}
              {fb.indexes.missing.map((key) => (
                <li key={key} className="flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 break-all font-mono text-[var(--ink-muted)]">{key}</span>
                  <Pill tone="bad">not deployed</Pill>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Sign-in" description="Authentication settings read from Identity Platform.">
            {fb.auth.error ? <p className="mb-2 text-xs text-amber-200">{fb.auth.error}</p> : null}
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(fb.auth.providers).map(([name, on]) => (
                <Pill key={name} tone={on ? "good" : "neutral"}>
                  {name} {on ? "on" : "off"}
                </Pill>
              ))}
            </div>
            <p className="mt-4 text-xs text-[var(--ink-subtle)]">Authorised domains</p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {fb.auth.authorizedDomains.map((d) => (
                <li key={d}>
                  <Pill tone={d === fb.auth.siteHost ? "brand" : "neutral"}>{d}</Pill>
                </li>
              ))}
            </ul>
            {!fb.auth.siteHostAuthorized ? (
              <p className="mt-3 text-xs text-rose-300">{fb.auth.siteHost} (the production site) is not authorised, so Google and phone sign-in fail there.</p>
            ) : null}
            {fb.auth.tunnelDomains.length ? (
              <p className="mt-3 text-xs text-[var(--ink-subtle)]">
                {fb.auth.tunnelDomains.length} cloudflared demo tunnel domain(s) are authorised. They change on every tunnel restart.
              </p>
            ) : null}
          </Panel>

          <Panel title="Spark plan limits" description="Services that need the Blaze plan or an access grant.">
            <ul className="space-y-3 text-xs">
              <li className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--ink)]">Cloud Storage</p>
                  <p className="mt-0.5 text-[var(--ink-subtle)]">
                    Bucket <span className="font-mono">{fb.storage.bucket}</span>.{" "}
                    {fb.storage.state === "blocked" ? "Not created, so listing photos cannot upload." : fb.storage.error ?? "Exists."}
                  </p>
                </div>
                <StateBadge state={fb.storage.state} />
              </li>
              <li className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--ink)]">Usage metrics (Cloud Monitoring)</p>
                  <p className="mt-0.5 text-[var(--ink-subtle)]">
                    {fb.monitoring.state === "ok"
                      ? "Readable."
                      : "The service account lacks the Monitoring Viewer role. This is an IAM grant, not a plan upgrade."}
                  </p>
                </div>
                <StateBadge state={fb.monitoring.state} />
              </li>
              <li className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--ink)]">Cloud Functions and scheduled jobs</p>
                  <p className="mt-0.5 text-[var(--ink-subtle)]">Uptime checks, nightly scans and alerts run on demand from the console until Blaze.</p>
                </div>
                <StateBadge state="blocked" />
              </li>
            </ul>
          </Panel>

          <Panel className="lg:col-span-2" title="Collections" description="Document counts. Server-only collections are written by the console and telemetry through the Admin SDK; no client rule grants access to them.">
            <div className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {fb.collections.map((c) => (
                <div key={c.name} className="flex items-center justify-between gap-3 border-b border-white/[0.05] py-2 text-xs">
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[var(--ink)]">{c.name}</span>
                    {SERVER_ONLY.has(c.name) ? <Pill>server only</Pill> : null}
                  </span>
                  <span className="font-semibold text-[var(--ink)] tabular-nums">{c.count === null ? "—" : formatInt(c.count)}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      ) : data && !data.connected ? (
        <ErrorNotice error={new ConsoleRequestError(data.error ?? "Not connected.", 503, true)} />
      ) : null}
    </>
  );
}
