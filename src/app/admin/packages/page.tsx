"use client";

import Link from "next/link";

import { linkClass, PageHeading } from "@/components/dashboard-ui";
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
          <div key={title} className="rounded-card border border-white/80 bg-white/50 p-5 shadow-sm dark:bg-surface-ink/70 dark:border-white/10">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
              {pkgs.map((pkg) => (
                <li key={pkg.id} className="flex justify-between gap-3">
                  <span>{pkg.name} · {pkg.durationDays} days</span>
                  <span className="font-semibold tabular-nums">R {formatNumber(pkg.priceZAR)}</span>
                </li>
              ))}
              {ext && (
                <li className="flex justify-between gap-3 border-t border-slate-200/60 pt-1.5 dark:border-white/10">
                  <span>Extend · +{ext.durationDays} days</span>
                  <span className="font-semibold tabular-nums">R {formatNumber(ext.priceZAR)}</span>
                </li>
              )}
            </ul>
          </div>
        ))}
        <div className="rounded-card border border-white/80 bg-white/50 p-5 shadow-sm dark:bg-surface-ink/70 dark:border-white/10">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Agent plans (per month, excl. VAT)</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
            {agentPlans.map((plan) => (
              <li key={plan.id} className="flex justify-between gap-3">
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
