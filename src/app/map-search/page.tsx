"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import PropertySplitMapView from "@/components/property-split-map-view";
import { SparklesIcon } from "@/components/icons";
import { getPropertyList, type PropertyRecord } from "@/lib/property-data";

export default function MapSearchPage() {
  const [activeType, setActiveType] = useState<string>("All");

  /**
   * The real catalogue. This page used to import `fallbackProperties` and map
   * the demo listings instead — so every other surface showed Firestore data
   * while the map showed twenty invented homes.
   *
   * It has to be fetched rather than awaited: this is a client component, so it
   * cannot await at the top the way the home page's server component does.
   */
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const list = await getPropertyList();
        if (!cancelled) setProperties(list);
      } catch (error) {
        // Deliberately not falling back to demo listings here. Quietly swapping
        // in invented homes is how a broken catalogue goes unnoticed — the map
        // looks fine and every pin is a lie. Say so instead.
        console.error("Map search could not load the catalogue:", error);
        if (!cancelled) setLoadFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Memoised because this array is handed to the map, which keys its own
  // `shown` memo off it. Rebuilt inline on every render, it invalidated that
  // memo each time and kept the map's area-filter effect re-running.
  const filteredProperties = useMemo(
    () => properties.filter((p) => activeType === "All" || p.type === activeType),
    [properties, activeType]
  );

  return (
    <main className="min-h-screen bg-transparent px-3 py-4 text-slate-900 dark:text-slate-100 md:px-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Navigation Header */}
        <div className="relative z-50 mb-6 flex items-center justify-between rounded-card border border-white/75 bg-white/45 dark:border-white/10 dark:bg-[#0b1719]/70 px-3.5 sm:px-5 py-3 shadow-[0_12px_28px_rgba(36,48,50,0.08)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-600 dark:text-emerald-400/80 font-bold hidden sm:block">Geospatial Intelligence</p>
              <h1 className="text-xs sm:text-sm font-semibold tracking-wide text-slate-900 dark:text-white">
                <span className="hidden sm:inline">Dynasty Live </span>Map &amp; Street View
              </h1>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 gap-y-2 sm:gap-2.5">
            {/* Same stray `hidden` as on /saved: a bare `hidden` outranks
                `.pill`'s own display, so this link rendered at no width. */}
            <Link
              href="/search"
              className="pill border border-slate-300/80 bg-white/60 dark:border-white/10 dark:bg-surface-ink/60 font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-surface-panel dark:hover:text-white transition-all"
            >
              List View
            </Link>
            <Link
              href="/ai-search"
              className="pill hidden sm:inline-flex bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 text-white border border-emerald-400/40 font-semibold shadow-xs dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:scale-102 transition-all"
            >
              <SparklesIcon className="h-3 w-3 text-emerald-300 dark:text-emerald-100" />
              <span>AI Search</span>
            </Link>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="relative z-30 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-card border border-white/80 bg-white/50 dark:border-white/10 dark:bg-surface-panel/80 p-3 backdrop-blur-xl shadow-sm dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          {/* Swipeable on phones — wrapping these cost three rows above the map. */}
          <div className="flex w-full lg:w-auto min-w-0 items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:overflow-visible">
            <span className="shrink-0 text-xs font-bold text-slate-600 dark:text-slate-400 mr-1">Type:</span>
            {["All", "House", "Villa", "Estate Home", "Apartment", "Penthouse"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={`pill tap-44 relative font-semibold transition-all cursor-pointer ${ activeType === t ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white border border-emerald-400/50 shadow-xs dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]" : "border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-surface-ink/60 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-surface-panel dark:hover:text-white" }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Same rule as /search: the count appears once the visitor has
              narrowed something, and uses the same word for it. With "All"
              selected the number is just the size of the catalogue, which is
              not an answer to anything the visitor asked. */}
          {!loading && activeType !== "All" && (
            <span className="badge border border-transparent bg-emerald-100/90 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400">
              {filteredProperties.length} {filteredProperties.length === 1 ? "match" : "matches"}
            </span>
          )}
        </div>

        {/* Real Interactive Google Maps & Street View Console */}
        <div className="relative z-10">
          {loading ? (
            <div className="flex h-[420px] items-center justify-center rounded-card border border-white/80 bg-white/60 backdrop-blur-xl sm:h-[500px] lg:h-[620px] dark:border-white/10 dark:bg-surface-panel/80">
              <p className="animate-pulse text-xs font-semibold text-slate-600 dark:text-slate-400">
                Loading the catalogue…
              </p>
            </div>
          ) : loadFailed ? (
            /* An empty map is indistinguishable from "no listings match", so a
               failed catalogue has to say so rather than render a blank map. */
            <div className="flex h-[420px] flex-col items-center justify-center gap-2 rounded-card border border-white/80 bg-white/60 px-6 text-center backdrop-blur-xl sm:h-[500px] lg:h-[620px] dark:border-white/10 dark:bg-surface-panel/80">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Listings could not be loaded
              </p>
              <p className="max-w-sm text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                The property catalogue did not respond, so the map has nothing to
                plot. Try again shortly — this is not a filter you have applied.
              </p>
            </div>
          ) : (
            <PropertySplitMapView properties={filteredProperties} />
          )}
        </div>
      </div>
    </main>
  );
}

