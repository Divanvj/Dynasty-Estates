"use client";

import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { useState } from "react";
import AccountActions from "@/components/account-actions";
import { ArrowLeftIcon, PrinterIcon, XMarkIcon } from "@/components/icons";

import { fallbackProperties, type PropertyRecord } from "@/lib/property-data";

export default function ComparePage() {
  const [comparedProperties, setComparedProperties] = useState<PropertyRecord[]>([
    fallbackProperties[0],
    fallbackProperties[1],
    fallbackProperties[2] ?? fallbackProperties[0],
  ]);

  function removeProperty(id: string) {
    setComparedProperties((prev) => prev.filter((p) => p.id !== id));
  }

  function addProperty(prop: PropertyRecord) {
    if (comparedProperties.length >= 4) return;
    if (comparedProperties.some((p) => p.id === prop.id)) return;
    setComparedProperties((prev) => [...prev, prop]);
  }

  const unselectedProperties = fallbackProperties.filter(
    (p) => !comparedProperties.some((cp) => cp.id === p.id)
  );

  return (
    <main className="min-h-screen bg-[var(--background)] px-3 py-4 text-slate-900 md:px-8 dark:text-white">
      <div className="mx-auto max-w-6xl">
        {/* Navigation Header */}
        {/* relative z-50: `backdrop-blur-xl` already makes this bar a stacking
            context, so without an explicit z-index it sits at `auto` and the
            blurred comparison table below — also `auto`, but later in the DOM —
            painted over the Profile dropdown. See src/app/page.tsx. */}
        <header className="no-print relative z-50 mb-6 flex items-center justify-between rounded-card border border-white/75 bg-white/45 px-3.5 py-3 shadow-[0_12px_28px_rgba(36,48,50,0.08)] backdrop-blur-xl sm:px-5 dark:bg-surface-panel/70 dark:border-white/10 dark:shadow-[0_12px_30px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <BrandLogo markOnly />
            <div>
              <p className="hidden text-xs uppercase tracking-[0.2em] text-slate-500 sm:block sm:text-xs dark:text-slate-400">Buyer Decision Support</p>
              <h1 className="text-xs font-semibold tracking-wide text-slate-900 sm:text-sm dark:text-white">
                Compare
              </h1>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 gap-y-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="pill cursor-pointer gap-1.5 border border-slate-300/80 bg-white/60 font-semibold text-slate-700 transition-all hover:bg-white dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300 dark:hover:bg-white/10"
              title="Print / Export PDF"
            >
              <PrinterIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
              <span className="hidden sm:inline">Print / Export PDF</span>
            </button>
            <AccountActions />
            <Link
              href="/collections"
              className="pill gap-1 border border-slate-300/80 bg-white/60 font-semibold text-slate-700 transition-all hover:bg-white dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300 dark:hover:bg-white/10"
              title="Back to Collections"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5 sm:hidden" />
              <span className="hidden sm:inline">← Back to Collections</span>
            </Link>
          </div>
        </header>

        {/* Replaces the navigation bar on paper, where there is nothing to say
            what the sheet is or when it was run. Screen-hidden by .print-only. */}
        <div className="print-only mb-5 border-b border-slate-300 pb-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Dynasty Estates</p>
          <h2 className="text-lg font-bold">Side-by-Side Property Comparison</h2>
          {/* suppressHydrationWarning because the server and the browser format
              "today" at two different moments. Setting it from an effect would
              trip the project's react-hooks/set-state-in-effect rule, and this
              is the idiomatic answer for a rendered timestamp. */}
          <p className="text-xs text-slate-500" suppressHydrationWarning>
            {comparedProperties.length}{" "}
            {comparedProperties.length === 1 ? "property" : "properties"} · Prepared{" "}
            {new Date().toLocaleDateString("en-ZA", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Add Candidates Drawer / Selector */}
        {unselectedProperties.length > 0 && comparedProperties.length < 4 && (
          <div className="no-print mb-6 flex items-center gap-2 overflow-x-auto rounded-card border border-white/70 bg-white/40 p-3 backdrop-blur-md dark:bg-surface-panel/60 dark:border-white/10">
            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap px-2 dark:text-slate-300">+ Add to compare:</span>
            {unselectedProperties.map((prop) => (
              <button
                key={prop.id}
                onClick={() => addProperty(prop)}
                className="whitespace-nowrap rounded-xl border border-slate-300/70 bg-white/80 px-3 py-1.5 text-xs text-slate-800 hover:bg-emerald-50 hover:border-emerald-400 dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-200 dark:hover:bg-emerald-950/60 dark:hover:border-emerald-500/30"
              >
                + {prop.title} ({prop.price})
              </button>
            ))}
          </div>
        )}

        {/* Comparison Table / Matrix */}
        <div className="overflow-x-auto rounded-panel border border-white/80 bg-white/50 p-6 shadow-[0_20px_45px_rgba(36,48,50,0.1)] backdrop-blur-xl dark:bg-surface-panel/75 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/10">
                <th className="w-1/5 pb-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  Feature Matrix
                </th>
                {comparedProperties.map((prop) => (
                  <th key={prop.id} className="pb-4 px-3 text-center align-top">
                    <div className="relative mx-auto max-w-[220px]">
                      <div
                        className="h-32 w-full rounded-2xl bg-cover bg-center shadow-sm"
                        style={{ backgroundImage: `url(${prop.image})` }}
                      />
                      {/* z-30: removing a column is a different action from
                          opening the property, so it stays above the overlay. */}
                      <button
                        onClick={() => removeProperty(prop.id)}
                        className="no-print absolute -top-2 -right-2 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white shadow-md hover:bg-rose-600 transition-colors cursor-pointer"
                        title="Remove from comparison"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                      {/* `card-link` stretches this over the column header, so
                          the photograph, title and price all open the property
                          rather than only the button in the Action row. The
                          overlay is bounded by the `relative` wrapper above, so
                          it covers the header and not the whole column. */}
                      <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                        <Link className="card-link" href={`/property/${prop.slug}`}>
                          {prop.title}
                        </Link>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{prop.location}</p>
                      <p className="mt-1 text-sm font-extrabold text-emerald-700 dark:text-emerald-400">{prop.price}</p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-white/10 text-xs text-slate-700 dark:text-slate-300">
              <tr>
                <td className="py-3.5 font-semibold text-slate-600 dark:text-slate-300">Property Type</td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="py-3.5 px-3 text-center font-medium">{p.type}</td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 font-semibold text-slate-600 dark:text-slate-300">Bedrooms / Bathrooms</td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="py-3.5 px-3 text-center font-medium">
                    {p.beds} Beds · {p.baths} Baths
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 font-semibold text-slate-600 dark:text-slate-300">Parking / Garages</td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="py-3.5 px-3 text-center font-medium">
                    {p.parking} Garages
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 font-semibold text-slate-600 dark:text-slate-300">Floor Area</td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="py-3.5 px-3 text-center font-medium">{p.area}</td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 font-semibold text-slate-600 dark:text-slate-300">Energy & Resilience</td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="py-3.5 px-3 text-center">
                    <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-500/30">
                      Solar + Inverter Ready
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 font-semibold text-slate-600 dark:text-slate-300">Security Rating</td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="py-3.5 px-3 text-center font-medium">
                    ★★★★★ (24h Manned)
                  </td>
                ))}
              </tr>
              {/* A row of buttons is the one thing paper cannot use. */}
              <tr className="no-print">
                <td className="py-3.5 font-semibold text-slate-600 dark:text-slate-300">Action</td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="py-3.5 px-3 text-center">
                    <Link
                      href={`/property/${p.slug}`}
                      className="pill bg-slate-900 font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                    >
                      View Details
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

