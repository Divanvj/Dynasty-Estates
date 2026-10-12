"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import SavePropertyButton from "@/components/save-property-button";
import DynastyPropertyMap from "@/components/dynasty-property-map";
import {
  AreaIcon,
  BathIcon,
  BedIcon,
  CarIcon,
  LocationPinIcon,
} from "@/components/icons";
import type { PropertyRecord } from "@/lib/property-data";

export interface PropertySplitMapViewProps {
  properties: PropertyRecord[];
}

type MapDisplayMode = "map" | "street";

export default function PropertySplitMapView({ properties }: PropertySplitMapViewProps) {
  const [activePropertyId, setActivePropertyId] = useState<string>(properties[0]?.id ?? "");
  // Drives the two-way highlight between the listing feed and the map pins.
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | undefined>(undefined);
  const [displayMode, setDisplayMode] = useState<MapDisplayMode>("map");
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const activeProperty = useMemo(() => {
    return properties.find((p) => p.id === activePropertyId) ?? properties[0];
  }, [properties, activePropertyId]);

  // When clicking a property in the feed, select it and activate Street View
  function handleSelectProperty(propertyId: string, openStreetView = false) {
    setActivePropertyId(propertyId);
    if (openStreetView) {
      setDisplayMode("street");
    }
  }

  // Google Street View Embed URL
  const streetViewEmbedUrl = useMemo(() => {
    if (!activeProperty) return "";
    const loc = `${activeProperty.location}, South Africa`;
    return `https://maps.google.com/maps?q=${encodeURIComponent(loc)}&layer=c&cbll=&output=svembed`;
  }, [activeProperty]);

  // Direct external Google Maps / Street View URL
  const externalGoogleMapsUrl = useMemo(() => {
    if (!activeProperty) return "https://maps.google.com";
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${activeProperty.title} ${activeProperty.location} South Africa`
    )}`;
  }, [activeProperty]);

  return (
    <div className="grid gap-6 lg:grid-cols-12 items-start">
      {/* Left Column: Scrollable Property Listings Feed */}
      {/* Below `lg` this single-column grid put the feed first, burying the map
          under every listing — on a page called "Map & Street View". The map is
          ordered first on phones and returns to the right-hand column at `lg`. */}
      <div className="order-2 lg:order-none lg:col-span-7 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>Showing {properties.length} mapped residences</span>
          <span className="text-emerald-800 dark:text-emerald-400">
            💡 Click any property or &ldquo;Street View&rdquo; to inspect
          </span>
        </div>

        {properties.map((property) => {
          const isSelected = property.id === activePropertyId;

          return (
            <div
              key={property.id}
              ref={(el) => {
                cardRefs.current[property.id] = el;
              }}
              onClick={() => handleSelectProperty(property.id, true)}
              onMouseEnter={() => setHoveredPropertyId(property.id)}
              onMouseLeave={() => setHoveredPropertyId(undefined)}
              className={`group overflow-hidden rounded-[28px] border bg-white/75 dark:bg-[#0c1a1c]/80 shadow-[0_10px_28px_rgba(36,48,50,0.06)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-300 cursor-pointer ${
                isSelected
                  ? "border-emerald-500 ring-2 ring-emerald-500/40 bg-white dark:bg-[#0c1a1c] dark:shadow-[0_0_30px_rgba(16,185,129,0.25)] shadow-xl"
                  : hoveredPropertyId === property.id
                    ? "border-emerald-400 dark:border-emerald-400/60 shadow-lg dark:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    : "border-white/80 dark:border-white/10 hover:border-emerald-400 dark:hover:border-emerald-400/50 hover:shadow-lg"
              }`}
            >
              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                <div className="relative h-52 sm:h-auto sm:w-5/12 shrink-0 bg-slate-200 dark:bg-[#060d0e] overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${property.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur-md bg-emerald-950/90 text-emerald-200 border border-emerald-500/50 dark:bg-emerald-600/90 dark:text-white dark:border-emerald-400/50 dark:shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                    >
                      {property.listingType === "rent" ? "To Rent" : "For Sale"}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5 z-10" onClick={(e) => e.stopPropagation()}>
                    <SavePropertyButton propertyId={property.id} />
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 text-white z-10">
                    <p className="text-xl font-extrabold">{property.price}</p>
                    {property.listingType === "rent" && property.leaseTerm && (
                      <p className="text-[10px] text-emerald-200 font-medium">
                        {property.leaseTerm} Lease
                      </p>
                    )}
                  </div>
                </div>

                {/* Property Details */}
                <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                        <LocationPinIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{property.suburb || property.location.split(",")[0]}</span>
                      </span>
                      <span className="rounded-full bg-slate-100 dark:bg-[#060d0e]/80 dark:border dark:border-white/10 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {property.type}
                      </span>
                    </div>

                    <h3 className="mt-1.5 text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {property.title}
                    </h3>

                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {property.description}
                    </p>

                    <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        <BedIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{property.beds}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <BathIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{property.baths}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <CarIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{property.parking}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <AreaIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{property.area}</span>
                      </span>
                    </div>
                  </div>

                  {/* Action Row */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectProperty(property.id, true)}
                        className="rounded-full bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 border border-emerald-500/50 px-3 py-1 text-[11px] font-bold text-white shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.35)] hover:from-[#093e3f] hover:to-[#052c2d] dark:hover:from-emerald-500 dark:hover:to-emerald-600 transition-all cursor-pointer inline-flex items-center gap-1"
                        title="View Street View for this property"
                      >
                        <span>👁️ Street View</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectProperty(property.id, false);
                          setDisplayMode("map");
                        }}
                        className="rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#060d0e]/60 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#0c1a1c] dark:hover:text-white transition-all cursor-pointer"
                      >
                        🗺️ Locate
                      </button>
                    </div>

                    <Link
                      href={`/property/${property.slug || property.id}`}
                      className="rounded-full bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 hover:from-[#093e3f] hover:to-[#052c2d] dark:hover:from-emerald-500 dark:hover:to-emerald-600 px-3.5 py-1 text-[11px] font-bold text-white shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.35)] border border-emerald-500/30 transition-all"
                    >
                      Details →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right Column: Sticky Google Maps & Street View Console */}
      <div className="order-1 lg:order-none lg:col-span-5 lg:sticky lg:top-6">
        <div className="overflow-hidden rounded-[30px] border border-white/80 dark:border-white/10 bg-white/80 dark:bg-[#0c1a1c]/90 shadow-[0_16px_36px_rgba(36,48,50,0.08)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          {/* Map Header & View Switcher */}
          <div className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/90 dark:bg-[#081315]/90 p-3">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {displayMode === "street" ? "Street View 360°" : "Dynasty Live Map"}
                </span>
              </div>

              {/* Mode Toggle: Map vs Street View */}
              <div className="inline-flex shrink-0 rounded-full border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-black/40 p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setDisplayMode("map")}
                  className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                    displayMode === "map"
                      ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white dark:border-emerald-500/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)] shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
                  }`}
                >
                  🗺️ Map
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode("street")}
                  className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                    displayMode === "street"
                      ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white dark:border-emerald-500/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)] shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
                  }`}
                >
                  👁️ Street View
                </button>
              </div>
            </div>

            {/* Sub-controls depending on active mode. The map owns its own
                metro jump and resilience layer, so nothing is needed here. */}
            {displayMode === "map" ? null : (
              /* Street View Top Bar with Back Button */
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDisplayMode("map")}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 text-white dark:bg-emerald-600 dark:text-white dark:border-emerald-500/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)] px-3.5 py-1 text-xs font-bold shadow-md hover:opacity-90 transition-all cursor-pointer"
                >
                  <span>←</span>
                  <span>Back to Map Overview</span>
                </button>

                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                  {activeProperty ? activeProperty.location : "South Africa"}
                </span>
              </div>
            )}
          </div>

          {/* Map / Street View Display Container */}
          <div className="relative h-[420px] sm:h-[500px] lg:h-[620px] w-full bg-slate-100 dark:bg-slate-950">
            {displayMode === "map" ? (
              /* Interactive map with a pin per listing. The previous Google
                 iframe could only show a generic search result — an iframe
                 cannot render our own markers, so none of the listings
                 actually appeared on it. */
              <DynastyPropertyMap
                properties={properties}
                activeId={activePropertyId}
                hoveredId={hoveredPropertyId}
                onSelect={setActivePropertyId}
                onHover={setHoveredPropertyId}
                className="h-full w-full"
              />
            ) : (
              /* Real Google Street View Embed */
              <div className="relative h-full w-full">
                <iframe
                  title="Google Street View Property Inspection"
                  src={streetViewEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full bg-slate-900"
                />

                {/* Floating "Back to Map" overlay chip at bottom-left */}
                <div className="absolute bottom-4 left-4 z-20">
                  <button
                    type="button"
                    onClick={() => setDisplayMode("map")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/95 text-white dark:bg-emerald-600/95 dark:text-white border border-white/10 dark:border-emerald-500/60 dark:shadow-[0_0_20px_rgba(16,185,129,0.4)] px-4 py-2 text-xs font-bold shadow-2xl backdrop-blur-xl hover:opacity-90 transition-all cursor-pointer"
                  >
                    <span>←</span>
                    <span>Exit Street View & Return to Map</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom floating property card info badge */}
            {activeProperty && displayMode === "map" && (
              <div className="absolute bottom-3 left-3 right-3 z-10 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {/* Stacks on phones: side by side, the action buttons squeezed
                    the title and price down to a few characters. */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 rounded-2xl border border-white/90 dark:border-white/10 bg-white/95 dark:bg-[#0c1a1c]/95 p-3 shadow-xl dark:shadow-[0_20px_45px_rgba(0,0,0,0.6)] backdrop-blur-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-12 w-14 shrink-0 rounded-xl bg-slate-200 bg-cover bg-center border border-slate-200 dark:border-white/10 dark:bg-[#060d0e]"
                      style={{ backgroundImage: `url(${activeProperty.image})` }}
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 truncate">
                        {activeProperty.location}
                      </p>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {activeProperty.title}
                      </h4>
                      <p className="text-xs font-extrabold text-slate-950 dark:text-emerald-300 whitespace-nowrap">
                        {activeProperty.price}
                      </p>
                    </div>
                  </div>

                  <div className="flex w-full sm:w-auto items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDisplayMode("street")}
                      className="flex-1 sm:flex-none whitespace-nowrap rounded-full bg-slate-900 text-white dark:bg-emerald-600 dark:text-white dark:border-emerald-500/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)] px-3 py-2 sm:py-1.5 text-xs font-bold shadow-xs hover:opacity-90 transition-all cursor-pointer"
                      title="Inspect Street View"
                    >
                      👁️ Street View
                    </button>
                    <a
                      href={externalGoogleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#060d0e]/60 px-2.5 py-2 sm:py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#0c1a1c] dark:hover:text-white transition-all"
                      title="Open in Google Maps tab"
                    >
                      ↗
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
