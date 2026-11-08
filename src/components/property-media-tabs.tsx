"use client";

import { useState } from "react";
import { MapSplitIcon, SparklesIcon } from "@/components/icons";
import { parseTourUrl, tourTabLabel } from "@/lib/virtual-tour";

interface PropertyMediaTabsProps {
  title: string;
  floorPlanImage?: string;
  virtualTourUrl?: string;
  area: string;
  erfSize?: string;
  location?: string;
}

export default function PropertyMediaTabs({
  title,
  floorPlanImage,
  virtualTourUrl,
  area,
  erfSize,
  location,
}: PropertyMediaTabsProps) {
  /*
    No "photos" tab any more. It showed a grid of the same pictures as the hero
    at the top of this page, which has a rail, a counter, arrows and swipe, for
    galleries that run to two or three photographs — so it was a second gallery
    below the first, and it pushed the floor plan and the tour out of sight.

    The full-screen viewer it used to own has moved onto the hero, where the
    frame counter now opens it. Printing changes with this: the floor plan is
    the default panel now, so that is what a printed listing carries under the
    hero rather than the thumbnail grid.
  */
  /*
    The Floor Plan tab exists only when the listing carries a plan. It used to
    fall back to a stock photograph of another house's exterior, captioned
    "verified by practitioner", with a "Download PDF Blueprint" link that opened
    the same photograph. Agents now attach a real plan when they list
    (seller/listings/new); without one, the panel opens on the tour.
  */
  const hasFloorPlan = Boolean(floorPlanImage);
  /*
    The tour tab exists only when the agent supplied a real tour link
    (Matterport, YouTube, Vimeo or another https tour). It used to show a
    "3D tour" built from the ordinary photos: panned stills, invented room
    hotspots, a "Dollhouse" view and a "Laser Tape" with made-up measurements.
  */
  const tour = parseTourUrl(virtualTourUrl);
  const [activeTab, setActiveTab] = useState<"floorplan" | "virtual-tour" | "street-view">(
    hasFloorPlan ? "floorplan" : tour ? "virtual-tour" : "street-view"
  );
  const [mapMode, setMapMode] = useState<"map" | "street">("street");
  const isPdfPlan = /\.pdf($|\?)/i.test(floorPlanImage ?? "");

  const mapQuery = encodeURIComponent(`${title}, ${location || "South Africa"}`);
  const streetViewQuery = encodeURIComponent(`${location || title}, South Africa`);

  return (
    <div className="rounded-panel border border-white/80 dark:border-white/10 bg-white/55 dark:bg-surface-panel/80 p-3 sm:p-6 shadow-[0_20px_45px_rgba(36,48,50,0.06)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)] backdrop-blur-xl md:p-8">
      {/* Media Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/70 dark:border-white/10 pb-4 mb-6">
        <div className="flex max-w-full items-center gap-1.5 self-start overflow-x-auto whitespace-nowrap p-1 rounded-2xl bg-slate-100/90 dark:bg-surface-ink/80 border border-slate-200/80 dark:border-white/10 [scrollbar-width:none]">
          {hasFloorPlan && (
            <button
              type="button"
              onClick={() => setActiveTab("floorplan")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "floorplan"
                  ? "bg-white dark:bg-emerald-700 text-slate-900 dark:text-white shadow-sm dark:border dark:border-emerald-500/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Floor Plan
            </button>
          )}
          {tour && (
          <button
            type="button"
            onClick={() => setActiveTab("virtual-tour")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "virtual-tour"
                ? "bg-white dark:bg-emerald-700 text-slate-900 dark:text-white shadow-sm dark:border dark:border-emerald-500/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <SparklesIcon className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
            <span>{tourTabLabel(tour.kind)}</span>
          </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab("street-view")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "street-view"
                ? "bg-[#0b4d4e] dark:bg-emerald-700 text-white border border-emerald-500/50 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <MapSplitIcon className="h-3.5 w-3.5" />
            <span>Street View &amp; Map</span>
          </button>
        </div>

        {/* An instruction about clicking is meaningless on paper. */}
        <div className="no-print hidden text-xs text-slate-600 font-medium sm:block dark:text-slate-400">
          {activeTab === "floorplan" && `Floor plan · ${area} ${erfSize ? `(Erf ${erfSize})` : ""}`}
          {activeTab === "virtual-tour" && tour && tourTabLabel(tour.kind)}
          {activeTab === "street-view" && "Street View and map"}
        </div>
      </div>

      {/* Tab 1: Floor Plan */}
      {activeTab === "floorplan" && floorPlanImage && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950/5 p-2 sm:p-4 text-center dark:border-white/10 dark:bg-surface-ink/60">
            {isPdfPlan ? (
              <iframe
                title={`Floor plan for ${title}`}
                src={floorPlanImage}
                className="mx-auto h-[360px] sm:h-[460px] w-full max-w-2xl rounded-xl bg-white"
              />
            ) : (
              <div
                role="img"
                aria-label={`Floor plan for ${title}`}
                className="relative mx-auto h-[360px] sm:h-[460px] w-full max-w-2xl rounded-xl bg-contain bg-center bg-no-repeat shadow-inner"
                style={{ backgroundImage: `url(${floorPlanImage})` }}
              >
                <div className="absolute bottom-3 right-3 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-md dark:border dark:border-white/10">
                  Floor Area: {area} {erfSize ? `· Erf: ${erfSize}` : ""}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 rounded-xl bg-slate-50 p-3 border border-slate-200 dark:bg-surface-ink/60 dark:border-white/10 dark:text-slate-300">
            <span>Supplied by the listing agent. Confirm dimensions before you make an offer.</span>
            <a
              href={floorPlanImage}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-slate-900 px-3.5 py-1.5 font-bold text-white hover:bg-slate-800 transition-colors shrink-0 dark:bg-emerald-700 dark:hover:bg-emerald-800 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
            >
              Open floor plan ↗
            </a>
          </div>
        </div>
      )}

      {/* Tab 2: 3D Virtual Tour */}
      {activeTab === "virtual-tour" && tour && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {tour.embedUrl && (
            <div className={`relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 dark:border-white/10 ${tour.kind === "video" ? "aspect-video" : "aspect-[4/3] sm:aspect-video"}`}>
              <iframe
                title={`${tourTabLabel(tour.kind)} of ${title}`}
                src={tour.embedUrl}
                loading="lazy"
                allow="fullscreen; xr-spatial-tracking; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 h-full w-full"
              />
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 rounded-xl bg-slate-50 p-3 border border-slate-200 dark:bg-surface-ink/60 dark:border-white/10 dark:text-slate-300">
            <span>
              {tour.embedUrl
                ? "Supplied by the listing agent."
                : "The listing agent has shared a tour hosted on another site."}
            </span>
            <a
              href={tour.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-slate-900 px-3.5 py-1.5 font-bold text-white hover:bg-slate-800 transition-colors shrink-0 dark:bg-emerald-700 dark:hover:bg-emerald-800"
            >
              Open tour ↗
            </a>
          </div>
        </div>
      )}

      {/* Tab 3: Google Street View & Map */}
      {activeTab === "street-view" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Sub-toolbar: Switch between Street View and Satellite/Map, with clear Back buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 border border-slate-200/80 dark:bg-surface-ink/60 dark:border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs dark:border-white/10 dark:bg-surface-ink/80">
                <button
                  type="button"
                  onClick={() => setMapMode("street")}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                    mapMode === "street"
                      ? "bg-[#0b4d4e] dark:bg-emerald-700 text-white border border-emerald-500/50 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Street View
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode("map")}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                    mapMode === "map"
                      ? "bg-[#0b4d4e] dark:bg-emerald-700 text-white border border-emerald-500/50 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Map
                </button>
              </div>

              {mapMode === "street" && (
                <button
                  type="button"
                  onClick={() => setMapMode("map")}
                  className="rounded-xl bg-[#0b4d4e] dark:bg-emerald-700 text-white border border-emerald-500/50 px-3 py-1 text-xs font-bold shadow-xs hover:bg-[#093e3f] dark:hover:bg-emerald-800 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)] transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  <span>← Back to Map</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* "Back to Photos" went with the Photos tab. */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${streetViewQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-slate-900 dark:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-emerald-800 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-colors"
              >
                Open in Google Maps ↗
              </a>
            </div>
          </div>

          {/* Map / Street View Display Container */}
          <div className="relative h-[440px] sm:h-[500px] w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-900 shadow-inner">
            {mapMode === "street" ? (
              <div className="relative h-full w-full">
                <iframe
                  title="Google Street View"
                  src={`https://maps.google.com/maps?q=${streetViewQuery}&layer=c&output=svembed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full"
                />
                <div className="absolute bottom-4 left-4 z-20">
                  <button
                    type="button"
                    onClick={() => setMapMode("map")}
                    className="pill gap-1.5 bg-emerald-950/95 text-emerald-200 border border-emerald-500/60 font-bold shadow-2xl backdrop-blur-xl hover:bg-emerald-900 transition-all cursor-pointer"
                  >
                    <span>←</span>
                    <span>Exit Street View & Return to Map</span>
                  </button>
                </div>
              </div>
            ) : (
              <iframe
                title="Google Maps"
                src={`https://maps.google.com/maps?q=${mapQuery}&t=m&z=16&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full google-map-iframe"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

