"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import CustomSelect from "@/components/custom-select";
import { errorBoxClass, linkClass, PageHeading, panelClass, StatTile } from "@/components/dashboard-ui";
import PrintButton from "@/components/print-button";
import { formatDate, formatNumber } from "@/lib/formatters";
import { getLiveComparables, marketSnapshot, MIN_COMPARABLES, type Comparable } from "@/lib/listing-insights";

// Pattern 9 — Analytics, report-runner subtype (docs/dashboards/PLAN.md,
// Phase E). Price snapshot for a listing appointment: choose sale or rent, a
// home type and an area, and read the asking prices of live Dynasty listings
// there. Parameters and results stay on one page; print is the export.
// Only listings stored in Firestore count — never the sample catalogue — and
// nothing is shown from fewer than MIN_COMPARABLES homes.

const ANY = "any";
const title = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

export default function MarketSnapshotPage() {
  const [all, setAll] = useState<Comparable[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [listingType, setListingType] = useState<"sale" | "rent">("sale");
  const [type, setType] = useState(ANY);
  const [area, setArea] = useState(ANY);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    getLiveComparables()
      .then((rows) => !cancelled && setAll(rows))
      .catch((error) => {
        console.error("Price snapshot load failed:", error);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pool = (all ?? []).filter((c) => c.listingType === listingType && c.price > 0);
  const types = Array.from(new Set(pool.map((c) => c.type).filter(Boolean))).sort();
  const ofType = pool.filter((c) => type === ANY || c.type === type);
  // Areas: suburbs and cities, each with its count, largest first.
  const areaCounts = new Map<string, number>();
  for (const c of ofType) {
    if (c.suburb) areaCounts.set(`s:${c.suburb}`, (areaCounts.get(`s:${c.suburb}`) ?? 0) + 1);
    if (c.city) areaCounts.set(`c:${c.city}`, (areaCounts.get(`c:${c.city}`) ?? 0) + 1);
  }
  const areaOptions = [...areaCounts.entries()].sort((a, b) => b[1] - a[1]);
  const rows = ofType.filter((c) => {
    if (area === ANY) return true;
    const [kind, name] = [area.slice(0, 1), area.slice(2)];
    return kind === "s" ? c.suburb === name : c.city === name;
  });
  const snapshot = rows.length >= MIN_COMPARABLES ? marketSnapshot(rows) : null;
  const areaLabel = area === ANY ? "All areas" : `${title(area.slice(2))} (${area.startsWith("s:") ? "suburb" : "city"})`;
  const typeLabel = type === ANY ? "All home types" : title(type);
  const rand = (n: number) => `R ${formatNumber(n)}`;

  return (
    <>
      <PageHeading
        title="Price snapshot"
        description="Asking prices of live Dynasty listings for an area and home type, to take to a listing appointment. Asking prices only: not sale prices and not a valuation."
        action={<PrintButton label="Print or save as PDF" title="Print this price snapshot or save it as a PDF" />}
      />

      <div className="no-print mb-6 flex flex-wrap items-end gap-3">
        <CustomSelect
          label="For"
          value={listingType}
          onChange={(v) => { setListingType(v === "rent" ? "rent" : "sale"); setType(ANY); setArea(ANY); }}
          options={[{ value: "sale", label: "For sale" }, { value: "rent", label: "To rent" }]}
          className="w-40"
        />
        <CustomSelect
          label="Home type"
          value={type}
          onChange={(v) => { setType(v); setArea(ANY); }}
          options={[{ value: ANY, label: "All home types" }, ...types.map((t) => ({ value: t, label: title(t) }))]}
          className="w-48"
        />
        <CustomSelect
          label="Area"
          value={area}
          onChange={setArea}
          searchable
          options={[
            { value: ANY, label: "All areas" },
            ...areaOptions.map(([key, n]) => ({ value: key, label: title(key.slice(2)), sublabel: `${key.startsWith("s:") ? "Suburb" : "City"} · ${n} live` })),
          ]}
          className="w-64"
        />
      </div>

      {/* Printed heading: what the figures are for. */}
      <p className="print-only mb-4 text-sm">
        {listingType === "rent" ? "To rent" : "For sale"} · {typeLabel} · {areaLabel} · {formatDate(now)}
      </p>

      {failed ? (
        <p role="alert" className={errorBoxClass}>Live listings couldn&rsquo;t be loaded. Check your connection and refresh the page.</p>
      ) : !all ? (
        <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading live listings…</p>
      ) : !snapshot ? (
        <section className={panelClass}>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {rows.length} live {rows.length === 1 ? "listing matches" : "listings match"}; at least {MIN_COMPARABLES} are needed before a median means anything.
            {area !== ANY || type !== ANY ? " Try a wider area or all home types." : " Dynasty does not have enough live listings for this yet."}
          </p>
        </section>
      ) : (
        <>
          <section aria-label="Figures" className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Median asking price" value={rand(snapshot.median)} detail={`${snapshot.count} live listings`} />
            <StatTile
              label="Middle half"
              value={snapshot.quartiles ? `${rand(snapshot.quartiles.p25)} – ${rand(snapshot.quartiles.p75)}` : "–"}
              detail={snapshot.quartiles ? "25th to 75th percentile" : "Needs 8 or more listings"}
            />
            <StatTile label="Range" value={`${rand(snapshot.min)} – ${rand(snapshot.max)}`} detail="Lowest to highest" />
            <StatTile
              label="Median per m²"
              value={snapshot.perSqm ? rand(snapshot.perSqm.median) : "–"}
              detail={snapshot.perSqm ? `${snapshot.perSqm.count} listings give a floor size` : `Fewer than ${MIN_COMPARABLES} give a floor size`}
            />
          </section>

          <section aria-labelledby="comparables-heading" className="overflow-hidden rounded-card border border-slate-200 bg-white/70 dark:border-white/10 dark:bg-surface-panel/80">
            <h2 id="comparables-heading" className="px-4 pt-4 text-lg font-semibold text-slate-900 dark:text-white">The {rows.length} listings</h2>
            <div className="overflow-x-auto">
              <table className="mt-2 w-full min-w-[560px] text-left text-sm tabular-nums">
                <thead className="border-y border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-600 dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-400">
                  <tr>
                    <th scope="col" className="px-4 py-2 font-bold">Listing</th>
                    <th scope="col" className="px-4 py-2 font-bold">Type</th>
                    <th scope="col" className="px-4 py-2 text-right font-bold">Asking price</th>
                    <th scope="col" className="px-4 py-2 text-right font-bold">Floor size</th>
                    <th scope="col" className="px-4 py-2 text-right font-bold">Per m²</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 dark:divide-white/10 dark:text-slate-300">
                  {[...rows].sort((a, b) => a.price - b.price).map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-2">
                        <Link href={`/property/${c.id}`} className={linkClass}>{c.title}</Link>
                        <span className="block text-xs text-slate-600 dark:text-slate-400">{c.location}{c.status === "Under offer" ? " · Under offer" : ""}</span>
                      </td>
                      <td className="px-4 py-2">{title(c.type)}</td>
                      <td className="px-4 py-2 text-right font-semibold text-slate-900 dark:text-white">{rand(c.price)}</td>
                      <td className="px-4 py-2 text-right">{c.floorSizeSqm ? `${formatNumber(c.floorSizeSqm)} m²` : "–"}</td>
                      <td className="px-4 py-2 text-right">{c.floorSizeSqm ? rand(c.price / c.floorSizeSqm) : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <p className="mt-4 text-xs text-slate-600 dark:text-slate-400">
            Source: listings published on Dynasty Estates, {formatDate(now)}. Asking prices only — sold prices (Deeds Office, Lightstone) are not included.
          </p>
        </>
      )}
    </>
  );
}
