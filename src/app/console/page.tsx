"use client";

import Link from "next/link";
import { useState } from "react";

import { formatInt, timeAgo, useConsoleData } from "./_lib/console-client";
import type { Overview, GoLiveCheck } from "./_lib/types";
import { AlertIcon, BugIcon, ChevronRightIcon, DatabaseIcon, LogIcon, RocketIcon, ScanIcon, UsersGearIcon } from "./_components/console-icons";
import { BarList } from "./_components/bar-list";
import {
  Delta,
  ErrorNotice,
  PageHeader,
  Panel,
  RefreshButton,
  Segmented,
  Skeleton,
  StatTile,
  cx,
} from "./_components/ui";

type Period = "day" | "week" | "month";

const PERIOD_LABEL: Record<Period, string> = { day: "last 24 hours", week: "last 7 days", month: "last 30 days" };

type Attention = { id: string; text: string; href: string; tone: "bad" | "warn" };

function attentionItems(overview: Overview | null, checks: GoLiveCheck[] | null): Attention[] {
  const items: Attention[] = [];
  if (overview) {
    if (overview.errors.openGroups > 0) {
      items.push({
        id: "errors",
        text: `${overview.errors.openGroups} unresolved error ${overview.errors.openGroups === 1 ? "type" : "types"} in the ${PERIOD_LABEL[overview.period]}`,
        href: "/console/errors",
        tone: "bad",
      });
    }
    if (overview.queues.moderation > 0) {
      items.push({ id: "mod", text: `${overview.queues.moderation} listing(s) waiting for moderation`, href: "/admin", tone: "warn" });
    }
    if (overview.queues.supportNew > 0) {
      items.push({ id: "support", text: `${overview.queues.supportNew} support request(s) not yet answered`, href: "/admin", tone: "warn" });
    }
    if (overview.queues.fraud > 0) {
      items.push({ id: "fraud", text: `${overview.queues.fraud} listing(s) with fraud signals`, href: "/admin", tone: "bad" });
    }
  }
  for (const check of checks ?? []) {
    if (check.state === "error" || check.state === "warning") {
      items.push({ id: `check-${check.id}`, text: `${check.label}: ${check.summary}`, href: "/console/go-live", tone: check.state === "error" ? "bad" : "warn" });
    }
  }
  return items;
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("week");
  const overview = useConsoleData<Overview>(`/api/console/overview?period=${period}`);
  const goLive = useConsoleData<{ checks: GoLiveCheck[] }>("/api/console/go-live");
  const o = overview.data;
  const checks = goLive.data?.checks ?? null;
  const attention = attentionItems(o, checks);
  const passing = checks?.filter((c) => c.state === "ok").length ?? 0;
  const blocked = checks?.filter((c) => c.state === "blocked").length ?? 0;

  const refresh = () => {
    void overview.refresh();
    void goLive.refresh();
  };

  return (
    <>
      <PageHeader
        title="Platform health"
        description={
          <>
            What needs a person now, then each part of Dynasty Estates against the period before. All figures are read
            live from Firebase{o ? `, ${timeAgo(o.generatedAt)}` : ""}.
          </>
        }
        actions={
          <>
            <Segmented
              label="Period"
              value={period}
              onChange={setPeriod}
              options={[
                { value: "day", label: "Daily" },
                { value: "week", label: "Weekly" },
                { value: "month", label: "Monthly" },
              ]}
            />
            <RefreshButton onClick={refresh} loading={overview.loading || goLive.loading} loadedAt={overview.loadedAt} />
          </>
        }
      />

      {overview.error ? (
        <div className="mb-6">
          <ErrorNotice error={overview.error} onRetry={overview.refresh} />
        </div>
      ) : null}
      {goLive.error ? (
        <div className="mb-6">
          <ErrorNotice error={goLive.error} onRetry={goLive.refresh} />
        </div>
      ) : null}

      {/* Needs attention */}
      <section aria-labelledby="attention-heading" className="mb-6 rounded-2xl border border-white/[0.07] bg-[#0a1517] px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id="attention-heading" className="text-sm font-semibold text-[var(--ink)]">
            Needs attention
          </h2>
          <span className="text-xs text-[var(--ink-subtle)] tabular-nums">
            {!o || (!checks && !goLive.error) ? "checking…" : `${attention.length} ${attention.length === 1 ? "item" : "items"}`}
          </span>
        </div>
        {!o || (!checks && !goLive.error) ? (
          <Skeleton className="mt-3 h-8 w-2/3" />
        ) : !checks ? (
          <p className="mt-2 text-xs text-rose-200">The platform checks could not run, so this list may be incomplete. See the error above.</p>
        ) : attention.length === 0 ? (
          <p className="mt-2 text-xs text-emerald-300">Nothing needs attention. Every check that can run is passing.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {attention.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={cx(
                    "group flex items-start gap-2.5 rounded-lg border px-3 py-2 text-xs leading-snug transition-colors",
                    item.tone === "bad"
                      ? "border-rose-400/25 bg-rose-500/[0.06] text-rose-100 hover:bg-rose-500/[0.1]"
                      : "border-amber-300/20 bg-amber-300/[0.05] text-amber-100 hover:bg-amber-300/[0.09]",
                  )}
                >
                  <AlertIcon className="mt-px h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1">{item.text}</span>
                  <ChevronRightIcon className="mt-px h-4 w-4 shrink-0 opacity-60 group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {o ? (
          <>
            <StatTile
              href="/console/users"
              icon={<UsersGearIcon className="h-4 w-4" />}
              label="Accounts"
              value={formatInt(o.users.total)}
              sub={`${o.users.newUsers.current} new · ${o.users.active.current} signed in, ${PERIOD_LABEL[period]}`}
            />
            <StatTile
              icon={<DatabaseIcon className="h-4 w-4" />}
              label="Listings"
              value={formatInt(o.listings.total)}
              sub={o.listings.total === 0 ? "None in Firestore yet" : `${(o.listings.byStatus.Published ?? 0) + (o.listings.byStatus["Under offer"] ?? 0)} live in search`}
            />
            <StatTile
              href="/admin"
              icon={<ScanIcon className="h-4 w-4" />}
              label="Queues"
              value={formatInt(o.queues.moderation + o.queues.supportNew + o.queues.fraud)}
              tone={o.queues.moderation + o.queues.supportNew + o.queues.fraud > 0 ? "warn" : "good"}
              sub={`${o.queues.moderation} moderation · ${o.queues.supportNew} support · ${o.queues.fraud} fraud`}
            />
            <StatTile
              href="/console/errors"
              icon={<BugIcon className="h-4 w-4" />}
              label="Errors"
              value={formatInt(o.errors.occurrences.current)}
              tone={o.errors.openGroups > 0 ? "bad" : "good"}
              sub={o.errors.lastAt ? `Last ${timeAgo(o.errors.lastAt)} · ${o.errors.openGroups} open` : "None recorded"}
            />
            <StatTile
              href="/console/go-live"
              icon={<RocketIcon className="h-4 w-4" />}
              label="Go-live checks"
              value={checks ? `${passing}/${checks.length}` : goLive.error ? "—" : "…"}
              tone={!checks ? "neutral" : checks.some((c) => c.state === "error") ? "bad" : checks.some((c) => c.state === "warning") ? "warn" : "good"}
              sub={checks ? `${blocked} blocked until Blaze or a grant` : goLive.error ? "The checks failed to run" : "Checking Firebase, GitHub and production"}
            />
          </>
        ) : (
          Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-[132px] rounded-2xl" />)
        )}
      </div>

      {o ? (
        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <Panel
            title="Users"
            description={`Firebase Auth accounts. New and signed-in counts are for the ${PERIOD_LABEL[period]}.`}
            actions={<Link href="/console/users" className="text-xs font-semibold text-[var(--brand)] hover:underline">Manage</Link>}
          >
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <Figure label="New accounts" value={o.users.newUsers.current} delta={<Delta {...o.users.newUsers} />} />
              <Figure
                label="Signed in"
                value={o.users.active.current}
                delta={<span className="text-xs text-[var(--ink-subtle)]">Auth keeps only the latest sign-in, so there is no earlier figure</span>}
              />
              <div>
                <p className="mb-2 text-xs text-[var(--ink-subtle)]">By role claim</p>
                <BarList data={o.users.byRole} labels={{ none: "no claim (buyer)" }} />
              </div>
              <div>
                <p className="mb-2 text-xs text-[var(--ink-subtle)]">By sign-in method</p>
                <BarList data={o.users.byProvider} labels={{ password: "email + password", "google.com": "Google", phone: "phone" }} />
              </div>
            </div>
            {o.users.disabled || o.users.unverifiedEmail ? (
              <p className="mt-4 text-xs text-[var(--ink-subtle)]">
                {o.users.disabled} disabled · {o.users.unverifiedEmail} with an unverified email
              </p>
            ) : null}
          </Panel>

          <Panel title="Listings" description="Every document in properties, by lifecycle status.">
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <Figure label="New listings" value={o.listings.newListings.current} delta={<Delta {...o.listings.newListings} />} />
              <Figure label="Physical properties" value={o.listings.physical} delta={<span className="text-xs text-[var(--ink-subtle)]">size, rooms and location records</span>} />
            </div>
            <div className="mt-5">
              {o.listings.total === 0 ? (
                <p className="text-xs leading-relaxed text-[var(--ink-subtle)]">
                  No listings in Firestore, so the public site is showing its built-in sample listings. New listings
                  can only be saved as drafts until Cloud Storage exists for photos (Blaze plan).
                </p>
              ) : (
                <BarList data={o.listings.byStatus} />
              )}
            </div>
          </Panel>

          <Panel title="Activity" description={`What visitors did in the ${PERIOD_LABEL[period]}, against the period before.`}>
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <Figure label="Enquiries" value={o.activity.inquiries.current} delta={<Delta current={o.activity.inquiries.current} previous={o.activity.inquiries.previous} />} total={o.activity.inquiries.total} />
              <Figure label="Tenant applications" value={o.activity.applications.current} delta={<Delta current={o.activity.applications.current} previous={o.activity.applications.previous} />} total={o.activity.applications.total} />
              <Figure label="Support requests" value={o.activity.support.current} delta={<Delta current={o.activity.support.current} previous={o.activity.support.previous} />} total={o.activity.support.total} />
              <Figure label="Collections" value={o.activity.collections.current} delta={<Delta current={o.activity.collections.current} previous={o.activity.collections.previous} />} total={o.activity.collections.total} />
            </div>
            <p className="mt-4 text-xs text-[var(--ink-subtle)]">
              {formatInt(o.activity.savedHomes)} saved homes across all accounts · {formatInt(o.activity.auditEntries)} moderation audit entries
            </p>
          </Panel>

          <Panel
            title="Errors and speed"
            description="Recorded by the site itself: browser and server errors, and real visitors' page speed."
            actions={<Link href="/console/events" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)] hover:underline"><LogIcon className="h-3.5 w-3.5" />Event log</Link>}
          >
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <Figure label="Error occurrences" value={o.errors.occurrences.current} delta={<Delta {...o.errors.occurrences} invert />} />
              <Figure label="Open error types" value={o.errors.openGroups} delta={<Link href="/console/errors" className="text-xs font-semibold text-[var(--brand)] hover:underline">Review</Link>} />
              <Figure
                label="Largest paint, 75th percentile"
                value={o.vitals.lcpP75 === null ? "—" : `${(o.vitals.lcpP75 / 1000).toFixed(2)} s`}
                delta={
                  <span className="text-xs text-[var(--ink-subtle)]">
                    {o.vitals.samples ? `${o.vitals.samples} samples` : "No samples yet; they arrive as people browse"}
                  </span>
                }
              />
            </div>
          </Panel>
        </div>
      ) : null}

      {o?.capped ? (
        <p className="mt-6 text-xs text-amber-200">Some collections hold more than 5,000 documents; their counts are capped.</p>
      ) : null}
    </>
  );
}

function Figure({ label, value, delta, total }: { label: string; value: React.ReactNode; delta?: React.ReactNode; total?: number }) {
  return (
    <div>
      <p className="text-xs text-[var(--ink-subtle)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-[var(--ink)] tabular-nums">{value}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {delta}
        {total !== undefined ? <span className="text-xs text-[var(--ink-subtle)] tabular-nums">{formatInt(total)} all time</span> : null}
      </div>
    </div>
  );
}
