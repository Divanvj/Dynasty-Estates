"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { emptyBoxClass, errorBoxClass, linkClass, panelClass, secondaryButtonClass } from "@/components/dashboard-ui";
import { EnquiryList, useOwnerInquiries } from "@/components/enquiry-inbox";
import { ArrowLeftIcon, CheckIcon } from "@/components/icons";
import Sparkline from "@/components/sparkline";
import { formatDate, formatNumber } from "@/lib/formatters";
import {
  compareWithArea,
  daysOnMarket,
  getLiveComparables,
  listingHealth,
  type AreaComparison,
} from "@/lib/listing-insights";
import { lastDays, seriesFor, sastDay, sumStats, type DayStats } from "@/lib/listing-stats";
import { getListingStats } from "@/lib/listing-stats-client";
import { asStage, REACHED_OFFER, REACHED_VIEWING, type SellerInquiry } from "@/lib/seller-inquiries";
import type { SellerListing } from "@/lib/seller-listings";
import { PUBLIC_LISTING_STATUSES } from "@/lib/types/domain";
import { useAccountUid, useOwnerListings } from "@/lib/use-owner-listings";

// Pattern 2 — Detail / Record (docs/dashboards/PLAN.md, Phase B). One of the
// signed-in account's own listings: Overview · Performance · Enquiries. Used by
// /agent/listings/[id] and /seller/listings/[id]. The seller report (Phase C)
// is its own print page, linked from the header.

/** Counting started with Phase B; days before it read as zero, not as "no views". */
export const COUNTING_SINCE = "2026-11-11";
const DAYS = 30;

type Tab = "overview" | "performance" | "enquiries";

function shortDay(day: string): string {
  return formatDate(`${day}T12:00:00Z`).replace(/ \d{4}$/, "");
}

export default function ListingDetail({
  listingId,
  backHref,
  backLabel,
  basePath,
}: {
  listingId: string;
  backHref: string;
  backLabel: string;
  /** Where this account's listing pages live: /agent/listings or /seller/listings. */
  basePath: string;
}) {
  const uid = useAccountUid();
  const listings = useOwnerListings(uid);
  const inbox = useOwnerInquiries(uid);
  const [tab, setTab] = useState<Tab>("performance");
  const listing = listings.items.find((item) => item.id === listingId) ?? null;
  const enquiries = inbox.items.filter((item) => item.propertyId === listingId);
  // Agents work enquiries through stages; private sellers keep New / Contacted.
  const pipeline = basePath.startsWith("/agent");

  const back = (
    <Link href={backHref} className={`mb-4 inline-flex items-center gap-1.5 text-sm ${linkClass}`}>
      <ArrowLeftIcon className="h-4 w-4" /> {backLabel}
    </Link>
  );

  if (listings.state === "loading") {
    return <>{back}<p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading the listing…</p></>;
  }
  if (listings.state === "error") {
    return <>{back}<p role="alert" className={errorBoxClass}>This listing couldn&rsquo;t be loaded. Check your connection and refresh the page.</p></>;
  }
  if (!listing) {
    return <>{back}<p className={emptyBoxClass}>This listing isn&rsquo;t one of yours, or it no longer exists.</p></>;
  }

  const isPublic = (PUBLIC_LISTING_STATUSES as readonly string[]).includes(listing.status);
  const dom = daysOnMarket(listing);
  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "performance", label: "Performance" },
    { key: "enquiries", label: `Enquiries${inbox.state === "ready" ? ` (${enquiries.length})` : ""}` },
  ];

  return (
    <>
      {back}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-900 md:text-4xl dark:text-white">{listing.title}</h1>
          {/* Status and key facts stand in for a description line. */}
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
            <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-0.5 text-xs font-bold uppercase tracking-[0.1em] text-slate-700 dark:border-white/10 dark:bg-surface-ink/80 dark:text-slate-300">{listing.status}</span>
            <span className="font-semibold text-slate-900 dark:text-white">{listing.price}</span>
            {listing.location ? <span>{listing.location}</span> : null}
            {dom !== null ? <span>{dom} {dom === 1 ? "day" : "days"} {listing.publishedAt ? "on the market" : "since filed"}</span> : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {/* Seller report (Phase C): a printable page for the home's owner. */}
          <Link href={`${basePath}/${listing.id}/report`} className={secondaryButtonClass}>
            Seller report
          </Link>
          {isPublic ? (
            <Link href={`/property/${listing.id}`} className={linkClass}>Open the public listing</Link>
          ) : null}
        </div>
      </div>

      <div role="tablist" aria-label="Listing sections" className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200 [scrollbar-width:none] dark:border-white/10 [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            id={`tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls={`panel-${t.key}`}
            onClick={() => setTab(t.key)}
            className={`min-h-11 shrink-0 cursor-pointer whitespace-nowrap border-b-2 px-4 text-sm font-semibold ${
              tab === t.key
                ? "border-slate-900 text-slate-900 dark:border-emerald-400 dark:text-white"
                : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "overview" ? <Overview listing={listing} /> : null}
        {tab === "performance" ? <Performance listing={listing} uid={uid ?? null} enquiryDates={enquiries.map((e) => e.createdAt)} enquiriesReady={inbox.state === "ready"} /> : null}
        {tab === "enquiries" ? (
          <>
            {pipeline && inbox.state === "ready" && enquiries.length > 0 ? <Funnel enquiries={enquiries} /> : null}
            <section className={panelClass} aria-label="Enquiries on this listing">
              <EnquiryList
                {...inbox}
                stages={pipeline ? "pipeline" : "simple"}
                items={enquiries}
                emptyMessage="No enquiries on this listing yet."
              />
            </section>
          </>
        ) : null}
      </div>
    </>
  );
}

/**
 * How far this listing's buyers got: enquiries → viewing → offer → won, as
 * plain bars against the number of enquiries (dataviz: one series, labelled
 * values, no axis needed; the table is the accessible form).
 */
function Funnel({ enquiries }: { enquiries: SellerInquiry[] }) {
  const total = enquiries.length;
  const count = (stages: readonly string[]) => enquiries.filter((item) => stages.includes(asStage(item.status))).length;
  const rows: [string, number][] = [
    ["Enquiries", total],
    ["Viewing or later", count(REACHED_VIEWING)],
    ["Offer or later", count(REACHED_OFFER)],
    ["Won", count(["won"])],
  ];
  return (
    <section aria-labelledby="funnel-heading" className={`mb-6 ${panelClass}`}>
      <h2 id="funnel-heading" className="text-lg font-semibold text-slate-900 dark:text-white">How far buyers got</h2>
      <table className="mt-4 w-full border-separate border-spacing-y-2 text-sm">
        <caption className="sr-only">Enquiries on this listing by the furthest stage reached</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Stage</th>
            <th scope="col">Buyers</th>
            <th scope="col">Share of enquiries</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, value]) => {
            const share = total ? Math.round((value / total) * 100) : 0;
            return (
              <tr key={label}>
                <th scope="row" className="whitespace-nowrap pr-4 text-left font-medium text-slate-700 dark:text-slate-300">{label}</th>
                <td className="w-full">
                  <div className="h-3 rounded-full bg-slate-900/5 dark:bg-white/10">
                    <div className="h-3 rounded-full bg-[#047857] dark:bg-[#0fa673]" style={{ width: `${share}%` }} />
                  </div>
                </td>
                <td className="whitespace-nowrap pl-4 text-right tabular-nums text-slate-900 dark:text-white">
                  <span className="font-semibold">{value}</span>
                  <span className="text-slate-600 dark:text-slate-400"> · {share}%</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
        Counted from each enquiry&rsquo;s current stage. A lost enquiry counts only as an enquiry, because we don&rsquo;t record how far it got.
      </p>
    </section>
  );
}

function Overview({ listing }: { listing: SellerListing }) {
  const facts: [string, string][] = [
    ["Price", listing.price],
    ["Type", `${listing.type ?? "–"} · ${listing.listingType === "rent" ? "To rent" : "For sale"}`],
    ["Bedrooms", String(listing.beds ?? "–")],
    ["Bathrooms", String(listing.baths ?? "–")],
    ["Floor size", listing.floorSizeSqm ? `${formatNumber(listing.floorSizeSqm)} m²` : "Not given"],
    ["Erf size", listing.erfSizeSqm ? `${formatNumber(listing.erfSizeSqm)} m²` : "Not given"],
    ["Filed", listing.createdAt ? formatDate(listing.createdAt) : "–"],
    ["Published", listing.publishedAt ? formatDate(listing.publishedAt) : "Not yet"],
  ];
  return (
    <section className={panelClass} aria-label="Listing details">
      {listing.moderationFeedback ? (
        <p className="mb-4 rounded-control border border-amber-300/50 bg-amber-50 p-3.5 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
          Moderator&rsquo;s note: &ldquo;{listing.moderationFeedback}&rdquo;
        </p>
      ) : null}
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {facts.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-slate-200/70 pb-2 text-sm dark:border-white/10">
            <dt className="text-slate-600 dark:text-slate-400">{k}</dt>
            <dd className="text-right font-semibold text-slate-900 dark:text-white">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">There is no edit screen yet. To change a detail, contact Dynasty through Support &amp; Guidance in the account menu.</p>
    </section>
  );
}

function Performance({
  listing,
  uid,
  enquiryDates,
  enquiriesReady,
}: {
  listing: SellerListing;
  uid: string | null;
  enquiryDates: (Date | null)[];
  enquiriesReady: boolean;
}) {
  const [stats, setStats] = useState<{ rows: DayStats[] } | { failed: true } | null>(null);
  const [comparison, setComparison] = useState<AreaComparison | { failed: true } | null>(null);
  const [now] = useState(() => Date.now());
  const [showTable, setShowTable] = useState(false);
  const days = lastDays(DAYS, now);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    getListingStats(uid, listing.id, days[0])
      .then((rows) => !cancelled && setStats({ rows }))
      .catch((error) => {
        console.error("Could not load this listing's statistics:", error);
        if (!cancelled) setStats({ failed: true });
      });
    getLiveComparables()
      .then((all) => !cancelled && setComparison(compareWithArea(listing, all)))
      .catch((error) => {
        console.error("Could not load comparable listings:", error);
        if (!cancelled) setComparison({ failed: true });
      });
    return () => {
      cancelled = true;
    };
    // days[0] is fixed for this mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, listing.id]);

  const series = stats && "rows" in stats ? seriesFor(stats.rows, days) : null;
  const enquiriesByDay = new Map<string, number>();
  for (const at of enquiryDates) {
    if (!at) continue;
    const day = sastDay(at);
    enquiriesByDay.set(day, (enquiriesByDay.get(day) ?? 0) + 1);
  }
  const totals = series ? sumStats(series) : null;
  const enquiries30 = days.reduce((sum, d) => sum + (enquiriesByDay.get(d) ?? 0), 0);
  const health = listingHealth(listing);
  const countingNote = days[0] < COUNTING_SINCE ? `Views, saves and contact clicks are counted from ${formatDate(`${COUNTING_SINCE}T12:00:00Z`)}.` : null;

  const tiles: { label: string; total: number | null; points: { day: string; value: number }[] | null }[] = [
    { label: "Views", total: totals?.views ?? null, points: series?.map((r) => ({ day: r.date, value: r.views })) ?? null },
    { label: "Saves", total: totals?.saves ?? null, points: series?.map((r) => ({ day: r.date, value: r.saves })) ?? null },
    { label: "Contact clicks", total: totals?.contactClicks ?? null, points: series?.map((r) => ({ day: r.date, value: r.contactClicks })) ?? null },
    {
      label: "Enquiries",
      total: enquiriesReady ? enquiries30 : null,
      points: enquiriesReady ? days.map((d) => ({ day: d, value: enquiriesByDay.get(d) ?? 0 })) : null,
    },
  ];
  const per100 = totals && totals.views > 0 && enquiriesReady ? (enquiries30 / totals.views) * 100 : null;

  return (
    <div className="space-y-6">
      <section aria-labelledby="activity-heading" className={panelClass}>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="activity-heading" className="text-xl font-semibold text-slate-900 dark:text-white">Last {DAYS} days</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {per100 !== null ? (
              <>
                <span className="font-semibold text-slate-900 dark:text-white">{per100.toFixed(1)}</span> enquiries per 100 views
                {totals && totals.views < 50 ? " (few views yet, so this moves a lot)" : ""}
              </>
            ) : (
              "Enquiries per 100 views appear once the listing has views."
            )}
          </p>
        </div>
        {stats && "failed" in stats ? (
          <p role="alert" className={`mb-4 ${errorBoxClass}`}>Views, saves and contact clicks couldn&rsquo;t be loaded. Check your connection and refresh the page.</p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {tiles.map((tile) => (
            <div key={tile.label} className="rounded-card border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-surface-ink/60">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">{tile.label}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900 dark:text-white">{tile.total ?? "–"}</p>
              <div className="mt-2">
                {tile.points ? (
                  <Sparkline label={tile.label} points={tile.points} formatDay={shortDay} />
                ) : (
                  <div aria-hidden="true" className="h-14 animate-pulse rounded bg-slate-200/60 motion-reduce:animate-none dark:bg-white/5" />
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-400">
          <span>{countingNote ?? "Counts are anonymous: who viewed is never recorded."}</span>
          <button type="button" aria-expanded={showTable} onClick={() => setShowTable((v) => !v)} className={`cursor-pointer ${linkClass}`}>
            {showTable ? "Hide daily figures" : "Show daily figures"}
          </button>
        </div>
        {showTable && series ? (
          <div className="mt-3 max-h-80 overflow-auto rounded-control border border-slate-200 dark:border-white/10">
            <table className="w-full text-left text-sm tabular-nums">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wider text-slate-600 dark:bg-surface-ink dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-3 py-2">Day</th>
                  <th scope="col" className="px-3 py-2 text-right">Views</th>
                  <th scope="col" className="px-3 py-2 text-right">Saves</th>
                  <th scope="col" className="px-3 py-2 text-right">Contact clicks</th>
                  <th scope="col" className="px-3 py-2 text-right">Enquiries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {[...series].reverse().map((row) => (
                  <tr key={row.date}>
                    <td className="px-3 py-1.5">{shortDay(row.date)}</td>
                    <td className="px-3 py-1.5 text-right">{row.views}</td>
                    <td className="px-3 py-1.5 text-right">{row.saves}</td>
                    <td className="px-3 py-1.5 text-right">{row.contactClicks}</td>
                    <td className="px-3 py-1.5 text-right">{enquiriesByDay.get(row.date) ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="area-heading" className={panelClass}>
          <h2 id="area-heading" className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">Price against the area</h2>
          <AreaComparisonView comparison={comparison} listing={listing} />
        </section>
        <section aria-labelledby="health-heading" className={panelClass}>
          <h2 id="health-heading" className="mb-1 text-xl font-semibold text-slate-900 dark:text-white">Listing checklist</h2>
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">{health.filter((h) => h.done).length} of {health.length} done.</p>
          <ul className="space-y-2">
            {health.map((item) => (
              <li key={item.key} className="flex items-start gap-3 text-sm">
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    item.done ? "border-emerald-700 bg-emerald-700 text-white dark:border-emerald-500 dark:bg-emerald-700" : "border-slate-400 dark:border-white/30"
                  }`}
                >
                  {item.done ? <CheckIcon className="h-3 w-3" /> : null}
                </span>
                <span>
                  <span className="font-semibold text-slate-900 dark:text-white">{item.label}</span>
                  <span className="sr-only">{item.done ? " (done)" : " (to do)"}</span>
                  {!item.done ? <span className="block text-slate-600 dark:text-slate-400">{item.tip}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function AreaComparisonView({ comparison, listing }: { comparison: AreaComparison | { failed: true } | null; listing: SellerListing }) {
  if (!comparison) return <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Comparing…</p>;
  if ("failed" in comparison) return <p role="alert" className={errorBoxClass}>Comparable listings couldn&rsquo;t be loaded.</p>;
  if (comparison.basis === "none") {
    return <p className="text-sm text-slate-600 dark:text-slate-300">{comparison.reason}</p>;
  }
  const unit = comparison.metric === "perSqm" ? " per m²" : "";
  const above = comparison.deltaPct > 0;
  const same = Math.abs(comparison.deltaPct) < 5;
  const area = comparison.area.replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <div className="text-sm text-slate-700 dark:text-slate-300">
      <p className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
        {same ? "In line" : `${Math.abs(comparison.deltaPct)}% ${above ? "above" : "below"}`}
      </p>
      <p className="mt-1">
        This listing asks R {formatNumber(comparison.mine)}{unit}; the median of {comparison.count} live{" "}
        {listing.type?.toLowerCase() ?? "home"} {listing.listingType === "rent" ? "rentals" : "listings"} in {area}{" "}
        ({comparison.basis === "suburb" ? "suburb" : "city"}) is R {formatNumber(comparison.median)}{unit}.
      </p>
      <p className="mt-2 text-slate-600 dark:text-slate-400">Asking prices on Dynasty only, not sale prices and not a valuation.</p>
    </div>
  );
}
