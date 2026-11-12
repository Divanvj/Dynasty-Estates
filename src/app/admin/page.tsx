"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DailyBars } from "@/components/charts/daily-bars";
import { Donut } from "@/components/charts/donut";
import { Meter } from "@/components/charts/meter";
import { Ring } from "@/components/charts/ring";
import { TrendLine } from "@/components/charts/trend-line";
import {
  AgeChip,
  DashCard,
  Delta,
  emptyBoxClass,
  errorBoxClass,
  formatAge,
  heroPrimaryClass,
  heroSecondaryClass,
  KpiCard,
  linkClass,
  RingCard,
  StatementCard,
} from "@/components/dashboard-ui";
import { getEnquiryTimesSince, getLiveListings, getWaitingForReview, type LiveListing, type WaitingListing } from "@/lib/admin-overview";
import { changeWords, countPerDay, DAY_MS, longToday, periods, shortDay, splitAge, sum } from "@/lib/dashboard-math";
import { listPractitioners, type Practitioner } from "@/lib/practitioners";
import { getSupportRequests, PACKAGE_REQUEST_PREFIX, type SupportRequest } from "@/lib/support-requests";
import { useAccountUid } from "@/lib/use-owner-listings";

// Pattern 4 — Dashboard / Overview (docs/dashboards/PLAN.md; look:
// REDESIGN-PLAN.md "D · Petrol"). The marketplace pulse at a glance,
// read-only; every queue links to the page that deals with it. Errors,
// deploys and vitals belong to the developer console, not here.

type Loaded<T> = { ok: true; value: T } | { ok: false } | null;

/** Runs `load` once the admin is signed in; each figure fails on its own. */
function useLoaded<T>(uid: string | null | undefined, load: () => Promise<T>): Loaded<T> {
  const [result, setResult] = useState<Loaded<T>>(null);
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    load()
      .then((value) => !cancelled && setResult({ ok: true, value }))
      .catch((error) => {
        console.error("Admin overview figure failed:", error);
        if (!cancelled) setResult({ ok: false });
      });
    return () => {
      cancelled = true;
    };
    // `load` is a stable module-level function per call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);
  return result;
}

const WINDOW = 30;
const TARGET_MS = 24 * 60 * 60 * 1000;

type QueueRow = { key: string; title: string; detail: string; href: string; oldest: Date | null; count: number };

export default function AdminOverview() {
  const uid = useAccountUid();
  const [now] = useState(() => Date.now());
  const [range] = useState(() => periods(WINDOW, now));
  const live = useLoaded<LiveListing[]>(uid, getLiveListings);
  const enquiryTimes = useLoaded<Date[]>(uid, () => getEnquiryTimesSince(new Date(now - 2 * WINDOW * DAY_MS)));
  const waiting = useLoaded<WaitingListing[]>(uid, getWaitingForReview);
  const support = useLoaded<SupportRequest[]>(uid, getSupportRequests);
  const practitioners = useLoaded<Practitioner[]>(uid, listPractitioners);
  const anyFailed = [live, enquiryTimes, waiting, support, practitioners].some((x) => x && !x.ok);

  const liveRows = live?.ok ? live.value : [];
  const enquiries = enquiryTimes?.ok ? enquiryTimes.value.map((createdAt) => ({ createdAt })) : [];
  const waitingRows = waiting?.ok ? waiting.value : [];
  const openSupport = support?.ok ? support.value.filter((r) => r.status !== "closed") : [];
  const newSupport = openSupport.filter((r) => r.status === "new" && !r.message.startsWith(PACKAGE_REQUEST_PREFIX));
  const openPackages = openSupport.filter((r) => r.message.startsWith(PACKAGE_REQUEST_PREFIX));
  const pendingAgents = practitioners?.ok ? practitioners.value.filter((p) => p.status === "pending") : [];
  const verifiedAgents = practitioners?.ok ? practitioners.value.filter((p) => p.status === "verified").length : 0;

  // ---- trends
  const newLiveNow = countPerDay(liveRows.map((l) => ({ createdAt: l.liveSince })), range.current);
  const newLiveBefore = countPerDay(liveRows.map((l) => ({ createdAt: l.liveSince })), range.previous);
  const enquiriesNow = countPerDay(enquiries, range.current);
  const enquiriesBefore = countPerDay(enquiries, range.previous);
  const weekAgo = now - 7 * DAY_MS;
  const newThisWeek = liveRows.filter((l) => (l.liveSince?.getTime() ?? 0) >= weekAgo).length;
  const newWeekBefore = liveRows.filter((l) => {
    const t = l.liveSince?.getTime() ?? 0;
    return t >= weekAgo - 7 * DAY_MS && t < weekAgo;
  }).length;
  const enquiriesThisWeek = enquiries.filter((e) => e.createdAt.getTime() >= weekAgo).length;

  // ---- supply mix
  const forSale = liveRows.filter((l) => l.listingType === "sale").length;
  const cities = [...liveRows.reduce((m, l) => m.set(l.city || "Not given", (m.get(l.city || "Not given") ?? 0) + 1), new Map<string, number>())]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const photoListing = [...liveRows].filter((l) => l.image).sort((a, b) => (b.liveSince?.getTime() ?? 0) - (a.liveSince?.getTime() ?? 0))[0] ?? null;

  // ---- queues against the 24 h service target
  const oldestOf = (dates: (Date | null | undefined)[]) =>
    dates.filter((d): d is Date => d instanceof Date).sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
  const supportDate = (r: SupportRequest) => (r.createdAt ? new Date(r.createdAt) : null);
  const queues: QueueRow[] = [
    { key: "mod", title: "Listings to review", detail: "Waiting for moderation", href: "/admin/moderation", count: waitingRows.length, oldest: oldestOf(waitingRows.map((w) => w.submittedAt)) },
    { key: "agents", title: "Agents to verify", detail: "Fidelity Fund Certificates", href: "/admin/agents", count: pendingAgents.length, oldest: oldestOf(pendingAgents.map((p) => p.submittedAt)) },
    { key: "support", title: "Support messages", detail: "New, not yet answered", href: "/admin/support?show=new", count: newSupport.length, oldest: oldestOf(newSupport.map(supportDate)) },
    { key: "pkg", title: "Package requests", detail: "To invoice by hand", href: "/admin/support?show=new", count: openPackages.length, oldest: oldestOf(openPackages.map(supportDate)) },
  ];
  const queueItems = [
    ...waitingRows.map((w) => w.submittedAt),
    ...pendingAgents.map((p) => p.submittedAt),
    ...newSupport.map(supportDate),
  ].filter((d): d is Date => d instanceof Date);
  const inTime = queueItems.filter((d) => now - d.getTime() <= TARGET_MS).length;
  const oldestQueued = oldestOf(queueItems);
  const queuesReady = Boolean(waiting && support && practitioners);
  const [oldFigure, oldUnit] = oldestQueued ? splitAge(formatAge(oldestQueued, now)) : ["0", ""];
  const late = queueItems.length - inTime;

  const liveCount = live?.ok ? live.value.length : null;
  const weekChange = changeWords(newThisWeek, newWeekBefore);

  return (
    <>
      {anyFailed ? (
        <p role="alert" className={`mb-4 ${errorBoxClass}`}>
          Some figures couldn&rsquo;t be loaded. Check your connection and refresh the page.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <StatementCard
          className="lg:col-span-8"
          eyebrow={`Marketplace pulse · ${longToday(now)}`}
          title={
            liveCount === null ? (
              "Loading the marketplace…"
            ) : (
              <>
                <span className="text-[var(--dash-accent)]">{liveCount.toLocaleString("en-ZA")}</span> {liveCount === 1 ? "home" : "homes"} live
              </>
            )
          }
          lead={
            live?.ok ? (
              <>
                <strong>{newThisWeek} new this week</strong>
                {weekChange ? `, ${weekChange} on the week before` : ""}.{" "}
                {enquiryTimes?.ok ? (
                  <>
                    Buyers sent{" "}
                    <strong>
                      {enquiriesThisWeek} {enquiriesThisWeek === 1 ? "enquiry" : "enquiries"}
                    </strong>{" "}
                    in the last 7 days.
                  </>
                ) : null}
              </>
            ) : undefined
          }
          actions={
            <>
              <Link href="/admin/moderation" className={heroPrimaryClass}>
                {waitingRows.length > 0 ? `Review ${waitingRows.length} ${waitingRows.length === 1 ? "listing" : "listings"}` : "Open moderation"}
              </Link>
              {pendingAgents.length > 0 ? (
                <Link href="/admin/agents" className={heroSecondaryClass}>
                  Verify {pendingAgents.length} {pendingAgents.length === 1 ? "agent" : "agents"}
                </Link>
              ) : null}
            </>
          }
          photo={photoListing ? { src: photoListing.image, alt: photoListing.title } : null}
        />

        <div className="lg:col-span-4">
          <RingCard
            label="Queues within 24 h"
            sub="Listings, agents and support waiting now"
            ring={
              <Ring
                value={queueItems.length ? inTime / queueItems.length : 1}
                label={queueItems.length ? `${inTime} of ${queueItems.length} waiting items are within 24 hours` : "Nothing is waiting"}
                text={queueItems.length ? undefined : "Clear"}
              />
            }
            figure={queuesReady ? oldFigure : "–"}
            unit={queuesReady && oldestQueued ? oldUnit : ""}
            status={!queuesReady ? undefined : !oldestQueued ? "Nothing is waiting" : late > 0 ? `Oldest item · ${late} past 24 h` : "Oldest item · all within 24 h"}
            minis={[
              { value: queuesReady ? String(waitingRows.length) : "–", label: "Listings" },
              { value: queuesReady ? String(pendingAgents.length) : "–", label: "Agents" },
              { value: queuesReady ? String(newSupport.length) : "–", label: "Support" },
            ]}
          />
        </div>

        <section aria-label="Totals" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-12 lg:grid-cols-4">
          <KpiCard
            label={`New listings · ${WINDOW} d`}
            value={live?.ok ? String(sum(newLiveNow)) : live ? "Error" : null}
            delta={live?.ok ? <Delta now={sum(newLiveNow)} before={sum(newLiveBefore)} /> : null}
            trend={live?.ok ? <TrendLine values={newLiveNow} /> : null}
            detail="Went live, still live today"
          />
          <KpiCard
            label={`Enquiries · ${WINDOW} d`}
            value={enquiryTimes?.ok ? String(sum(enquiriesNow)) : enquiryTimes ? "Error" : null}
            delta={enquiryTimes?.ok ? <Delta now={sum(enquiriesNow)} before={sum(enquiriesBefore)} /> : null}
            trend={enquiryTimes?.ok ? <TrendLine values={enquiriesNow} /> : null}
            detail={`vs the ${WINDOW} days before`}
          />
          <KpiCard
            label="Verified agents"
            value={practitioners?.ok ? String(verifiedAgents) : practitioners ? "Error" : null}
            detail={practitioners?.ok ? `${pendingAgents.length} waiting for review` : undefined}
          />
          <KpiCard
            label="Open package requests"
            value={support?.ok ? String(openPackages.length) : support ? "Error" : null}
            detail="Invoiced by hand until payments are built"
          />
        </section>

        <DashCard title="Queues" className="lg:col-span-7" aside="Oldest item against a 24 h service target">
          {!queuesReady ? (
            <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading…</p>
          ) : (
            <ul>
              {queues.map((q, i) => {
                const age = q.oldest ? now - q.oldest.getTime() : 0;
                const tone = !q.count ? "good" : age > TARGET_MS ? "late" : age > TARGET_MS * 0.66 ? "soon" : "neutral";
                return (
                  <li key={q.key} className={i ? "border-t border-[var(--dash-line)]" : ""}>
                    <Link href={q.href} className="grid grid-cols-[1fr_90px_auto] items-center gap-4 rounded-lg py-3 hover:bg-[var(--dash-card-2)] sm:grid-cols-[1fr_140px_auto]">
                      <span className="min-w-0">
                        <span className="block font-semibold text-slate-900 dark:text-white">{q.title}</span>
                        <span className="block truncate text-xs text-slate-600 dark:text-slate-400">
                          {q.count ? `${q.count} waiting · oldest ${q.oldest ? formatAge(q.oldest, now) : "unknown"}` : q.detail}
                        </span>
                      </span>
                      <Meter value={Math.min(age, TARGET_MS)} max={TARGET_MS} tone={tone === "late" ? "late" : "data"} height={6} />
                      <AgeChip label={!q.count ? "Clear" : tone === "late" ? "Late" : tone === "soon" ? "Soon" : "In time"} tone={tone} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </DashCard>

        <DashCard title="Supply mix" className="lg:col-span-5" aside="Live listings">
          {!live ? (
            <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading…</p>
          ) : !live.ok || liveRows.length === 0 ? (
            <p className={emptyBoxClass}>No live listings yet.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-6 text-slate-900 dark:text-white">
                <Donut
                  part={forSale}
                  total={liveRows.length}
                  centre={liveRows.length.toLocaleString("en-ZA")}
                  caption="live homes"
                  label={`${forSale} for sale and ${liveRows.length - forSale} to rent`}
                />
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-[var(--dash-d1)]" />
                    For sale · {forSale} ({Math.round((forSale / liveRows.length) * 100)}%)
                  </li>
                  <li className="flex items-center gap-2">
                    <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-[var(--dash-d3)]" />
                    To rent · {liveRows.length - forSale} ({Math.round(((liveRows.length - forSale) / liveRows.length) * 100)}%)
                  </li>
                </ul>
              </div>
              <ul aria-label="Top cities by live listings" className="mt-5 space-y-2.5">
                {cities.map(([city, count]) => (
                  <li key={city} className="grid grid-cols-[110px_1fr_36px] items-center gap-3 text-sm">
                    <span className="truncate text-slate-800 dark:text-slate-200">{city}</span>
                    <Meter value={count} max={cities[0]?.[1] ?? 1} />
                    <b className="text-right tabular-nums text-slate-900 dark:text-white">{count}</b>
                  </li>
                ))}
              </ul>
            </>
          )}
        </DashCard>

        <DashCard title="Enquiries per day" className="lg:col-span-8" aside={`Last ${WINDOW} days · today in champagne`}>
          {enquiryTimes?.ok ? (
            <DailyBars days={range.current} bars={enquiriesNow} barLabel="Enquiries" formatDay={shortDay} height={190} />
          ) : (
            <p role="status" className="text-sm text-slate-600 dark:text-slate-300">{enquiryTimes ? "Enquiries couldn't be loaded." : "Loading…"}</p>
          )}
        </DashCard>

        <DashCard title="Revenue" className="lg:col-span-4">
          <div className="flex min-h-[180px] flex-col justify-center gap-2 rounded-2xl border border-dashed border-[var(--dash-line-2)] p-5 text-sm text-slate-600 dark:text-slate-400">
            <p className="font-semibold text-slate-900 dark:text-white">Payments aren&rsquo;t switched on yet</p>
            <p>
              Package requests are invoiced by hand
              {support?.ok ? ` (${openPackages.length} open)` : ""}. This card fills in once online payment is built (Phase H).
            </p>
            <p className="mt-1">
              <Link href="/admin/packages" className={linkClass}>Prices and plans</Link>
            </p>
          </div>
        </DashCard>
      </div>
    </>
  );
}
