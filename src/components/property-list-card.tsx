"use client";

import Link from "next/link";
import PropertyCardPhotos from "@/components/property-card-photos";
import SavePropertyButton from "@/components/save-property-button";
import {
  AreaIcon,
  BathIcon,
  BedIcon,
  CarIcon,
  LocationPinIcon,
  SparklesIcon,
} from "@/components/icons";
import { getDisplayTag, type PropertyRecord } from "@/lib/property-data";

export interface PropertyListCardProps {
  property: PropertyRecord;
  isHighlighted?: boolean;
  onHover?: (propertyId: string | null) => void;
}

export default function PropertyListCard({
  property,
  isHighlighted = false,
  onHover,
}: PropertyListCardProps) {
  // Calculate price per m² if area is available
  const areaNumber = parseInt(property.area.replace(/\D/g, ""), 10);
  const rawPriceNumber = parseInt(property.price.replace(/\D/g, ""), 10);
  const pricePerM2 =
    !isNaN(areaNumber) && areaNumber > 0 && !isNaN(rawPriceNumber) && rawPriceNumber > 0
      ? Math.round(rawPriceNumber / areaNumber)
      : null;

  return (
    <article
      onMouseEnter={() => onHover?.(property.id)}
      onMouseLeave={() => onHover?.(null)}
      className={`group flex flex-col md:flex-row overflow-hidden rounded-[28px] border bg-white/70 dark:bg-[#0c1a1c]/75 shadow-[0_12px_32px_rgba(36,48,50,0.07)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${
        isHighlighted
          ? "border-emerald-500 ring-2 ring-emerald-500/30 bg-white dark:bg-[#0f2225]"
          : "border-white/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-emerald-500/30"
      }`}
    >
      {/* Photo Column */}
      <div className="relative h-60 md:h-auto md:w-5/12 lg:w-4/12 shrink-0 overflow-hidden bg-slate-200 dark:bg-[#060d0e]">
        <PropertyCardPhotos
          images={property.gallery?.length ? property.gallery : [property.image]}
          title={property.title}
          frameClassName="transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent md:bg-gradient-to-r md:from-black/40 md:via-transparent md:to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap z-10">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
              property.listingType === "rent"
                ? "border-amber-300/60 bg-amber-950/80 text-amber-200"
                : "border-emerald-300/60 bg-emerald-950/80 text-emerald-200"
            }`}
          >
            {property.listingType === "rent" ? "To Rent" : "For Sale"}
          </span>
          {getDisplayTag(property) && (
            <span className="rounded-full border border-white/30 bg-black/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md dark:border-white/10">
              {getDisplayTag(property)}
            </span>
          )}
        </div>

        {/* Save Button */}
        <div className="absolute top-3 right-3 z-10">
          <SavePropertyButton propertyId={property.id} />
        </div>

        {/* Mobile Price Overlay */}
        <div className="absolute bottom-3 left-3 text-white md:hidden z-10">
          <p className="text-xl font-extrabold">{property.price}</p>
          {property.listingType === "rent" && property.leaseTerm && (
            <p className="text-[10px] text-amber-200 font-medium">
              {property.leaseTerm} Lease {property.furnishedStatus ? `· ${property.furnishedStatus}` : ""}
            </p>
          )}
        </div>

        {/* 3D Virtual Tour Badge if present */}
        {property.features?.includes("3d_tour") && (
          <div className="absolute bottom-3 right-3 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/85 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 backdrop-blur-md border border-emerald-500/30">
              <SparklesIcon className="h-3 w-3 text-emerald-400" />
              <span>3D Tour</span>
            </span>
          </div>
        )}
      </div>

      {/* Details & Specs Column */}
      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
        <div>
          {/* Header Row: Suburb & Category Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <LocationPinIcon className="h-3.5 w-3.5 text-slate-400 shrink-0 dark:text-slate-400" />
              <span>{property.location}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-slate-100 dark:bg-[#060d0e]/80 dark:border dark:border-white/10 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-200">
                {property.type}
              </span>
              {property.status === "verified" && (
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  ✓ Verified
                </span>
              )}
            </div>
          </div>

          {/* Title & Price Row (Desktop) */}
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors">
              <Link href={`/property/${property.slug || property.id}`}>
                {property.title}
              </Link>
            </h2>
            <div className="hidden md:block text-right">
              <p className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                {property.price}
              </p>
              {property.listingType === "rent" && property.leaseTerm && (
                <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                  {property.leaseTerm} Lease {property.furnishedStatus ? `· ${property.furnishedStatus}` : ""}
                </p>
              )}
            </div>
          </div>

          {/* Key Metrics Bar */}
          <div className="mt-3.5 flex flex-wrap items-center gap-4 sm:gap-6 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-[#060d0e]/60 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <BedIcon className="h-4 w-4 text-slate-400 dark:text-slate-400" />
              <span>{property.beds} {property.beds === 1 ? "Bed" : "Beds"}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <BathIcon className="h-4 w-4 text-slate-400 dark:text-slate-400" />
              <span>{property.baths} {property.baths === 1 ? "Bath" : "Baths"}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CarIcon className="h-4 w-4 text-slate-400 dark:text-slate-400" />
              <span>{property.parking} {property.parking === 1 ? "Garage" : "Garages"}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <AreaIcon className="h-4 w-4 text-slate-400 dark:text-slate-400" />
              <span>{property.area}</span>
            </span>
            {pricePerM2 && (
              <span className="hidden lg:inline text-slate-400 font-normal dark:text-slate-400">
                (approx. R {pricePerM2.toLocaleString()}/m²)
              </span>
            )}
          </div>

          {/* Description Preview */}
          <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
            {property.description}
          </p>

          {/* Feature Chips */}
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
            {property.features?.map((f) => (
              <span
                key={f}
                className="rounded-md bg-emerald-50/80 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-500/30"
              >
                {f.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="mt-5 pt-3.5 border-t border-slate-200/70 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/compare"
              className="tap-44 relative text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors"
            >
              Add to Compare →
            </Link>
            {property.developmentInfo?.developerName && (
              <span className="text-[11px] text-slate-400 border-l border-slate-200 dark:border-white/10 pl-3 dark:text-slate-400">
                Developer: <strong className="text-slate-700 dark:text-slate-200">{property.developmentInfo.developerName}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/property/${property.slug || property.id}`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 hover:from-[#0d595b] hover:to-[#094344] dark:hover:from-emerald-500 dark:hover:to-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-950/20 dark:shadow-[0_0_20px_rgba(16,185,129,0.35)] border border-emerald-400/30 dark:border-emerald-400/50 hover:scale-102 transition-all cursor-pointer sm:min-h-0 sm:inline-block"
            >
              {property.listingType === "rent" ? "View Rental Experience →" : "View Property Experience →"}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
