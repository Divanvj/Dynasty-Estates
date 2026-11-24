"use client";

import Link from "next/link";

import ListingWizard from "@/components/listing-wizard";
import RoleGuard from "@/components/role-guard";
import { useIsDeveloperAccount, useUserRole } from "@/lib/use-user-role";

/**
 * A new listing needs a paid package — private sellers, landlords, agents and
 * admins alike (owner, 24 Nov 2026). Online payment is not built yet, so until
 * it is only developer accounts reach the wizard; everyone else is told why
 * and sent to the prices. firestore.rules refuses the write as well, so this
 * page is the explanation, not the lock. Listings that already exist are not
 * affected: they are edited from the portals as before.
 */
export default function NewListingWizardPage() {
  const developer = useIsDeveloperAccount();
  return (
    <RoleGuard allowedRoles={["Seller", "Agent", "Admin"]} allowAnySignedIn featureName="Publish Listing">
      {developer ? <ListingWizard /> : <PackageRequired />}
    </RoleGuard>
  );
}

function PackageRequired() {
  const { role } = useUserRole();
  const practitioner = role === "Agent" || role === "Admin";
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10 text-slate-900 md:px-8 dark:text-white">
      <section
        aria-labelledby="package-required-heading"
        className="mx-auto max-w-xl rounded-panel border border-white/80 bg-white/70 p-6 shadow-[0_20px_45px_rgba(36,48,50,0.08)] md:p-8 dark:border-white/10 dark:bg-surface-panel/75"
      >
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-400">
          {practitioner ? "Agent plans" : "List your home"}
        </p>
        <h1 id="package-required-heading" className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">
          Choose a {practitioner ? "plan" : "listing package"} first
        </h1>
        <p className="mt-3 text-base text-slate-700 dark:text-slate-300">
          A new listing opens once your {practitioner ? "plan" : "package"} is paid. Paying online isn&rsquo;t available
          yet, so new listings are closed for now. You can request a {practitioner ? "plan" : "package"} today and
          we&rsquo;ll let you know when you can list.
        </p>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Homes you have already listed aren&rsquo;t affected.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={practitioner ? "/pricing?for=agents" : "/pricing"}
            className="pill-lg bg-slate-900 font-semibold text-white hover:bg-slate-800 dark:bg-emerald-700 dark:hover:bg-emerald-800"
          >
            See the {practitioner ? "plans" : "packages"}
          </Link>
          <Link
            href={practitioner ? "/agent/listings" : "/seller/portal"}
            className="pill-lg border border-slate-300 bg-white/70 font-semibold text-slate-900 hover:bg-white dark:border-white/15 dark:bg-surface-ink/60 dark:text-white dark:hover:bg-white/10"
          >
            Your listings
          </Link>
        </div>
      </section>
    </main>
  );
}
