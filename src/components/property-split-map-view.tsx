"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
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

  /**
   * Which of the two panes a phone is looking at. Ignored from `lg` up, where
   * both columns are on screen at once.
   *
   * Stacked, this page measured 13.3 screens on a 375px phone: a 420px map and
   * then twelve screens of listings under it, which is not a map search — it is
   * a list with a picture on top. Property24 and Private Property both answer
   * this the same way, with a Map/List switch, and so does this.
   */
  // List first, not map. Nielsen Norman's guidance on mobile maps is to offer
  // the toggle but default to the list, because a list shows more options at
  // once and is faster to choose from — and because a map that opens under
  // your thumb swallows the first scroll you try to make.
  const [mobilePane, setMobilePane] = useState<"map" | "list">("list");

  // Leaflet sizes itself from its container at creation and then only on a
  // window resize. Revealing a pane that was `display: none` changes the
  // container without firing one, so the map would paint into the old box —
  // grey tiles and pins in the wrong place. The map keeps Leaflet's default
  // `trackResize`, so telling the window it resized is enough, and it is far
  // cheaper than unmounting the map and losing the viewer's zoom and pan.
  const showMobilePane = useCallback((pane: "map" | "list") => {
    setMobilePane(pane);
    if (pane === "map" && typeof window !== "undefined") {
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    }
  }, []);

  /**
   * The listings inside the area drawn on the map, or null when none is drawn.
   *
   * The map has always worked this out — it filters its own pins and shows an
   * "N in your area" badge — but nothing ever asked it for the set, so drawing
   * an area changed the map while the feed beside it carried on showing
   * everything. This is the connection that was missing.
   */
  const [areaIds, setAreaIds] = useState<string[] | null>(null);

  // Stable identity matters: the map lists this callback in the dependencies of
  // the effect that emits, so an inline arrow would re-arm it on every render.
  const handleAreaFilterChange = useCallback((ids: string[] | null) => {
    setAreaIds(ids);
  }, []);

  const visibleProperties = useMemo(() => {
    if (!areaIds) return properties;
    const inArea = new Set(areaIds);
    return properties.filter((p) => inArea.has(p.id));
  }, [properties, areaIds]);

  const activeProperty = useMemo(() => {
    // Honour the selection only while it is still inside the drawn area, or
    // Street View carries on inspecting a property the feed has just filtered
    // out. Falling back to the first visible one keeps the two panels agreeing.
    const selected = visibleProperties.find((p) => p.id === activePropertyId);
    if (selected) return selected;
    return (
      visibleProperties[0] ??
      properties.find((p) => p.id === activePropertyId) ??
      properties[0]
    );
  }, [properties, visibleProperties, activePropertyId]);

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

  // `grid-cols-1` is load-bearing below lg. With no base column the grid uses
  // one implicit `auto` track sized to max-content, so the pane switch's
  // `w-full` resolved against a track wider than the screen and scrolled the
  // page sideways at 320px.
  //
  // This comment sits outside the `return (` on purpose: a braced JSX comment
  // placed before the root element parses as an object literal and breaks the
  // element after it.
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
      {/* Phone-only pane switch. Hidden from `lg`, where both columns fit. */}
      <div className="order-1 lg:hidden">
        <div
          role="group"
          aria-label="Choose map or list"
          className="inline-flex w-full items-center rounded-2xl border border-slate-200/90 bg-white/80 p-1 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-surface-ink/60"
        >
          {(["map", "list"] as const).map((pane) => (
            <button
              key={pane}
              type="button"
              onClick={() => showMobilePane(pane)}
              aria-pressed={mobilePane === pane}
              className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mobilePane === pane
                  ? "bg-[#0b4d4e] text-white border border-emerald-400/50 shadow-xs dark:bg-emerald-600 dark:border-emerald-400/60 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-emerald-950 dark:text-slate-300 dark:hover:bg-surface-panel dark:hover:text-white"
              }`}
            >
              {pane === "map" ? "🗺️ Map" : `☰ List (${visibleProperties.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Left Column: Scrollable Property Listings Feed */}
      {/* Below `lg` this single-column grid put the feed first, burying the map
          under every listing — on a page called "Map & Street View". The map is
          ordered first on phones and returns to the right-hand column at `lg`. */}
      <div
        className={`order-3 lg:order-none lg:col-span-7 space-y-4 ${
          mobilePane === "list" ? "" : "max-lg:hidden"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>
            {areaIds
              ? `Showing ${visibleProperties.length} of ${properties.length} in your area`
              : `Showing ${properties.length} mapped residences`}
          </span>
          <span className="text-emerald-800 dark:text-emerald-400">
            💡 Click any property or &ldquo;Street View&rdquo; to inspect
          </span>
        </div>

        {visibleProperties.map((property) => {
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
              className={`group overflow-hidden rounded-card border bg-white/75 dark:bg-surface-panel/80 shadow-[0_10px_28px_rgba(36,48,50,0.06)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-300 cursor-pointer ${
                isSelected
                  ? "border-emerald-500 ring-2 ring-emerald-500/40 bg-white dark:bg-surface-panel dark:shadow-[0_0_30px_rgba(16,185,129,0.25)] shadow-xl"
                  : hoveredPropertyId === property.id
                    ? "border-emerald-400 dark:border-emerald-400/60 shadow-lg dark:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    : "border-white/80 dark:border-white/10 hover:border-emerald-400 dark:hover:border-emerald-400/50 hover:shadow-lg"
              }`}
            >
              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                <div className="relative h-52 sm:h-auto sm:w-5/12 shrink-0 bg-slate-200 dark:bg-surface-ink overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${property.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* The For Sale / To Rent chip that sat here is gone: this
                      feed is only reached from /search and /map-search, which
                      both make the visitor choose buy or rent first. */}
                  <div className="absolute top-2.5 right-2.5 z-10" onClick={(e) => e.stopPropagation()}>
                    <SavePropertyButton propertyId={property.id} />
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 text-white z-10">
                    <p className="text-xl font-extrabold">{property.price}</p>
                    {property.listingType === "rent" && property.leaseTerm && (
                      <p className="text-xs text-emerald-200 font-medium">
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
                      <span className="badge border border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-surface-ink/80 dark:text-slate-200">
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

                  {/* Action Row.

                      `gap-y-3.5` rather than `gap-2`, and the reason is the
                      `tap-44` on the three pills below. This row wraps on a
                      phone, so "Details" drops under "Street View"; at an 8px
                      row gap two 32px pills sit 40px centre to centre, and
                      expanding both hit areas to 44 made them overlap by 4px
                      — the lower one would have taken taps aimed at the upper.
                      14px puts the centres 46px apart, so the areas clear each
                      other. Measured, not guessed. */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-x-2 gap-y-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectProperty(property.id, true)}
                        className="tap-44 relative pill-sm bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 border border-emerald-500/50 font-bold text-white shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.35)] hover:from-[#093e3f] hover:to-[#052c2d] dark:hover:from-emerald-500 dark:hover:to-emerald-600 transition-all cursor-pointer gap-1"
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
                        className="tap-44 relative pill-sm border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-ink/60 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-surface-panel dark:hover:text-white transition-all cursor-pointer"
                      >
                        🗺️ Locate
                      </button>
                    </div>

                    <Link
                      href={`/property/${property.slug || property.id}`}
                      className="tap-44 relative pill-sm bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 hover:from-[#093e3f] hover:to-[#052c2d] dark:hover:from-emerald-500 dark:hover:to-emerald-600 font-bold text-white shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.35)] border border-emerald-500/30 transition-all"
                    >
                      Details →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* An area can legitimately contain nothing. Without this the feed just
            emptied, which reads as a broken page rather than a narrow search. */}
        {areaIds && visibleProperties.length === 0 && (
          <div className="rounded-card border border-white/80 bg-white/75 p-8 text-center shadow-[0_10px_28px_rgba(36,48,50,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-surface-panel/80 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              No listings in this area
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Draw a wider area, or clear it on the map to see all {properties.length} again.
            </p>
          </div>
        )}
      </div>

      {/* Right Column: Sticky Google Maps & Street View Console */}
      <div
        className={`order-2 lg:order-none lg:col-span-5 lg:sticky lg:top-6 ${
          mobilePane === "map" ? "" : "max-lg:hidden"
        }`}
      >
        <div className="overflow-hidden rounded-panel border border-white/80 dark:border-white/10 bg-white/80 dark:bg-surface-panel/90 shadow-[0_16px_36px_rgba(36,48,50,0.08)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.5)] backdrop-blur-xl">
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
                  className={`pill-sm font-bold transition-all cursor-pointer ${ displayMode === "map" ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white dark:border-emerald-500/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)] shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white" }`}
                >
                  🗺️ Map
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode("street")}
                  className={`pill-sm font-bold transition-all cursor-pointer ${ displayMode === "street" ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white dark:border-emerald-500/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)] shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white" }`}
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
                  className="pill-sm gap-1.5 bg-slate-900 text-white dark:bg-emerald-600 dark:text-white dark:border-emerald-500/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)] font-bold shadow-md hover:opacity-90 transition-all cursor-pointer"
                >
                  <span>←</span>
                  <span>Back to Map Overview</span>
                </button>

                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                  {activeProperty ? activeProperty.location : "South Africa"}
                </span>
              </div>
            )}
          </div>

          {/* Map / Street View Display Container */}
          {/* `70dvh` on a phone rather than a fixed 420px. A 420px map inside
              a scrolling page is the shape the "map trap" is named after:
              Leaflet sets `touch-action: none` on its container, so every
              vertical swipe inside it pans the map instead of scrolling the
              page, and with 420px of map and a page either side there was
              nowhere safe to put a thumb. At 70dvh the map is most of the
              screen, so there is very little page left to scroll past, and the
              pins get room they never had. `dvh`, not `vh`, or the bottom of
              the map hides behind the browser's address bar. */}
          <div className="relative h-[70dvh] sm:h-[500px] lg:h-[620px] w-full bg-slate-100 dark:bg-slate-950">
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
                onAreaFilterChange={handleAreaFilterChange}
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
                    className="pill gap-1.5 bg-slate-900/95 text-white dark:bg-emerald-600/95 dark:text-white border border-white/10 dark:border-emerald-500/60 dark:shadow-[0_0_20px_rgba(16,185,129,0.4)] font-bold shadow-2xl backdrop-blur-xl hover:opacity-90 transition-all cursor-pointer"
                  >
                    <span>←</span>
                    <span>Exit Street View & Return to Map</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom floating property card info badge.

                z-[1100]: this card is the result of tapping a pin, so it has
                to sit above everything the map draws over itself. It was
                `z-10` against the map's own overlay chips at `z-[500]` and
                Leaflet's control corners at `z-1000`, so on a phone — where
                the zoom control, the layers panel and the area badge all crowd
                the bottom of a short map — the card you had just summoned was
                painted underneath them. */}
            {activeProperty && displayMode === "map" && (
              <div className="absolute bottom-3 left-3 right-3 z-[1100] animate-in fade-in slide-in-from-bottom-2 duration-200">
                {/* Stacks on phones: side by side, the action buttons squeezed
                    the title and price down to a few characters. */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 rounded-2xl border border-white/90 dark:border-white/10 bg-white/95 dark:bg-surface-panel/95 p-3 shadow-xl dark:shadow-[0_20px_45px_rgba(0,0,0,0.6)] backdrop-blur-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-12 w-14 shrink-0 rounded-xl bg-slate-200 bg-cover bg-center border border-slate-200 dark:border-white/10 dark:bg-surface-ink"
                      style={{ backgroundImage: `url(${activeProperty.image})` }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 truncate">
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
                      className="pill flex-1 sm:flex-none bg-slate-900 text-white dark:bg-emerald-600 dark:text-white dark:border-emerald-500/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)] font-bold shadow-xs hover:opacity-90 transition-all cursor-pointer"
                      title="Inspect Street View"
                    >
                      👁️ Street View
                    </button>
                    <a
                      href={externalGoogleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pill border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-ink/60 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-surface-panel dark:hover:text-white transition-all"
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
