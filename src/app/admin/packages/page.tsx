"use client";

import Link from "next/link";

import { linkClass, PageHeading, panelClass } from "@/components/dashboard-ui";
import { formatNumber } from "@/lib/formatters";
import { agentPlans, listingExtensions, listingPackages } from "@/lib/pricing";

// The published price list, moved unchanged from the old "Commercial Packages"
// tab. Read from src/lib/pricing.ts, the same list /pricing shows. Requests
// arrive in Support as "Package request: …" and are invoiced by hand until
// online payment is built (pricing plan phases 2 and 4).

export default function AdminPackagesPage() {
  return (
    <>
      <PageHeading
        title="Packages"
        description="The published price list. Package and plan requests arrive in Support; payment is by invoice until online payment is built."
        action={<Link href="/pricing" className={`text-sm ${linkClass}`}>Open the public prices page</Link>}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {([
          ["Private sale (incl. VAT)", listingPackages.filter((pkg) => pkg.audience === "sale"), listingExtensions.find((ext) => ext.audience === "sale")],
          ["Private rental (incl. VAT)", listingPackages.filter((pkg) => pkg.audience === "rent"), listingExtensions.find((ext) => ext.audience === "rent")],
        ] as const).map(([title, pkgs, ext]) => (
          <div key={title} className={panelClass}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-400">{title}</h2>
            <ul className="mt-3 divide-y divide-[var(--dash-line)] text-sm text-slate-700 dark:text-slate-300">
              {pkgs.map((pkg) => (
                <li key={pkg.id} className="flex justify-between gap-3 py-2.5">
                  <span>{pkg.name} · {pkg.durationDays} days</span>
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-white">R {formatNumber(pkg.priceZAR)}</span>
                </li>
              ))}
              {ext && (
                <li className="flex justify-between gap-3 py-2.5 text-slate-600 dark:text-slate-400">
                  <span>Extend · +{ext.durationDays} days</span>
                  <span className="font-semibold tabular-nums">R {formatNumber(ext.priceZAR)}</span>
                </li>
              )}
            </ul>
          </div>
        ))}
        <div className={panelClass}>
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-400">Agent plans (per month, excl. VAT)</h2>
          <ul className="mt-3 divide-y divide-[var(--dash-line)] text-sm text-slate-700 dark:text-slate-300">
            {agentPlans.map((plan) => (
              <li key={plan.id} className="flex justify-between gap-3 py-2.5">
                <span>{plan.name} · {plan.liveListings ?? "150+"} listings</span>
                <span className="font-semibold tabular-nums">
                  {plan.monthlyZAR === null ? "Quoted" : `R ${formatNumber(plan.monthlyZAR)}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
