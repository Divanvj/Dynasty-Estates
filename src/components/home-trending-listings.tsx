"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import SavePropertyButton from "@/components/save-property-button";
import PropertyListCard from "@/components/property-list-card";
import PropertyCompactTable from "@/components/property-compact-table";
import PropertySplitMapView from "@/components/property-split-map-view";
import {
  AreaIcon,
  BathIcon,
  BedIcon,
  GridIcon,
  ListIcon,
  LocationPinIcon,
  MapSplitIcon,
  TableIcon,
} from "@/components/icons";
import { type PropertyRecord } from "@/lib/property-data";

export type ViewMode = "grid" | "list" | "map" | "compact";

const filters = ["All", "House", "Villa", "Estate Home", "Apartment", "Penthouse", "Townhouse"];

export default function HomeTrendingListings({ properties }: { properties: PropertyRecord[] }) {
  const [intent, setIntent] = useState<"rent" | "buy">("rent");
  const [activeFilter, setActiveFilter] = useState("All");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  useEffect(() => {
    function handleExternalIntent(e: Event) {
      const customEvent = e as CustomEvent<"rent" | "buy">;
      if (customEvent.detail === "rent" || customEvent.detail === "buy") {
        setIntent(customEvent.detail);
      }
    }
    window.addEventListener("dynasty:intent-change", handleExternalIntent);
    return () => window.removeEventListener("dynasty:intent-change", handleExternalIntent);
  }, []);

  function handleIntentChange(newIntent: "rent" | "buy") {
    setIntent(newIntent);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("dynasty:intent-change", { detail: newIntent }));
    }
  }

  // Strict separation: Zero mixing of buy and rent!
  const filtered = properties.filter((p) => {
    if (intent === "rent" && p.listingType !== "rent") return false;
    if (intent === "buy" && p.listingType === "rent") return false;

    if (activeFilter === "All") return true;
    return p.type === activeFilter;
  });

  return (
    <section id="listings" className="mx-auto mt-8 max-w-[1440px] rounded-[32px] border border-white/45 bg-white/35 dark:border-white/10 dark:bg-[#0c1a1c]/65 p-4 shadow-[0_20px_45px_rgba(15,23,42,0.06)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)] backdrop-blur-xl md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200/60 dark:border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-800 dark:text-emerald-400">
              {intent === "rent" ? "Trending Rentals" : "Properties For Sale"}
            </p>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            {/* Direct Rent vs Buy Switcher */}
            <div className="inline-flex rounded-full border border-slate-200/90 bg-white/80 dark:border-white/10 dark:bg-[#060d0e]/60 p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => handleIntentChange("rent")}
                className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  intent === "rent"
                    ? "bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 text-white shadow-sm dark:shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                    : "text-slate-600 dark:text-slate-300 hover:text-emerald-950 dark:hover:text-white"
                }`}
              >
                To Rent
              </button>
              <button
                type="button"
                onClick={() => handleIntentChange("buy")}
                className={`rounded-full px-3.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  intent === "buy"
                    ? "bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 text-white shadow-sm dark:shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                    : "text-slate-600 dark:text-slate-300 hover:text-emerald-950 dark:hover:text-white"
                }`}
              >
                For Sale
              </button>
            </div>
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white md:text-3xl">
            {intent === "rent" ? "Curated Rental Properties" : "Curated Luxury Homes & Estates"}
          </h2>
        </div>

        {/* View Switcher & Type Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Switcher Segmented Control */}
          <div className="inline-flex items-center rounded-2xl border border-slate-200/90 bg-white/80 dark:border-white/10 dark:bg-[#060d0e]/60 p-1 shadow-2xs backdrop-blur-md">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white border border-emerald-400/50 dark:border-emerald-400/60 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                  : "text-slate-600 dark:text-slate-300 hover:text-emerald-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-[#0c1a1c]"
              }`}
              title="Grid View (Photo Cards)"
            >
              <GridIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white border border-emerald-400/50 dark:border-emerald-400/60 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                  : "text-slate-600 dark:text-slate-300 hover:text-emerald-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-[#0c1a1c]"
              }`}
              title="List View (Detailed Cards)"
            >
              <ListIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                viewMode === "map"
                  ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white border border-emerald-400/50 dark:border-emerald-400/60 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                  : "text-slate-600 dark:text-slate-300 hover:text-emerald-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-[#0c1a1c]"
              }`}
              title="Split Map View (Interactive Map + Listings)"
            >
              <MapSplitIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Map</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("compact")}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                viewMode === "compact"
                  ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white border border-emerald-400/50 dark:border-emerald-400/60 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                  : "text-slate-600 dark:text-slate-300 hover:text-emerald-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-[#0c1a1c]"
              }`}
              title="Compact Table View (Investor Spreadsheet)"
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          {/* Property Type Sub-filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === filter
                    ? "bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 text-white shadow-md border border-emerald-400/30 dark:border-emerald-400/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                    : "border border-slate-200/80 bg-white/60 dark:border-white/10 dark:bg-[#060d0e]/60 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-[#0c1a1c] hover:border-emerald-400/50"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic View Presentation based on viewMode toolbar selection */}
      {filtered.length > 0 && (
        <>
          {/* 1. Grid View (Photo-first Cards) */}
          {viewMode === "grid" && (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((card) => (
                <article
                  key={card.id}
                  className="group overflow-hidden rounded-[28px] border border-white/70 bg-white/55 dark:border-white/10 dark:bg-[#0c1a1c]/75 shadow-[0_16px_35px_rgba(15,23,42,0.06)] dark:shadow-[0_16px_35px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-60 overflow-hidden bg-slate-200 dark:bg-[#060d0e]">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url(${card.image})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute right-3 top-3">
                      <SavePropertyButton propertyId={card.id} />
                    </div>
                    <div className="absolute left-3 top-3 flex items-center gap-1.5">
                      <span className="rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm border border-emerald-500/40 bg-emerald-950/80 text-emerald-200">
                        {card.listingType === "rent" ? "To Rent" : card.tag || "For Sale"}
                      </span>
                      {card.furnishedStatus && (
                        <span className="rounded-full border border-white/30 bg-black/30 px-2 py-0.5 text-[9px] font-medium text-white/90 backdrop-blur-sm dark:border-white/10">
                          {card.furnishedStatus}
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-3 text-white">
                      <p className="text-xl font-bold">{card.price}</p>
                      {card.leaseTerm && (
                        <p className="text-[10px] text-white/80 font-medium">Lease: {card.leaseTerm}</p>
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-slate-950 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors">
                          {card.title}
                        </h3>
                        <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <LocationPinIcon className="h-3.5 w-3.5 text-slate-400 shrink-0 dark:text-slate-400" />
                          <span>{card.location}</span>
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 dark:bg-[#060d0e]/80 dark:border dark:border-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {card.type}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-200/60 dark:border-white/10 pt-3 text-xs text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        <BedIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
                        <span>{card.beds} Beds</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <BathIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
                        <span>{card.baths} Baths</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <AreaIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
                        <span>{card.area}</span>
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {card.features?.slice(0, 2).map((f) => (
                          <span key={f} className="rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:text-emerald-300">
                            {f.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                      <Link
                        href={`/property/${card.slug || card.id}`}
                        className="rounded-full bg-gradient-to-r from-[#0b4d4e] to-[#07393a] hover:from-[#0d595b] hover:to-[#094344] dark:from-emerald-600 dark:to-emerald-700 dark:hover:from-emerald-500 dark:hover:to-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm dark:shadow-[0_0_12px_rgba(16,185,129,0.35)] border border-emerald-400/30 dark:border-emerald-400/50 transition-all"
                      >
                        {card.listingType === "rent" ? "View Rental →" : "View Home →"}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* 2. List View (Detailed Horizontal Cards) */}
          {viewMode === "list" && (
            <div className="mt-6 space-y-4">
              {filtered.map((card) => (
                <PropertyListCard key={card.id} property={card} />
              ))}
            </div>
          )}

          {/* 3. Split Map View (Google Maps & Street View) */}
          {viewMode === "map" && (
            <div className="mt-6">
              <PropertySplitMapView properties={filtered} />
            </div>
          )}

          {/* 4. Compact Table View (Investor & Yield Matrix) */}
          {viewMode === "compact" && (
            <div className="mt-6">
              <PropertyCompactTable properties={filtered} />
            </div>
          )}
        </>
      )}

      {filtered.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 p-8 text-center text-xs text-slate-500 dark:text-slate-400">
          No {intent === "rent" ? "rental properties" : "properties for sale"} in the catalogue currently match the &ldquo;{activeFilter}&rdquo; filter.
        </div>
      )}
    </section>
  );
}

