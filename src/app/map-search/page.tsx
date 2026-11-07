"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import DynastyPropertyMap from "@/components/dynasty-property-map";
import { BathIcon, BedIcon, LocationPinIcon, XMarkIcon } from "@/components/icons";
import { getPropertyList, type PropertyRecord } from "@/lib/property-data";

/**
 * Full-screen map search (UX Phase 11.2).
 *
 * Before: the map started ~406px down a phone, under five stacked bars, and a
 * second listing column ran beside it whether or not the visitor had chosen an
 * area. Now one slim bar sits over a map that fills the screen, the map opens
 * on the visitor's own town when they allow it, and listings appear only once
 * they pick an area (radius or freehand draw) or tap a pin.
 */

const TYPES = ["All", "House", "Villa", "Estate Home", "Apartment", "Penthouse"];

/** The visitor's answer to the location prompt, so they are asked once. */
const LOCATION_PREF_KEY = "dynasty_map_location";
/** Roughly South Africa. A visitor elsewhere would land on a map with no homes. */
const SA_BOUNDS = { minLat: -35.2, maxLat: -22.0, minLng: 16.3, maxLng: 33.0 };
/** About one town across. */
const TOWN_ZOOM = 12;

type Focus = { lat: number; lng: number; zoom: number };
type LocationState = "idle" | "locating" | "found" | "denied" | "outside" | "unavailable";

function readPref(): string | null {
  try {
    return localStorage.getItem(LOCATION_PREF_KEY);
  } catch {
    return null;
  }
}

function writePref(value: "granted" | "denied") {
  try {
    localStorage.setItem(LOCATION_PREF_KEY, value);
  } catch {
    // Private mode or storage blocked: they will simply be asked again.
  }
}

export default function MapSearchPage() {
  const [activeType, setActiveType] = useState<string>("All");

  /**
   * The real catalogue. Fetched rather than awaited: this is a client
   * component. A failure is shown, never swapped for demo homes.
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

  // Memoised: the map keys its own `shown` memo off this array.
  const filteredProperties = useMemo(
    () => properties.filter((p) => activeType === "All" || p.type === activeType),
    [properties, activeType]
  );

  /* --------------------------- visitor's location --------------------------- */
  const [focus, setFocus] = useState<Focus | null>(null);
  const [locationState, setLocationState] = useState<LocationState>("idle");

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationState("unavailable");
      return;
    }
    setLocationState("locating");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        writePref("granted");
        const { latitude: lat, longitude: lng } = coords;
        const inSA =
          lat >= SA_BOUNDS.minLat && lat <= SA_BOUNDS.maxLat && lng >= SA_BOUNDS.minLng && lng <= SA_BOUNDS.maxLng;
        if (!inSA) {
          setLocationState("outside");
          return;
        }
        setFocus({ lat, lng, zoom: TOWN_ZOOM });
        setLocationState("found");
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          writePref("denied");
          setLocationState("denied");
        } else {
          setLocationState("unavailable");
        }
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60_000 }
    );
  }, []);

  // Ask once on arrival (the browser shows its own prompt). Someone who said no
  // is not asked again; "Near me" asks on request.
  useEffect(() => {
    if (readPref() === "denied") return;
    const id = window.setTimeout(locate, 0);
    return () => window.clearTimeout(id);
  }, [locate]);

  /* ------------------------------ area & pins ------------------------------ */
  const [areaIds, setAreaIds] = useState<string[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [clearSignal, setClearSignal] = useState(0);

  // Stable identity: the map lists this in an effect's dependencies.
  const handleAreaFilterChange = useCallback((ids: string[] | null) => {
    setAreaIds(ids);
    if (ids) setSelectedId(null);
  }, []);
  const handleSelect = useCallback((id: string) => setSelectedId(id), []);

  const panelHomes = useMemo(() => {
    if (areaIds) {
      const inArea = new Set(areaIds);
      return filteredProperties.filter((p) => inArea.has(p.id));
    }
    if (selectedId) return filteredProperties.filter((p) => p.id === selectedId);
    return null;
  }, [areaIds, selectedId, filteredProperties]);

  const closePanel = () => {
    if (areaIds) setClearSignal((n) => n + 1);
    setSelectedId(null);
  };

  const locationNote: Record<LocationState, string | null> = {
    idle: null,
    locating: "Finding your town…",
    found: null,
    denied: "Location is off, so the map shows all of South Africa.",
    outside: "You seem to be outside South Africa, so the map shows the whole country.",
    unavailable: "Your location isn't available, so the map shows all of South Africa.",
  };

  return (
    // Fills the screen between the top bar and the tab bar on a phone, and
    // below the site header from `lg` up, so the page itself does not scroll.
    <main className="flex h-[calc(100dvh-3.5rem-var(--dyn-mobile-nav-h)-env(safe-area-inset-bottom))] flex-col gap-2 px-2 py-2 text-slate-900 dark:text-slate-100 lg:h-[calc(100dvh-7rem)] lg:gap-3 lg:px-8 lg:py-3">
      {/* One slim bar: title, type, Near me, List view. */}
      <div className="relative z-30 flex shrink-0 items-center gap-2 rounded-card border border-white/80 bg-white/70 p-1.5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-surface-panel/80">
        <h1 className="sr-only">Homes on the map</h1>
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveType(t)}
              aria-pressed={activeType === t}
              className={`pill-sm tap-44 relative shrink-0 font-semibold transition-colors cursor-pointer ${
                activeType === t
                  ? "bg-[var(--brand)] text-white dark:bg-emerald-600"
                  : "text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-surface-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={locate}
          disabled={locationState === "locating"}
          className="pill-sm tap-44 relative shrink-0 border border-slate-300/80 bg-white font-semibold text-slate-800 cursor-pointer disabled:opacity-60 dark:border-white/10 dark:bg-surface-ink dark:text-slate-200"
        >
          <LocationPinIcon className="h-3.5 w-3.5" />
          <span>Near me</span>
        </button>
        <Link
          href="/search"
          className="pill-sm tap-44 relative hidden shrink-0 border border-slate-300/80 bg-white font-semibold text-slate-800 sm:inline-flex dark:border-white/10 dark:bg-surface-ink dark:text-slate-200"
        >
          List view
        </Link>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-2 lg:flex-row lg:gap-3">
        {loading ? (
          <div className="flex flex-1 items-center justify-center rounded-card border border-white/80 bg-white/60 dark:border-white/10 dark:bg-surface-panel/80">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading homes…</p>
          </div>
        ) : loadFailed ? (
          // An empty map would read as "no homes match", so say what happened.
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-card border border-white/80 bg-white/60 px-6 text-center dark:border-white/10 dark:bg-surface-panel/80">
            <p className="text-sm font-bold text-slate-900 dark:text-white">Listings could not be loaded</p>
            <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">
              The catalogue did not respond, so the map has nothing to show. Try again shortly.
            </p>
          </div>
        ) : (
          <>
            <div className="relative min-h-0 flex-1">
              <DynastyPropertyMap
                className="h-full"
                properties={filteredProperties}
                activeId={selectedId ?? undefined}
                onSelect={handleSelect}
                onAreaFilterChange={handleAreaFilterChange}
                focus={focus}
                clearSignal={clearSignal}
              />
              {/* Until an area or a pin is chosen, say how to get listings. */}
              {!panelHomes && (
                <p className="pointer-events-none absolute inset-x-0 bottom-14 z-[500] mx-auto w-fit max-w-[90%] rounded-full bg-slate-950/85 px-3.5 py-1.5 text-center text-xs font-semibold text-white shadow-lg">
                  {locationNote[locationState] ?? "Use Radius or Draw to see the homes in an area, or tap a pin."}
                </p>
              )}
            </div>

            {panelHomes && (
              <section
                aria-label={areaIds ? "Homes in this area" : "Selected home"}
                className="flex max-h-[45%] min-h-0 shrink-0 flex-col rounded-card border border-white/80 bg-white/95 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200 lg:max-h-none lg:w-96 dark:border-white/10 dark:bg-surface-panel/95"
              >
                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200/70 px-4 py-2.5 dark:border-white/10">
                  <p aria-live="polite" className="text-sm font-bold tabular-nums">
                    {areaIds
                      ? `${panelHomes.length} ${panelHomes.length === 1 ? "home" : "homes"} in this area`
                      : "Selected home"}
                  </p>
                  <button
                    type="button"
                    onClick={closePanel}
                    className="tap-44 relative inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer dark:text-slate-300 dark:hover:bg-white/10"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                    {areaIds ? "Clear area" : "Close"}
                  </button>
                </div>
                <ul className="min-h-0 flex-1 divide-y divide-slate-200/70 overflow-y-auto dark:divide-white/10">
                  {panelHomes.length === 0 && (
                    <li className="px-4 py-6 text-center text-sm text-slate-600 dark:text-slate-400">
                      No homes in this area{activeType !== "All" ? ` of type ${activeType}` : ""}. Draw a bigger area or clear it.
                    </li>
                  )}
                  {panelHomes.map((home) => (
                    <li key={home.id}>
                      <Link
                        href={`/property/${home.slug || home.id}`}
                        className="flex gap-3 px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- remote listing photos, no loader configured for every host */}
                        <img
                          src={home.image}
                          alt=""
                          loading="lazy"
                          className="h-16 w-20 shrink-0 rounded-xl object-cover"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold tabular-nums">{home.price}</p>
                          <p className="truncate text-sm text-slate-800 dark:text-slate-200">{home.title}</p>
                          <p className="mt-0.5 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                            <span className="truncate">{[home.suburb, home.city].filter(Boolean).join(", ") || home.location}</span>
                            <span className="flex shrink-0 items-center gap-0.5">
                              <BedIcon className="h-3.5 w-3.5" />
                              {home.beds}
                            </span>
                            <span className="flex shrink-0 items-center gap-0.5">
                              <BathIcon className="h-3.5 w-3.5" />
                              {home.baths}
                            </span>
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
