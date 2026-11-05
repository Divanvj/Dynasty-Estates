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
import { featureLabel } from "@/lib/feature-labels";
import { formatNumber } from "@/lib/formatters";
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
      // `relative` anchors the .card-link overlay on the title below, which is
      // what makes the whole card open the listing. See globals.css.
      className={`group relative flex flex-col md:flex-row overflow-hidden rounded-card border bg-white/70 dark:bg-surface-panel/75 shadow-[0_12px_32px_rgba(36,48,50,0.07)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${
        isHighlighted
          ? "border-emerald-500 ring-2 ring-emerald-500/30 bg-white dark:bg-[#0f2225]"
          : "border-white/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-emerald-500/30"
      }`}
    >
      {/*
        Photo Column.

        Mobile sizing throughout this card is tuned so two cards fit a phone
        screen. It measured 813px against an 812px viewport, so a visitor saw
        exactly one property at a time and could not compare anything without
        scrolling. Nothing is deleted — the detail page carries everything the
        feed card drops below `md`.
      */}
      <div className="relative h-52 md:h-auto md:w-5/12 lg:w-4/12 shrink-0 overflow-hidden bg-slate-200 dark:bg-surface-ink">
        <PropertyCardPhotos
          images={property.gallery?.length ? property.gallery : [property.image]}
          title={property.title}
          frameClassName="transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent md:bg-gradient-to-r md:from-black/40 md:via-transparent md:to-transparent" />

        {/* Top Badges.

            No For Sale / To Rent chip here. Every surface that renders this
            card — /search, the home feed, the split map — makes the visitor
            choose buy or rent first, so the chip repeated their own choice on
            every card in the list. The listing tag, which does say something
            the card does not ("New Listing", "Price Reduced"), stays. */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap z-10">
          {getDisplayTag(property) && (
            <span className="badge border border-white/30 bg-black/50 text-white backdrop-blur-md dark:border-white/10">
              {getDisplayTag(property)}
            </span>
          )}
        </div>

        {/* Save Button. z-30, not z-10: saving is a different action from
            opening the listing, so it has to sit above the card overlay. The
            badges and price overlay around it stay at z-10 on purpose — they
            are decoration, and a click on them should open the listing. */}
        <div className="absolute top-3 right-3 z-30">
          <SavePropertyButton propertyId={property.id} />
        </div>

        {/* Mobile Price Overlay */}
        <div className="absolute bottom-3 left-3 text-white md:hidden z-10">
          <p className="text-xl font-extrabold">{property.price}</p>
          {property.listingType === "rent" && property.leaseTerm && (
            <p className="text-xs text-amber-200 font-medium">
              {property.leaseTerm} Lease {property.furnishedStatus ? `· ${property.furnishedStatus}` : ""}
            </p>
          )}
        </div>

        {/* 3D Virtual Tour Badge if present */}
        {property.features?.includes("3d_tour") && (
          <div className="absolute bottom-3 right-3 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/85 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 backdrop-blur-md border border-emerald-500/30">
              <SparklesIcon className="h-3 w-3 text-emerald-400" />
              <span>3D Tour</span>
            </span>
          </div>
        )}
      </div>

      {/* Details & Specs Column */}
      <div className="flex flex-1 flex-col justify-between p-4 md:p-6">
        <div>
          {/* Header Row: Suburb & Category Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <LocationPinIcon className="h-3.5 w-3.5 text-slate-400 shrink-0 dark:text-slate-400" />
              <span>{property.location}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <span className="badge border border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-surface-ink/80 dark:text-slate-200">
                {property.type}
              </span>
              {property.status === "verified" && (
                <span className="badge border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300">
                  ✓ Verified
                </span>
              )}
            </div>
          </div>

          {/* Title & Price Row (Desktop) */}
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors">
              {/* The card's one real link. `card-link` stretches it over the
                  whole card, so the title is both the visible heading and the
                  name a screen reader gives the card. */}
              <Link className="card-link" href={`/property/${property.slug || property.id}`}>
                {property.title}
              </Link>
            </h2>
            <div className="hidden md:block text-right">
              <p className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                {property.price}
              </p>
              {property.listingType === "rent" && property.leaseTerm && (
                <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                  {property.leaseTerm} Lease {property.furnishedStatus ? `· ${property.furnishedStatus}` : ""}
                </p>
              )}
            </div>
          </div>

          {/* Key Metrics Bar */}
          {/* The framing — border, fill, padding — is desktop only. On a phone
              those four specs wrapped to two rows inside a bordered box, which
              cost about 80px to say "3 beds, 2 baths". */}
          <div className="mt-2.5 md:mt-3.5 flex flex-wrap items-center gap-3 md:gap-6 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-surface-ink/60 px-4 py-2 max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:px-0 max-md:py-0 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <BedIcon className="h-4 w-4 text-slate-400 dark:text-slate-400" />
              <span>{property.beds} {property.beds === 1 ? "Bed" : "Beds"}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <BathIcon className="h-4 w-4 text-slate-400 dark:text-slate-400" />
              <span>{property.baths} {property.baths === 1 ? "Bath" : "Baths"}</span>
            </span>
            {/* Beds, baths and size are what people scan a feed for; parking is
                a detail-page fact. Dropping it keeps the specs on one row. */}
            <span className="hidden md:flex items-center gap-1.5">
              <CarIcon className="h-4 w-4 text-slate-400 dark:text-slate-400" />
              <span>{property.parking} {property.parking === 1 ? "Garage" : "Garages"}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <AreaIcon className="h-4 w-4 text-slate-400 dark:text-slate-400" />
              <span>{property.area}</span>
            </span>
            {pricePerM2 && (
              <span className="hidden lg:inline text-slate-400 font-normal dark:text-slate-400">
                (approx. R {formatNumber(pricePerM2)}/m²)
              </span>
            )}
          </div>

          {/* Description Preview */}
          {/* Desktop only. Two clamped lines of prose is roughly 40px that no
              portal shows in a phone feed — the photograph, price and specs are
              what a listing is scanned on. It is in full on the detail page. */}
          <p className="mt-3 hidden md:block text-sm leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
            {property.description}
          </p>

          {/* Feature Chips */}
          {/* Desktop only — an unbounded wrapping list, so a well-appointed
              listing could add several rows of chips to every card in the feed. */}
          <div className="mt-3.5 hidden md:flex flex-wrap items-center gap-1.5">
            {property.features?.map((f) => (
              <span
                key={f}
                className="rounded-md bg-emerald-50/80 dark:bg-emerald-950/40 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-500/30"
              >
                {featureLabel(f)}
              </span>
            ))}
          </div>
        </div>

        {/*
          Footer Action Bar — desktop only.

          Its "View Property Experience" button is already `aria-hidden` and not
          a link, because the whole card opens the listing. On a phone that made
          it roughly 80px of card restating what tapping anywhere already does.
          Compare moves to the detail page on mobile rather than riding in the
          feed; flagged, because it is the one action that leaves the phone.
        */}
        <div className="mt-5 pt-3.5 hidden md:flex border-t border-slate-200/70 dark:border-white/10 flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* z-30 for the same reason as Save: comparing is not opening. */}
            <Link
              href="/compare"
              className="tap-44 relative z-30 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors"
            >
              Add to Compare →
            </Link>
            {property.developmentInfo?.developerName && (
              <span className="text-xs text-slate-400 border-l border-slate-200 dark:border-white/10 pl-3 dark:text-slate-400">
                Developer: <strong className="text-slate-700 dark:text-slate-200">{property.developmentInfo.developerName}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/*
              A span, not a link. It pointed at the same listing as the title
              above, so as a link it was a second tab stop and a second
              announcement for one destination — the redundant-link problem.
              The card overlay sits above it, so clicking it still opens the
              listing; it is now purely the visible affordance that says so.

              Its hover states moved from `hover:` to `group-hover:` for the
              same reason: the button should light up when the pointer is
              anywhere on the card, because anywhere on the card is the target.
            */}
            <span
              aria-hidden="true"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 group-hover:from-[#0d595b] group-hover:to-[#094344] dark:group-hover:from-emerald-500 dark:group-hover:to-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-950/20 dark:shadow-[0_0_20px_rgba(16,185,129,0.35)] border border-emerald-400/30 dark:border-emerald-400/50 group-hover:scale-102 transition-all sm:min-h-0 sm:inline-block"
            >
              {property.listingType === "rent" ? "View Rental Experience →" : "View Property Experience →"}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
