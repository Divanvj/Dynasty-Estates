"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SavePropertyButton from "@/components/save-property-button";
import {
  BedIcon,
  BathIcon,
  CarIcon,
  LocationPinIcon,
} from "@/components/icons";
import type { PropertyRecord } from "@/lib/property-data";

export interface PropertyCompactTableProps {
  properties: PropertyRecord[];
}

type SortColumn = "title" | "price" | "beds" | "baths" | "area" | "pricePerM2";
type SortDirection = "asc" | "desc";

function parseNumericPrice(priceStr: string): number {
  const digits = priceStr.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

function parseNumericArea(areaStr: string): number {
  const digits = areaStr.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

export default function PropertyCompactTable({ properties }: PropertyCompactTableProps) {
  const [sortCol, setSortCol] = useState<SortColumn>("price");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  function handleHeaderClick(col: SortColumn) {
    if (sortCol === col) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  const enrichedProperties = useMemo(() => {
    return properties.map((prop) => {
      const numPrice = parseNumericPrice(prop.price);
      const numArea = parseNumericArea(prop.area);
      const pricePerM2 = numArea > 0 && numPrice > 0 ? Math.round(numPrice / numArea) : 0;
      return {
        ...prop,
        numPrice,
        numArea,
        pricePerM2,
      };
    });
  }, [properties]);

  const sortedProperties = useMemo(() => {
    return [...enrichedProperties].sort((a, b) => {
      let result = 0;
      if (sortCol === "title") {
        result = a.title.localeCompare(b.title);
      } else if (sortCol === "price") {
        result = a.numPrice - b.numPrice;
      } else if (sortCol === "beds") {
        result = a.beds - b.beds;
      } else if (sortCol === "baths") {
        result = a.baths - b.baths;
      } else if (sortCol === "area") {
        result = a.numArea - b.numArea;
      } else if (sortCol === "pricePerM2") {
        result = a.pricePerM2 - b.pricePerM2;
      }
      return sortDir === "asc" ? result : -result;
    });
  }, [enrichedProperties, sortCol, sortDir]);

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/80 dark:border-white/10 bg-white/75 dark:bg-[#0c1a1c]/80 shadow-[0_16px_36px_rgba(36,48,50,0.08)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.3)] backdrop-blur-xl">
      {/* Table Subheader Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-[#060d0e]/60 px-5 py-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Investor & Power-User Comparison Table</span>
          <span className="text-slate-400 dark:text-slate-500 font-normal">({properties.length} active listings)</span>
        </div>
        <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400">
          💡 Click column headers to sort by price, square meters, bedrooms, or yield/m².
        </p>
      </div>

      {/* Sorting on phones, where there are no column headers to click. */}
      <div className="md:hidden flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-slate-200/80 dark:border-white/10 px-4 py-2.5">
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Sort
        </span>
        {(
          [
            ["price", "Price"],
            ["beds", "Beds"],
            ["area", "Size"],
            ["pricePerM2", "Rate / m²"],
            ["title", "Name"],
          ] as [SortColumn, string][]
        ).map(([col, label]) => (
          <button
            key={col}
            type="button"
            onClick={() => handleHeaderClick(col)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              sortCol === col
                ? "bg-slate-950 text-white dark:bg-emerald-600 dark:border-emerald-500/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                : "border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#060d0e]/60 text-slate-700 dark:text-slate-300"
            }`}
          >
            {label}
            {sortCol === col && <span className="ml-1">{sortDir === "asc" ? "▲" : "▼"}</span>}
          </button>
        ))}
      </div>

      {/* Phones get stacked cards: seven columns squeezed into 390px clipped the
          price and wrapped the badges. The real table returns from `md`. */}
      <ul className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
        {sortedProperties.map((prop) => {
          const hasSolar = prop.features?.some(
            (f) => f.includes("solar") || f.includes("inverter") || f.includes("backup")
          );
          const hasBorehole = prop.features?.some((f) => f.includes("water") || f.includes("borehole"));
          return (
            <li key={prop.id} className="p-4">
              <div className="flex gap-3">
                <Link
                  href={`/property/${prop.slug || prop.id}`}
                  className="h-20 w-20 shrink-0 rounded-2xl bg-slate-200 dark:bg-[#060d0e] bg-cover bg-center border border-slate-200 dark:border-white/10"
                  style={{ backgroundImage: `url(${prop.image})` }}
                  aria-label={prop.title}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/property/${prop.slug || prop.id}`}
                      className="font-bold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2"
                    >
                      {prop.title}
                    </Link>
                    <SavePropertyButton propertyId={prop.id} />
                  </div>

                  <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <LocationPinIcon className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {prop.suburb || prop.location.split(",")[0]}
                      {prop.city ? `, ${prop.city}` : ""}
                    </span>
                  </p>

                  <p className="mt-1.5 text-base font-extrabold text-slate-950 dark:text-white">
                    {prop.price}
                  </p>
                  {prop.listingType === "rent" && (
                    <p className="text-[10px] font-medium text-amber-800 dark:text-amber-300">
                      {prop.leaseTerm || "12M"}
                      {prop.furnishedStatus ? ` · ${prop.furnishedStatus}` : ""}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <BedIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  {prop.beds}
                </span>
                <span className="flex items-center gap-1">
                  <BathIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  {prop.baths}
                </span>
                <span className="flex items-center gap-1">
                  <CarIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  {prop.parking}
                </span>
                <span className="text-slate-400 dark:text-slate-500">·</span>
                <span className="font-semibold">{prop.area}</span>
                {prop.pricePerM2 > 0 && (
                  <>
                    <span className="text-slate-400 dark:text-slate-500">·</span>
                    <span className="font-semibold">R {prop.pricePerM2.toLocaleString("en-ZA")}/m²</span>
                  </>
                )}
              </div>

              {(hasSolar || hasBorehole) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {hasSolar && (
                    <span className="rounded-full bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20">
                      Solar / Backup
                    </span>
                  )}
                  {hasBorehole && (
                    <span className="rounded-full bg-sky-100 dark:bg-sky-950/50 px-2 py-0.5 text-[10px] font-bold text-sky-900 dark:text-sky-300 border border-sky-200 dark:border-sky-500/20">
                      Water Backup
                    </span>
                  )}
                </div>
              )}

              <Link
                href={`/property/${prop.slug || prop.id}`}
                className="mt-3 flex min-h-[44px] items-center justify-center rounded-full bg-slate-950 px-4 text-xs font-bold text-white transition-colors hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
              >
                View Home →
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Responsive Table Container */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-[#060d0e]/80 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 select-none">
              <th className="py-3.5 pl-5 pr-3">Property</th>
              <th className="py-3.5 px-3">Location</th>
              <th
                onClick={() => handleHeaderClick("price")}
                className="py-3.5 px-3 cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Price</span>
                  {sortCol === "price" && <span>{sortDir === "asc" ? "▲" : "▼"}</span>}
                </div>
              </th>
              <th
                onClick={() => handleHeaderClick("beds")}
                className="py-3.5 px-3 cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Beds/Baths</span>
                  {sortCol === "beds" && <span>{sortDir === "asc" ? "▲" : "▼"}</span>}
                </div>
              </th>
              <th
                onClick={() => handleHeaderClick("area")}
                className="py-3.5 px-3 cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Floor Size</span>
                  {sortCol === "area" && <span>{sortDir === "asc" ? "▲" : "▼"}</span>}
                </div>
              </th>
              <th
                onClick={() => handleHeaderClick("pricePerM2")}
                className="py-3.5 px-3 cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Rate / m²</span>
                  {sortCol === "pricePerM2" && <span>{sortDir === "asc" ? "▲" : "▼"}</span>}
                </div>
              </th>
              <th className="py-3.5 px-3">Resilience</th>
              <th className="py-3.5 pr-5 pl-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium text-slate-800 dark:text-slate-200">
            {sortedProperties.map((prop) => {
              const hasSolar = prop.features?.some(
                (f) => f.includes("solar") || f.includes("inverter") || f.includes("backup")
              );
              const hasBorehole = prop.features?.some(
                (f) => f.includes("water") || f.includes("borehole")
              );

              return (
                <tr
                  key={prop.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-[#0c1a1c]/60 transition-colors group"
                >
                  {/* Property Info + Thumbnail */}
                  <td className="py-3.5 pl-5 pr-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-12 w-16 shrink-0 rounded-xl bg-slate-200 dark:bg-[#060d0e] bg-cover bg-center border border-slate-200 dark:border-white/10 shadow-2xs group-hover:scale-105 transition-transform"
                        style={{ backgroundImage: `url(${prop.image})` }}
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/property/${prop.slug || prop.id}`}
                          className="font-bold text-slate-900 dark:text-white hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors line-clamp-1 block text-sm"
                        >
                          {prop.title}
                        </Link>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`rounded-md px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                              prop.listingType === "rent"
                                ? "bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20"
                                : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20"
                            }`}
                          >
                            {prop.listingType === "rent" ? "To Rent" : "For Sale"}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                            {prop.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <LocationPinIcon className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                      <span>{prop.suburb || prop.location.split(",")[0]}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 pl-4">
                      {prop.city || prop.location.split(",")[1] || prop.province}
                    </p>
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <p className="font-extrabold text-slate-950 dark:text-white text-sm">{prop.price}</p>
                    {prop.listingType === "rent" && (
                      <p className="text-[10px] text-amber-800 dark:text-amber-300 font-medium">
                        {prop.leaseTerm || "12M"} {prop.furnishedStatus ? `· ${prop.furnishedStatus}` : ""}
                      </p>
                    )}
                  </td>

                  {/* Beds/Baths */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1" title={`${prop.beds} Bedrooms`}>
                        <BedIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{prop.beds}</span>
                      </span>
                      <span className="flex items-center gap-1" title={`${prop.baths} Bathrooms`}>
                        <BathIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{prop.baths}</span>
                      </span>
                      <span className="flex items-center gap-1" title={`${prop.parking} Garages`}>
                        <CarIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{prop.parking}</span>
                      </span>
                    </div>
                  </td>

                  {/* Floor Area */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-semibold text-slate-700 dark:text-slate-300">
                    {prop.area}
                  </td>

                  {/* Rate per m² */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {prop.pricePerM2 > 0 ? (
                      <span className="rounded-md bg-slate-100 dark:bg-[#060d0e]/80 dark:border dark:border-white/10 px-2 py-1 text-slate-700 dark:text-slate-300 font-semibold font-mono text-[11px]">
                        R {prop.pricePerM2.toLocaleString()}/m²
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>

                  {/* Resilience / Sustainability Badges */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {hasSolar && (
                        <span
                          className="rounded-md bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20"
                          title="Solar Inverter & Battery"
                        >
                          ⚡ Solar
                        </span>
                      )}
                      {hasBorehole && (
                        <span
                          className="rounded-md bg-sky-50 dark:bg-sky-950/40 px-1.5 py-0.5 text-[10px] font-bold text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-500/20"
                          title="Borehole / Backup Water"
                        >
                          💧 Water
                        </span>
                      )}
                      {!hasSolar && !hasBorehole && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">Standard Grid</span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 pr-5 pl-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <SavePropertyButton propertyId={prop.id} />
                      <Link
                        href={`/property/${prop.slug || prop.id}`}
                        className="rounded-xl bg-slate-950 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)] px-3 py-1.5 text-xs font-bold text-white shadow-sm border border-transparent dark:border-emerald-500/40 transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>View</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
