"use client";

import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { useState } from "react";

import PropertySplitMapView from "@/components/property-split-map-view";
import AccountActions from "@/components/account-actions";
import { SparklesIcon } from "@/components/icons";
import { fallbackProperties } from "@/lib/property-data";

export default function MapSearchPage() {
  const [activeType, setActiveType] = useState<string>("All");

  const filteredProperties = fallbackProperties.filter((p) => {
    if (activeType !== "All" && p.type !== activeType) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-transparent px-3 py-4 text-slate-900 dark:text-slate-100 md:px-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Navigation Header */}
        <header className="relative z-50 mb-6 flex items-center justify-between rounded-[26px] border border-white/75 bg-white/45 dark:border-white/10 dark:bg-[#0b1719]/70 px-3.5 sm:px-5 py-3 shadow-[0_12px_28px_rgba(36,48,50,0.08)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <BrandLogo markOnly />
            <div>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-emerald-400/80 font-bold hidden sm:block">Geospatial Intelligence</p>
              <h1 className="text-xs sm:text-sm font-semibold tracking-wide text-slate-900 dark:text-white">
                <span className="hidden sm:inline">Dynasty Live </span>Map &amp; Street View
              </h1>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 gap-y-2 sm:gap-2.5">
            <Link
              href="/search"
              className="hidden sm:inline-block rounded-full border border-slate-300/80 bg-white/60 dark:border-white/10 dark:bg-[#060d0e]/60 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-[#0c1a1c] dark:hover:text-white transition-all whitespace-nowrap shrink-0"
            >
              List View
            </Link>
            <Link
              href="/ai-search"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 text-white border border-emerald-400/40 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold shadow-xs dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:scale-102 transition-all whitespace-nowrap shrink-0"
            >
              <SparklesIcon className="h-3 w-3 text-emerald-300 dark:text-emerald-100" />
              <span>AI Search</span>
            </Link>
            <AccountActions />
          </div>
        </header>

        {/* Filter Toolbar */}
        <div className="relative z-30 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/80 bg-white/50 dark:border-white/10 dark:bg-[#0c1a1c]/80 p-3 backdrop-blur-xl shadow-sm dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          {/* Swipeable on phones — wrapping these cost three rows above the map. */}
          <div className="flex w-full lg:w-auto min-w-0 items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:overflow-visible">
            <span className="shrink-0 text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">Type:</span>
            {["All", "House", "Villa", "Estate Home", "Apartment", "Penthouse"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={`shrink-0 rounded-full px-3 py-1.5 lg:py-1 text-xs font-semibold transition-all cursor-pointer ${
                  activeType === t
                    ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white border border-emerald-400/50 shadow-xs dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                    : "border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-[#060d0e]/60 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-[#0c1a1c] dark:hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <span className="rounded-full bg-emerald-100/90 dark:bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-400 border border-transparent dark:border-emerald-500/30">
            {filteredProperties.length} Properties Mapped
          </span>
        </div>

        {/* Real Interactive Google Maps & Street View Console */}
        <div className="relative z-10">
          <PropertySplitMapView properties={filteredProperties} />
        </div>
      </div>
    </main>
  );
}

