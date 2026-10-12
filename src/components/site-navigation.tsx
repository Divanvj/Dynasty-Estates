"use client";

import Link from "next/link";
import { BriefcaseIcon, HomeIcon, ShieldIcon, SparklesIcon } from "@/components/icons";
import { useUserRole } from "@/lib/use-user-role";

export default function SiteNavigation() {
  const { role } = useUserRole();

  return (
    <nav className="hidden items-center gap-5 text-xs font-semibold text-slate-700 dark:text-slate-300 lg:flex">
      {role === "Buyer" && (
        <>
          <Link href="/search" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">
            Catalogue
          </Link>
          <Link href="/map-search" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">
            Map Search
          </Link>
          <Link href="/ai-search" className="inline-flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 font-bold hover:text-emerald-950 dark:hover:text-emerald-300 transition-colors">
            <SparklesIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>AI Concierge</span>
          </Link>
          <Link href="/calculators" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">
            Calculators
          </Link>
          <Link href="/collections" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">
            Collections
          </Link>
          <Link href="/compare" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">
            Compare
          </Link>
          <Link href="/agents" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">
            Agents
          </Link>
          <Link href="/insights" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">
            Insights
          </Link>
        </>
      )}

      {role === "Seller" && (
        <>
          <Link href="/seller/portal" className="inline-flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 font-bold hover:text-emerald-950 dark:hover:text-emerald-300 transition-colors">
            <HomeIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Seller Portal</span>
          </Link>
          <Link href="/seller/listings/new" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">
            + New Listing
          </Link>
          <Link href="/search" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">
            Catalogue
          </Link>
          <Link href="/calculators" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">
            Calculators
          </Link>
          <Link href="/insights" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">
            Market Insights
          </Link>
        </>
      )}

      {role === "Agent" && (
        <>
          <Link href="/agent/dashboard" className="inline-flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 font-bold hover:text-emerald-950 dark:hover:text-emerald-300 transition-colors">
            <BriefcaseIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Agent Console</span>
          </Link>
          <Link href="/seller/listings/new" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">
            + Add Mandate
          </Link>
          <Link href="/search" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">
            Catalogue
          </Link>
          <Link href="/agents" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">
            Directory
          </Link>
          <Link href="/insights" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">
            Market Insights
          </Link>
        </>
      )}

      {role === "Admin" && (
        <>
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 font-bold hover:text-emerald-950 dark:hover:text-emerald-300 transition-colors">
            <ShieldIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Platform Admin</span>
          </Link>
          <Link href="/search" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">
            All Listings
          </Link>
          <Link href="/insights" className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">
            Market Pulse
          </Link>
        </>
      )}
    </nav>
  );
}

