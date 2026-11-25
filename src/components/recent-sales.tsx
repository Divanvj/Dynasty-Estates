"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { errorBoxClass, linkClass, SummaryStrip, tableFrameClass, tableHeadClass, tableRowClass } from "@/components/dashboard-ui";
import { formatDate, formatNumber } from "@/lib/formatters";
import { MIN_SALES, SALES_MONTHS, type SaleKind, type SalesSummary } from "@/lib/sales";

/**
 * Sold prices recorded on Dynasty for an area and home type (lib/sales.ts),
 * on /agent/market and in the seller report. Figures need MIN_SALES sales;
 * individual sales are listed only where the seller agreed to show the price.
 */

const rand = (n: number) => `R ${formatNumber(n)}`;

export function RecentSales({
  kind,
  area,
  type,
  areaLabel,
  compact = false,
}: {
  kind: SaleKind;
  /** A suburb or city; empty for everywhere. */
  area: string;
  /** A home type; empty for all. */
  type: string;
  areaLabel: string;
  /** The seller report: figures and at most five sales, no table chrome. */
  compact?: boolean;
}) {
  const [state, setState] = useState<{ key: string; data: SalesSummary | null; error: string | null } | null>(null);
  const key = `${kind}|${area}|${type}`;

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ kind, area, type });
    fetch(`/api/market/sales?${params}`)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body.error ?? "Sales figures couldn't be loaded.");
        if (!cancelled) setState({ key, data: body as SalesSummary, error: null });
      })
      .catch((e: Error) => !cancelled && setState({ key, data: null, error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [key, kind, area, type]);

  const rental = kind === "rental";
  const noun = rental ? "rental" : "sale";
  const current = state?.key === key ? state : null;
  const source = `Recorded on Dynasty Estates by the listing's agent or seller over the last ${SALES_MONTHS} months. Not Deeds Office or Lightstone data.`;

  if (!current) return <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading recorded {noun}s…</p>;
  if (current.error) return <p role="alert" className={errorBoxClass}>{current.error}</p>;
  const data = current.data!;
  const shown = compact ? data.publicSales.slice(0, 5) : data.publicSales;

  return (
    <div>
      {data.figures ? (
        <SummaryStrip
          label={`Recorded ${noun}s`}
          items={[
            { label: rental ? "Median rent" : "Median sold price", value: `about ${rand(data.figures.medianPrice)}`, note: `${data.countBand} ${noun}s · ${areaLabel}`, tone: "accent" },
            {
              label: rental ? "Rent vs asking" : "Sold vs asking",
              value: data.figures.medianRatio !== null ? `${Math.round(data.figures.medianRatio * 100)}%` : "–",
              note: data.figures.medianRatio !== null ? "Median of price ÷ asking price" : `Fewer than ${MIN_SALES} had an asking price`,
            },
            {
              label: rental ? "Days to let" : "Days to sell",
              value: data.figures.medianDays !== null ? String(data.figures.medianDays) : "–",
              note: data.figures.medianDays !== null ? "Median, from going live, to the nearest 5" : `Fewer than ${MIN_SALES} had both dates`,
            },
            {
              label: "Median per m²",
              value: data.figures.medianPerSqm !== null ? `about ${rand(data.figures.medianPerSqm)}` : "–",
              note: data.figures.medianPerSqm !== null ? "Where a floor size was given" : `Fewer than ${MIN_SALES} gave a floor size`,
            },
          ]}
        />
      ) : (
        <p className="mb-4 text-sm text-slate-700 dark:text-slate-300">
          {!data.hasSales
            ? `No ${noun}s recorded on Dynasty here yet.`
            : `Fewer than ${MIN_SALES} ${noun}s recorded here; figures need at least ${MIN_SALES}, so no one home's price can be worked out from them.`}
        </p>
      )}

      {shown.length ? (
        compact ? (
          <ul className="space-y-1 text-sm">
            {shown.map((s) => (
              <li key={s.listingId} className="flex justify-between gap-4 border-b border-[var(--dash-line)] py-1.5">
                <span className="min-w-0">
                  {s.title}
                  <span className="block text-xs text-slate-600 dark:text-slate-400">{s.location} · {formatDate(`${s.soldOn}T12:00:00Z`)}</span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums">{rand(s.price)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <section aria-label={`Recent ${noun}s with the price shown`} className={tableFrameClass}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm tabular-nums">
                <thead className={tableHeadClass}>
                  <tr>
                    <th scope="col" className="px-5 py-2.5">Home</th>
                    <th scope="col" className="px-4 py-2.5">Type</th>
                    <th scope="col" className="px-4 py-2.5">{rental ? "Let on" : "Sold on"}</th>
                    <th scope="col" className="px-5 py-2.5 text-right">{rental ? "Rent" : "Price"}</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 dark:text-slate-300">
                  {shown.map((s) => (
                    <tr key={s.listingId} className={tableRowClass}>
                      <td className="px-5 py-2.5">
                        <Link href={`/property/${s.listingId}`} className={linkClass}>{s.title}</Link>
                        <span className="block text-xs text-slate-600 dark:text-slate-400">{s.location}{s.beds ? ` · ${s.beds} bed` : ""}</span>
                      </td>
                      <td className="px-4 py-2.5">{s.type}</td>
                      <td className="px-4 py-2.5">{formatDate(`${s.soldOn}T12:00:00Z`)}</td>
                      <td className="px-5 py-2.5 text-right font-semibold text-slate-900 dark:text-white">{rand(s.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      ) : data.hasSales ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">No seller here has agreed to show their price, so none are listed one by one.</p>
      ) : null}
      <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">{source}</p>
    </div>
  );
}
