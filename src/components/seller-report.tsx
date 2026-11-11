"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import BrandLogo from "@/components/brand-logo";
import { emptyBoxClass, errorBoxClass, linkClass } from "@/components/dashboard-ui";
import { useOwnerInquiries } from "@/components/enquiry-inbox";
import { ArrowLeftIcon } from "@/components/icons";
import PrintButton from "@/components/print-button";
import Sparkline from "@/components/sparkline";
import { formatDate, formatNumber } from "@/lib/formatters";
import { compareWithArea, daysOnMarket, getLiveComparables, type AreaComparison } from "@/lib/listing-insights";
import { lastDays, sastDay, seriesFor, type DayStats } from "@/lib/listing-stats";
import { getListingStats } from "@/lib/listing-stats-client";
import { absoluteUrl } from "@/lib/site-url";
import { useAccountUid, useOwnerListings } from "@/lib/use-owner-listings";

import { COUNTING_SINCE } from "./listing-detail";

// Seller report (docs/dashboards/PLAN.md, Phase C). A one-page A4 summary an
// agent (or a private seller) prints or saves as PDF and sends to the home's
// owner. The agent leads — name, agency, contact at the top; Dynasty appears
// once, small, in the footer (owner, 2026-11-10: "not in your face").
// The note to the seller is typed here and printed; it is not stored.
// "Save as PDF" is the browser's print dialogue — there is no server PDF yet.

const fmtDay = (day: string) => formatDate(`${day}T12:00:00Z`);
const shortDay = (day: string) => fmtDay(day).replace(/ \d{4}$/, "");

function sumRange(series: DayStats[], from: number, to: number) {
  return series.slice(from, to).reduce(
    (acc, r) => ({ views: acc.views + r.views, saves: acc.saves + r.saves, contactClicks: acc.contactClicks + r.contactClicks }),
    { views: 0, saves: 0, contactClicks: 0 },
  );
}

function change(now: number, before: number): string {
  if (now === before) return "No change";
  if (before === 0) return `+${now}`;
  const pct = Math.round(((now - before) / before) * 100);
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

export default function SellerReport({ listingId, backHref }: { listingId: string; backHref: string }) {
  const uid = useAccountUid();
  const { profile, user } = useAuth();
  const listings = useOwnerListings(uid);
  const inbox = useOwnerInquiries(uid);
  const [now] = useState(() => Date.now());
  const days = lastDays(30, now);
  const [stats, setStats] = useState<DayStats[] | "failed" | null>(null);
  const [comparison, setComparison] = useState<AreaComparison | null>(null);
  const [note, setNote] = useState("");
  const noteId = useId();
  const listing = listings.items.find((item) => item.id === listingId) ?? null;

  useEffect(() => {
    if (!uid || !listing) return;
    let cancelled = false;
    getListingStats(uid, listingId, days[0])
      .then((rows) => !cancelled && setStats(rows))
      .catch((error) => {
        console.error("Seller report statistics failed:", error);
        if (!cancelled) setStats("failed");
      });
    getLiveComparables()
      .then((all) => !cancelled && setComparison(compareWithArea(listing, all)))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // days[0] is fixed for this mount; `listing` identity changes only on reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, listingId, Boolean(listing)]);

  const back = (
    <Link href={backHref} className={`no-print mb-4 inline-flex items-center gap-1.5 text-sm ${linkClass}`}>
      <ArrowLeftIcon className="h-4 w-4" /> Back to the listing
    </Link>
  );
  if (listings.state === "loading") return <>{back}<p role="status" className="text-sm">Loading…</p></>;
  if (listings.state === "error") return <>{back}<p role="alert" className={errorBoxClass}>This listing couldn&rsquo;t be loaded.</p></>;
  if (!listing) return <>{back}<p className={emptyBoxClass}>This listing isn&rsquo;t one of yours, or it no longer exists.</p></>;

  const series = Array.isArray(stats) ? seriesFor(stats, days) : null;
  const thisWeek = series ? sumRange(series, 23, 30) : null;
  const lastWeek = series ? sumRange(series, 16, 23) : null;
  const weekStart = days[23];
  const prevStart = days[16];
  const leads = inbox.items.filter((item) => item.propertyId === listingId && item.createdAt);
  const inRange = (from: string, to: string, kind?: "viewing") =>
    leads.filter((l) => {
      const d = sastDay(l.createdAt as Date);
      return d >= from && d <= to && (!kind || l.kind !== "message");
    }).length;
  const enquiriesThis = inRange(weekStart, days[29]);
  const enquiriesLast = inRange(prevStart, days[22]);
  const viewingsThis = inRange(weekStart, days[29], "viewing");
  const viewingsLast = inRange(prevStart, days[22], "viewing");
  const dom = daysOnMarket(listing, now);
  const agentName = profile?.displayName || user?.displayName || user?.email || "";
  const agency = profile?.agencyName ?? "";
  const phone = profile?.phone ?? "";
  const email = profile?.email ?? user?.email ?? "";

  const rows: [string, number | null, number | null][] = [
    ["Views", thisWeek?.views ?? null, lastWeek?.views ?? null],
    ["Saves", thisWeek?.saves ?? null, lastWeek?.saves ?? null],
    ["Contact clicks", thisWeek?.contactClicks ?? null, lastWeek?.contactClicks ?? null],
    ["Enquiries", inbox.state === "ready" ? enquiriesThis : null, inbox.state === "ready" ? enquiriesLast : null],
    ["Viewing requests", inbox.state === "ready" ? viewingsThis : null, inbox.state === "ready" ? viewingsLast : null],
  ];

  return (
    <>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        {back}
        <PrintButton label="Print or save as PDF" title="Print the seller report or save it as a PDF" />
      </div>
      <p className="no-print mb-4 text-sm text-slate-600 dark:text-slate-300">
        This is the page that prints. Add a note for the seller below, then print or save it as a PDF and send it on.
      </p>

      {/* The sheet: white paper in both themes so it previews as it prints. */}
      <article
        aria-label="Seller report"
        className="mx-auto max-w-[210mm] rounded-card border border-slate-200 bg-white p-8 text-slate-900 shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
      >
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-5">
          <div className="min-w-0">
            {agency ? <p className="text-xl font-semibold tracking-tight">{agency}</p> : null}
            <p className={agency ? "text-sm font-semibold text-slate-700" : "text-xl font-semibold"}>{agentName}</p>
            <p className="mt-1 text-sm text-slate-600">{[phone, email].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">Listing report</p>
            <p className="text-slate-600">{fmtDay(weekStart)} – {fmtDay(days[29])}</p>
          </div>
        </header>

        <section className="mt-5 flex flex-wrap gap-5">
          {listing.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- listing photo from any host; prints as-is
            <img src={listing.image} alt="" className="h-32 w-48 shrink-0 rounded-lg object-cover" />
          ) : null}
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{listing.title}</h1>
            <p className="text-sm text-slate-600">{listing.location}</p>
            <p className="mt-2 text-lg font-semibold">{listing.price}</p>
            <p className="text-sm text-slate-600">
              {listing.status}
              {dom !== null ? ` · ${dom} ${dom === 1 ? "day" : "days"} ${listing.publishedAt ? "on the market" : "since filed"}` : ""}
            </p>
          </div>
        </section>

        <section className="mt-6" aria-labelledby="week-heading">
          <h2 id="week-heading" className="text-base font-semibold">This week on Dynasty Estates</h2>
          {stats === "failed" ? <p className="mt-2 text-sm text-rose-800">Views, saves and contact clicks couldn&rsquo;t be loaded.</p> : null}
          <table className="mt-2 w-full text-sm tabular-nums">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-600">
              <tr className="border-b border-slate-200">
                <th scope="col" className="py-2 pr-2 font-bold">Measure</th>
                <th scope="col" className="py-2 pr-2 text-right font-bold">This week</th>
                <th scope="col" className="py-2 pr-2 text-right font-bold">Week before</th>
                <th scope="col" className="py-2 text-right font-bold">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map(([label, a, b]) => (
                <tr key={label}>
                  <th scope="row" className="py-2 pr-2 text-left font-medium">{label}</th>
                  <td className="py-2 pr-2 text-right font-semibold">{a ?? "–"}</td>
                  <td className="py-2 pr-2 text-right">{b ?? "–"}</td>
                  <td className="py-2 text-right">{a !== null && b !== null ? change(a, b) : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {days[16] < COUNTING_SINCE ? (
            <p className="mt-2 text-xs text-slate-500">Views, saves and contact clicks are counted from {fmtDay(COUNTING_SINCE)}.</p>
          ) : null}
        </section>

        <section className="mt-6 grid gap-6 sm:grid-cols-2 print:grid-cols-2" aria-label="Last 30 days">
          <div>
            <h2 className="text-base font-semibold">Views, last 30 days</h2>
            <p className="text-sm text-slate-600">{series ? `${series.reduce((s, r) => s + r.views, 0)} in total` : "–"}</p>
            <div className="mt-2">{series ? <Sparkline label="Views" points={series.map((r) => ({ day: r.date, value: r.views }))} formatDay={shortDay} /> : null}</div>
          </div>
          <div>
            <h2 className="text-base font-semibold">Price against the area</h2>
            {!comparison ? (
              <p className="text-sm text-slate-600">–</p>
            ) : comparison.basis === "none" ? (
              <p className="text-sm text-slate-600">Not enough comparable live listings on Dynasty yet to compare fairly.</p>
            ) : (
              <p className="text-sm text-slate-700">
                <span className="text-lg font-semibold text-slate-900">
                  {Math.abs(comparison.deltaPct) < 5 ? "In line" : `${Math.abs(comparison.deltaPct)}% ${comparison.deltaPct > 0 ? "above" : "below"}`}
                </span>{" "}
                the median of {comparison.count} live comparable listings in {comparison.area.replace(/\b\w/g, (c) => c.toUpperCase())}
                {comparison.metric === "perSqm" ? ` (R ${formatNumber(comparison.mine)} vs R ${formatNumber(comparison.median)} per m²)` : ` (median R ${formatNumber(comparison.median)})`}.
                <span className="block text-xs text-slate-500">Asking prices on Dynasty, not sale prices or a valuation.</span>
              </p>
            )}
          </div>
        </section>

        <section className="mt-6" aria-labelledby={`${noteId}-h`}>
          <h2 id={`${noteId}-h`} className={`text-base font-semibold ${note.trim() ? "" : "print:hidden"}`}>A note from your agent</h2>
          <label htmlFor={noteId} className="no-print mt-1 block text-sm text-slate-600">
            Optional. Printed as written; not saved.
          </label>
          <textarea
            id={noteId}
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="no-print mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          />
          {note.trim() ? <p className="print-only mt-1 whitespace-pre-wrap text-sm">{note}</p> : null}
        </section>

        {/* The one Dynasty mark: small, at the foot of the page. */}
        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500">
          {/* globals.css .report-mark keeps the black tile when printed. */}
          <span className="report-mark flex items-center gap-2">
            <BrandLogo markOnly compact showOnMobile />
            Report prepared with Dynasty Estates · {fmtDay(sastDay(now))}
          </span>
          <span className="break-all">{absoluteUrl(`/property/${listing.id}`)}</span>
        </footer>
      </article>
    </>
  );
}
