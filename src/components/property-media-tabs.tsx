"use client";

import { useState } from "react";
import PropertyGalleryLightbox from "@/components/property-gallery-lightbox";
import VirtualTour3DViewer from "@/components/virtual-tour-3d-viewer";
import { SparklesIcon } from "@/components/icons";

interface PropertyMediaTabsProps {
  title: string;
  gallery: string[];
  floorPlanImage?: string;
  virtualTourUrl?: string;
  area: string;
  erfSize?: string;
  location?: string;
}

export default function PropertyMediaTabs({
  title,
  gallery,
  floorPlanImage,
  virtualTourUrl,
  area,
  erfSize,
  location,
}: PropertyMediaTabsProps) {
  const [activeTab, setActiveTab] = useState<"photos" | "floorplan" | "virtual-tour" | "street-view">("photos");
  const [mapMode, setMapMode] = useState<"map" | "street">("street");

  const defaultFloorPlan =
    floorPlanImage ||
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80";

  const mapQuery = encodeURIComponent(`${title}, ${location || "South Africa"}`);
  const streetViewQuery = encodeURIComponent(`${location || title}, South Africa`);

  return (
    <div className="rounded-[30px] border border-white/80 dark:border-white/10 bg-white/55 dark:bg-[#0c1a1c]/80 p-6 shadow-[0_20px_45px_rgba(36,48,50,0.06)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)] backdrop-blur-xl md:p-8">
      {/* Media Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/70 dark:border-white/10 pb-4 mb-6">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100/90 dark:bg-[#060d0e]/80 border border-slate-200/80 dark:border-white/10 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("photos")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "photos"
                ? "bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm dark:border dark:border-emerald-500/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Photos ({gallery.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("floorplan")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "floorplan"
                ? "bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm dark:border dark:border-emerald-500/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Floor Plan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("virtual-tour")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "virtual-tour"
                ? "bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-sm dark:border dark:border-emerald-500/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <SparklesIcon className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
            <span>3D Tour</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("street-view")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "street-view"
                ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white border border-emerald-500/50 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>🗺️ Street View & Map</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium dark:text-slate-400">
          {activeTab === "photos" && "Click any photo to open full-screen lightbox"}
          {activeTab === "floorplan" && `Architectural Under-Roof Layout · ${area} ${erfSize ? `(Erf ${erfSize})` : ""}`}
          {activeTab === "virtual-tour" && "Interactive 3D Walkthrough Experience"}
          {activeTab === "street-view" && "Google Maps & 360° Street View Inspection"}
        </div>
      </div>

      {/* Tab 1: Photos */}
      {activeTab === "photos" && (
        <PropertyGalleryLightbox images={gallery} title={title} />
      )}

      {/* Tab 2: Floor Plan */}
      {activeTab === "floorplan" && (
        <div className="space-y-4 animate-fade-in">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950/5 p-2 sm:p-4 text-center dark:border-white/10 dark:bg-[#060d0e]/60">
            <div
              className="relative mx-auto h-[360px] sm:h-[460px] w-full max-w-2xl rounded-xl bg-contain bg-center bg-no-repeat shadow-inner"
              style={{ backgroundImage: `url(${defaultFloorPlan})` }}
            >
              <div className="absolute bottom-3 right-3 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md dark:border dark:border-white/10">
                Floor Area: {area} {erfSize ? `· Erf: ${erfSize}` : ""}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 rounded-xl bg-slate-50 p-3 border border-slate-200 dark:bg-[#060d0e]/60 dark:border-white/10 dark:text-slate-300">
            <span>Dimensions and layouts are indicative architectural representations verified by practitioner.</span>
            <a
              href={defaultFloorPlan}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-slate-900 px-3.5 py-1.5 font-bold text-white hover:bg-slate-800 transition-colors shrink-0 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
            >
              Download PDF Blueprint ↗
            </a>
          </div>
        </div>
      )}

      {/* Tab 3: 3D Virtual Tour */}
      {activeTab === "virtual-tour" && (
        <div className="space-y-4 animate-fade-in">
          <VirtualTour3DViewer
            title={title}
            gallery={gallery}
            area={area}
            erfSize={erfSize}
            virtualTourUrl={virtualTourUrl}
          />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 rounded-2xl bg-slate-50 p-4 border border-slate-200/80 dark:bg-[#060d0e]/60 dark:border-white/10 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                <strong>Spatial Navigation Active:</strong> Click and drag to pan 360°, switch room zones, or click <strong>Dollhouse</strong> for isometric cutaway.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("photos")}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 font-bold text-slate-700 hover:text-slate-950 transition-colors shadow-2xs shrink-0 cursor-pointer dark:bg-[#060d0e]/80 dark:border-white/10 dark:text-slate-200 dark:hover:bg-[#0c1a1c] dark:hover:text-white"
            >
              ← Back to Gallery ({gallery.length})
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Google Street View & Map */}
      {activeTab === "street-view" && (
        <div className="space-y-4 animate-fade-in">
          {/* Sub-toolbar: Switch between Street View and Satellite/Map, with clear Back buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 border border-slate-200/80 dark:bg-[#060d0e]/60 dark:border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs dark:border-white/10 dark:bg-[#060d0e]/80">
                <button
                  type="button"
                  onClick={() => setMapMode("street")}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                    mapMode === "street"
                      ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white border border-emerald-500/50 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  👁️ Street View 360°
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode("map")}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                    mapMode === "map"
                      ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white border border-emerald-500/50 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  🗺️ Google Map
                </button>
              </div>

              {mapMode === "street" && (
                <button
                  type="button"
                  onClick={() => setMapMode("map")}
                  className="rounded-xl bg-[#0b4d4e] dark:bg-emerald-600 text-white border border-emerald-500/50 px-3 py-1 text-xs font-bold shadow-xs hover:bg-[#093e3f] dark:hover:bg-emerald-500 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)] transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  <span>← Back to Map</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("photos")}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#060d0e]/80 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:bg-[#0c1a1c] dark:hover:text-white transition-colors shadow-2xs cursor-pointer"
              >
                ← Back to Photos
              </button>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${streetViewQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-slate-900 dark:bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-emerald-500 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-colors"
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
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/95 text-emerald-200 border border-emerald-500/60 px-4 py-2 text-xs font-bold shadow-2xl backdrop-blur-xl hover:bg-emerald-900 transition-all cursor-pointer"
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

