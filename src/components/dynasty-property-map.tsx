"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Circle, Map as LeafletMap, Marker, MarkerClusterGroup, Polygon, Polyline } from "leaflet";

import {
  METRO_VIEWS,
  SA_CENTRE,
  buildSuburbStats,
  formatMarkerPrice,
  getPropertyCoordinates,
  getResilience,
  getValueBand,
  pointInPolygon,
  type LatLng,
  type PriceStats,
  type ValueBand,
} from "@/lib/geo-data";
import type { PropertyRecord } from "@/lib/property-data";

export interface DynastyPropertyMapProps {
  properties: PropertyRecord[];
  activeId?: string;
  hoveredId?: string;
  onSelect?: (id: string) => void;
  onHover?: (id: string | undefined) => void;
  /** Lets the host page mirror the map's area filter in its listing feed. */
  onAreaFilterChange?: (visibleIds: string[] | null) => void;
  className?: string;
}

type ResilienceFilter = "all" | "solar" | "water";
type PinMode = "price" | "value";
type AreaTool = "none" | "radius" | "draw";

/**
 * OpenStreetMap's own tiles: no API key and no billing. CARTO's basemaps now
 * stamp "API KEY REQUIRED" across unauthenticated tiles, so they are not usable
 * here. Dark mode is handled by filtering these tiles in CSS.
 */
const TILES = {
  url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};

/** Value mode repaints pins by how they price against their own suburb. */
const VALUE_PALETTE: Record<ValueBand, string> = {
  below: "bg-gradient-to-br from-emerald-600 to-emerald-800 text-white",
  par: "bg-gradient-to-br from-slate-600 to-slate-800 text-white",
  above: "bg-gradient-to-br from-rose-500 to-rose-700 text-white",
  unknown: "bg-gradient-to-br from-slate-400 to-slate-600 text-white",
};
/** Ring colour for the signet in value mode. */
const VALUE_TIP: Record<ValueBand, string> = {
  below: "ring-emerald-300/50",
  par: "ring-slate-300/50",
  above: "ring-rose-300/50",
  unknown: "ring-white/40",
};
/** The anchor dot that sits on the true coordinate. */
const VALUE_DOT: Record<ValueBand, string> = {
  below: "bg-emerald-700",
  par: "bg-slate-700",
  above: "bg-rose-600",
  unknown: "bg-slate-500",
};

/** Metres between two points, for the radius filter. */
function distanceMetres(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function markerHtml(
  p: PropertyRecord,
  state: "idle" | "hover" | "active",
  mode: PinMode,
  stats: PriceStats
) {
  const rent = p.listingType === "rent";
  const { solar, water } = getResilience(p);
  const value = getValueBand(p, stats);

  // The Dynasty signet, not a portal price pill.
  //
  // Every other SA/UK portal draws the same marker: a rounded-full capsule with
  // a speech-bubble tail, colour-coded orange for rent and green for sale. That
  // silhouette is the thing that reads as "copied", so none of it is used here.
  //
  //  - Squared tile at the brand radius, so a pin is the same geometry as the
  //    BrandLogo mark. Ring, never border (a border insets and shows a seam).
  //  - One colour family. Transaction type is NOT colour-coded — a rental is a
  //    champagne hairline and a /m suffix. Losing the orange/green split is what
  //    breaks the resemblance most decisively.
  //  - Resilience reads as a vertical edge rail, not emoji: champagne for solar,
  //    sky for water. No other portal surfaces load-shedding or water security
  //    on the map at all, so this is ours to define.
  //  - No tail. A hairline stem drops to a ringed dot on the true coordinate,
  //    which reads as a survey stake and actually points more precisely.
  const fill =
    mode === "value"
      ? VALUE_PALETTE[value.band]
      : "bg-gradient-to-br from-[#0b4d4e] to-[#062a2b] text-white";

  const edge =
    mode === "value"
      ? VALUE_TIP[value.band]
      : rent
        ? "ring-champagne-400/80"
        : "ring-white/30";

  const lift =
    state === "active"
      ? "scale-110 z-[1000] drop-shadow-[0_10px_20px_rgba(6,78,59,0.45)]"
      : state === "hover"
        ? "scale-105 drop-shadow-[0_8px_16px_rgba(6,78,59,0.35)]"
        : "drop-shadow-[0_3px_8px_rgba(15,23,42,0.3)]";

  const label =
    mode === "value" && value.band !== "unknown"
      ? `${value.deltaPct > 0 ? "+" : ""}${value.deltaPct}%`
      : `${formatMarkerPrice(p)}${rent ? '<span class="font-medium opacity-60">/m</span>' : ""}`;

  // The rail only appears when there is something to report, so an ordinary
  // home stays clean and a resilient one is legible at a glance.
  const rail =
    solar || water
      ? `<span class="flex w-[3px] shrink-0 flex-col overflow-hidden">
           ${solar ? '<i class="flex-1 bg-champagne-400"></i>' : ""}
           ${water ? '<i class="flex-1 bg-sky-400"></i>' : ""}
         </span>`
      : "";

  const title = [solar ? "Solar / backup power" : "", water ? "Borehole / water backup" : ""]
    .filter(Boolean)
    .join(" · ");

  return `
    <div class="dyn-pin flex flex-col items-center transition-transform duration-150 ${lift}">
      <div class="flex items-stretch overflow-hidden rounded-[10px] ring-1 ${edge} ${fill}"${title ? ` title="${title}"` : ""}>
        ${rail}
        <span class="whitespace-nowrap px-2 py-[5px] text-[11px] font-bold tracking-tight tabular-nums">${label}</span>
      </div>
      <span class="h-2 w-px ${mode === "value" ? "bg-slate-500/70" : "bg-[#0b4d4e]/70"}"></span>
      <span class="h-[5px] w-[5px] rounded-full ring-[1.5px] ring-white ${mode === "value" ? VALUE_DOT[value.band] : "bg-[#0b4d4e]"}"></span>
    </div>`;
}

function popupHtml(p: PropertyRecord, stats: PriceStats) {
  const { solar, water } = getResilience(p);
  const v = getValueBand(p, stats);

  // Emoji read as generic and render differently on every platform. These use
  // the same edge-rail language as the marker: a coloured bar, then the word.
  const badges = [
    solar
      ? '<span class="inline-flex items-center gap-1.5 rounded-md bg-champagne-50 py-0.5 pr-2 pl-0 text-[10px] font-bold text-champagne-900 overflow-hidden"><i class="h-3.5 w-[3px] bg-champagne-400"></i>Solar</span>'
      : "",
    water
      ? '<span class="inline-flex items-center gap-1.5 rounded-md bg-sky-50 py-0.5 pr-2 pl-0 text-[10px] font-bold text-sky-900 overflow-hidden"><i class="h-3.5 w-[3px] bg-sky-400"></i>Water</span>'
      : "",
  ].join("");

  // Dynasty's spatial take on "price insights". The basis is named so the
  // comparison is never implied to be tighter than the data supports.
  const area = v.basis === "suburb" ? (p.suburb ?? "the area") : (p.city ?? p.province ?? "the area");
  const yardstick = v.metric === "rate" ? `${area} rate per m²` : `${area} median`;
  const insight =
    v.band === "unknown"
      ? ""
      : `<p class="mt-1.5 rounded-lg px-2 py-1 text-[10px] font-bold ${
          v.band === "below"
            ? "bg-emerald-100 text-emerald-900"
            : v.band === "above"
              ? "bg-rose-100 text-rose-900"
              : "bg-slate-100 text-slate-700"
        }">${
          v.band === "par"
            ? `In line with the ${yardstick}`
            : `${Math.abs(v.deltaPct)}% ${v.band === "below" ? "below" : "above"} the ${yardstick}`
        }</p>`;

  return `
    <a href="/property/${p.slug || p.id}" class="block w-[230px] overflow-hidden rounded-2xl no-underline">
      <div class="h-28 w-full bg-cover bg-center" style="background-image:url('${p.image}')"></div>
      <div class="p-2.5">
        <p class="text-[13px] font-extrabold text-slate-950">${p.price}</p>
        <p class="mt-0.5 text-[12px] font-bold leading-snug text-slate-800">${p.title}</p>
        <p class="mt-0.5 text-[11px] text-slate-500">${p.suburb ?? ""}${p.city ? `, ${p.city}` : ""}</p>
        <p class="mt-1.5 text-[11px] text-slate-600">${p.beds} bed · ${p.baths} bath · ${p.area}</p>
        ${insight}
        ${badges ? `<div class="mt-1.5 flex gap-1">${badges}</div>` : ""}
        <span class="mt-2 block rounded-full bg-slate-950 py-1.5 text-center text-[11px] font-bold text-white">View Home →</span>
      </div>
    </a>`;
}

export default function DynastyPropertyMap({
  properties,
  activeId,
  hoveredId,
  onSelect,
  onHover,
  onAreaFilterChange,
  className = "",
}: DynastyPropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const clusterRef = useRef<MarkerClusterGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const tileRef = useRef<ReturnType<typeof import("leaflet").tileLayer> | null>(null);
  const shapeRef = useRef<Circle | Polygon | Polyline | null>(null);
  const toolRef = useRef<AreaTool>("none");
  /** Set when clearing an area, so the viewport is not yanked back to the whole country. */
  const skipFitRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<ResilienceFilter>("all");
  const [pinMode, setPinMode] = useState<PinMode>("price");
  const [tool, setTool] = useState<AreaTool>("none");
  const [isDark, setIsDark] = useState(false);

  // The drawn/dragged area, in map coordinates.
  const [radiusArea, setRadiusArea] = useState<{ centre: LatLng; metres: number } | null>(null);
  const [polygonArea, setPolygonArea] = useState<LatLng[] | null>(null);

  const stats = useMemo(() => buildSuburbStats(properties), [properties]);

  const shown = useMemo(() => {
    return properties.filter((p) => {
      if (filter !== "all") {
        const r = getResilience(p);
        if (filter === "solar" ? !r.solar : !r.water) return false;
      }
      const at = getPropertyCoordinates(p);
      if (radiusArea) return distanceMetres(radiusArea.centre, at) <= radiusArea.metres;
      if (polygonArea && polygonArea.length > 2) return pointInPolygon(at, polygonArea);
      return true;
    });
  }, [properties, filter, radiusArea, polygonArea]);

  // Let the host page narrow its listing feed to the same set.
  useEffect(() => {
    if (!onAreaFilterChange) return;
    const areaActive = Boolean(radiusArea || (polygonArea && polygonArea.length > 2));
    onAreaFilterChange(areaActive ? shown.map((p) => p.id) : null);
  }, [shown, radiusArea, polygonArea, onAreaFilterChange]);

  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  // Follow whatever the theme provider puts on <html>, without owning it.
  useEffect(() => {
    const read = () => setIsDark(document.documentElement.classList.contains("dark"));
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => obs.disconnect();
  }, []);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      // Adds L.markerClusterGroup; several homes in one suburb would otherwise
      // sit on top of each other at metro zoom and hide one another.
      await import("leaflet.markercluster");
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;

      const map = L.map(containerRef.current, {
        center: [SA_CENTRE.lat, SA_CENTRE.lng],
        zoom: 5,
        zoomControl: false,
        scrollWheelZoom: false, // avoid hijacking page scroll; ctrl+wheel still zooms
      });
      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapRef.current = map;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Add the basemap once it is ready.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || tileRef.current) return;
    tileRef.current = L.tileLayer(TILES.url, { attribution: TILES.attribution, maxZoom: 19 }).addTo(map);
  }, [ready]);

  /* ------------------------- radius & draw tools ------------------------- */
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    let drawing = false;
    let origin: LatLng | null = null;
    let path: LatLng[] = [];

    const clearShape = () => {
      shapeRef.current?.remove();
      shapeRef.current = null;
    };

    const start = (e: { latlng: { lat: number; lng: number } }) => {
      const active = toolRef.current;
      if (active === "none") return;
      drawing = true;
      origin = { lat: e.latlng.lat, lng: e.latlng.lng };
      path = [origin];
      clearShape();

      if (active === "radius") {
        shapeRef.current = L.circle([origin.lat, origin.lng], {
          radius: 0,
          color: "#0b4d4e",
          weight: 2,
          fillColor: "#10b981",
          fillOpacity: 0.12,
        }).addTo(map);
      } else {
        shapeRef.current = L.polyline([[origin.lat, origin.lng]], {
          color: "#0b4d4e",
          weight: 3,
          dashArray: "6 6",
        }).addTo(map);
      }
    };

    const move = (e: { latlng: { lat: number; lng: number } }) => {
      if (!drawing || !origin || !shapeRef.current) return;
      const here = { lat: e.latlng.lat, lng: e.latlng.lng };
      if (toolRef.current === "radius") {
        (shapeRef.current as Circle).setRadius(distanceMetres(origin, here));
      } else {
        path.push(here);
        (shapeRef.current as Polyline).setLatLngs(path.map((q) => [q.lat, q.lng]));
      }
    };

    const end = () => {
      if (!drawing || !origin) return;
      drawing = false;

      if (toolRef.current === "radius") {
        const metres = (shapeRef.current as Circle | null)?.getRadius() ?? 0;
        if (metres > 200) {
          setRadiusArea({ centre: origin, metres });
          setPolygonArea(null);
        } else {
          clearShape();
        }
      } else if (path.length > 3) {
        clearShape();
        shapeRef.current = L.polygon(path.map((q) => [q.lat, q.lng]), {
          color: "#0b4d4e",
          weight: 2,
          fillColor: "#10b981",
          fillOpacity: 0.12,
        }).addTo(map);
        setPolygonArea(path);
        setRadiusArea(null);
      } else {
        clearShape();
      }

      setTool("none");
      map.dragging.enable();
    };

    map.on("mousedown", start);
    map.on("mousemove", move);
    map.on("mouseup", end);
    return () => {
      map.off("mousedown", start);
      map.off("mousemove", move);
      map.off("mouseup", end);
    };
  }, [ready]);

  // Dragging must be off while drawing, or the map pans under the cursor.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tool === "none") map.dragging.enable();
    else map.dragging.disable();
  }, [tool]);

  function clearArea() {
    shapeRef.current?.remove();
    shapeRef.current = null;
    skipFitRef.current = true; // stay where the user is looking
    setRadiusArea(null);
    setPolygonArea(null);
    setTool("none");
  }

  /* ----------------------------- markers -------------------------------- */
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    markersRef.current.clear();
    clusterRef.current?.remove();

    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 48,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (c) => {
        const n = c.getChildCount();
        const size = n < 10 ? 38 : n < 50 ? 46 : 54;
        return L.divIcon({
          className: "dyn-cluster-wrap",
          html: `<div class="flex items-center justify-center rounded-full border-2 border-white/80 bg-gradient-to-br from-[#0b4d4e] to-[#07393a] font-extrabold text-white shadow-[0_6px_18px_rgba(6,78,59,0.45)]" style="width:${size}px;height:${size}px;font-size:${n < 10 ? 13 : 12}px">${n}</div>`,
          iconSize: [size, size],
        });
      },
    });
    clusterRef.current = cluster;

    const bounds: [number, number][] = [];
    for (const p of shown) {
      const { lat, lng } = getPropertyCoordinates(p);
      bounds.push([lat, lng]);

      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: "dyn-pin-wrap",
          html: markerHtml(p, p.id === activeId ? "active" : "idle", pinMode, stats),
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
        riseOnHover: true,
      });

      marker.bindPopup(popupHtml(p, stats), { closeButton: true, className: "dyn-popup", minWidth: 230 });
      marker.on("click", () => onSelect?.(p.id));
      marker.on("mouseover", () => onHover?.(p.id));
      marker.on("mouseout", () => onHover?.(undefined));
      cluster.addLayer(marker);
      markersRef.current.set(p.id, marker);
    }

    map.addLayer(cluster);

    // Don't yank the viewport while inspecting a drawn area, or just after
    // clearing one — the user is still looking at that neighbourhood.
    if (skipFitRef.current) {
      skipFitRef.current = false;
    } else if (bounds.length && !radiusArea && !polygonArea) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, shown, pinMode, stats]);

  // Reflect hover/active state without rebuilding every marker.
  useEffect(() => {
    const L = leafletRef.current;
    if (!L) return;
    markersRef.current.forEach((marker, id) => {
      const p = shown.find((x) => x.id === id);
      if (!p) return;
      const state = id === activeId ? "active" : id === hoveredId ? "hover" : "idle";
      marker.setIcon(
        L.divIcon({
          className: "dyn-pin-wrap",
          html: markerHtml(p, state, pinMode, stats),
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        })
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, hoveredId, ready]);

  // Pan to the selected listing.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeId) return;
    const p = properties.find((x) => x.id === activeId);
    if (!p) return;
    const { lat, lng } = getPropertyCoordinates(p);
    map.panTo([lat, lng], { animate: true });
  }, [activeId, properties]);

  function jumpTo(view: (typeof METRO_VIEWS)[number]) {
    mapRef.current?.flyTo([view.centre.lat, view.centre.lng], view.zoom, { duration: 0.8 });
  }

  const counts = {
    all: properties.length,
    solar: properties.filter((p) => getResilience(p).solar).length,
    water: properties.filter((p) => getResilience(p).water).length,
  };
  const areaActive = Boolean(radiusArea || polygonArea);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        data-map-theme={isDark ? "dark" : "light"}
        data-drawing={tool !== "none" ? "true" : undefined}
        className="h-full w-full rounded-[26px] bg-slate-100 dark:bg-[#08171a]"
      />

      {/* Metro quick-jump */}
      <div className="pointer-events-auto absolute left-3 top-3 z-[500] flex max-w-[60%] items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-full border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[#0c1a1c]/90 p-1 shadow-lg backdrop-blur-xl">
        {METRO_VIEWS.map((v) => (
          <button
            key={v.label}
            type="button"
            onClick={() => jumpTo(v)}
            className="shrink-0 rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-900 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white transition-colors"
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Area tools — search by radius or by a shape you draw yourself. */}
      <div className="pointer-events-auto absolute right-3 top-3 z-[500] flex items-center gap-1 rounded-full border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[#0c1a1c]/90 p-1 shadow-lg backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setTool(tool === "radius" ? "none" : "radius")}
          title="Drag on the map to search within a radius"
          className={`rounded-full px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold transition-all ${
            tool === "radius"
              ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white border border-emerald-400/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
          }`}
        >
          ◎ Radius
        </button>
        <button
          type="button"
          onClick={() => setTool(tool === "draw" ? "none" : "draw")}
          title="Draw your own search area"
          className={`rounded-full px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold transition-all ${
            tool === "draw"
              ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white border border-emerald-400/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
          }`}
        >
          ✎ Draw
        </button>
        {areaActive && (
          <button
            type="button"
            onClick={clearArea}
            className="rounded-full px-2 py-1 text-[10px] sm:text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Prompt while a tool is armed */}
      {tool !== "none" && (
        <div className="pointer-events-none absolute left-1/2 top-16 z-[500] -translate-x-1/2 rounded-full bg-slate-950/90 dark:bg-[#0c1a1c]/95 dark:border dark:border-white/15 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg">
          {tool === "radius" ? "Press and drag to set your radius" : "Press and drag to draw your area"}
        </div>
      )}

      {/* Result count while an area is applied */}
      {areaActive && (
        <div className="pointer-events-none absolute left-1/2 bottom-3 z-[500] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]">
          {shown.length} in your area
        </div>
      )}

      {/* Layers: resilience, plus Dynasty's price-against-suburb view. */}
      <div className="pointer-events-auto absolute bottom-3 left-3 z-[500] rounded-2xl border border-white/70 bg-white/90 dark:border-white/10 dark:bg-[#0c1a1c]/90 p-1.5 shadow-lg backdrop-blur-xl">
        <div className="flex items-center gap-1">
          {/* Same rail language as the markers, so the legend teaches the map.
              Emoji were doing this job before and rendered differently on every
              platform. */}
          {(
            [
              ["all", "All", counts.all, ""],
              ["solar", "Solar", counts.solar, "bg-champagne-400"],
              ["water", "Water", counts.water, "bg-sky-400"],
            ] as [ResilienceFilter, string, number, string][]
          ).map(([id, label, n, rail]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              title={id === "solar" ? "Solar / backup power" : id === "water" ? "Borehole / water backup" : "All residences"}
              className={`flex items-center gap-1.5 overflow-hidden rounded-[10px] py-1 pr-2 text-[10px] sm:text-[11px] font-bold transition-all ${
                rail ? "pl-0" : "pl-2"
              } ${
                filter === id
                  ? "bg-gradient-to-br from-[#0b4d4e] to-[#062a2b] dark:from-emerald-600 dark:to-emerald-700 text-white ring-1 ring-white/25 dark:ring-emerald-400/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  : "bg-white/70 text-slate-600 ring-1 ring-slate-200 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-[#0c1a1c]"
              }`}
            >
              {rail ? <i className={`h-4 w-[3px] shrink-0 ${rail}`} /> : null}
              <span className={id === "all" ? "" : "hidden sm:inline"}>{label}</span>
              <span className="opacity-70">{n}</span>
            </button>
          ))}

          <span className="mx-0.5 h-4 w-px bg-slate-200 dark:bg-white/10" />

          <button
            type="button"
            onClick={() => setPinMode(pinMode === "price" ? "value" : "price")}
            title="Colour pins by price, or by how each home prices against its own suburb median"
            className={`rounded-full px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
              pinMode === "value"
                ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white border border-emerald-400/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                : "border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-[#060d0e]/60 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-[#0c1a1c] dark:hover:text-white"
            }`}
          >
            {pinMode === "value" ? "vs Median" : "Price"}
          </button>
        </div>

        {pinMode === "value" && (
          <div className="mt-1.5 flex items-center gap-2 px-1 text-[9px] font-bold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-600" />Under</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-600" />Par</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" />Over</span>
          </div>
        )}
      </div>

      {shown.length === 0 && (
        <div className="absolute inset-0 z-[400] flex items-center justify-center rounded-[26px] bg-white/70 dark:bg-[#08171a]/80 backdrop-blur-sm">
          <p className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow dark:bg-[#0c1a1c] dark:border dark:border-white/10 dark:text-slate-200">
            No residences in this area.
          </p>
        </div>
      )}
    </div>
  );
}
