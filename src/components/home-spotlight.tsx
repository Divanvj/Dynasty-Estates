"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { ArrowLeftIcon, ArrowRightIcon, LocationPinIcon } from "@/components/icons";
import type { PropertyRecord } from "@/lib/property-data";
import { RECENTLY_VIEWED_EVENT } from "@/lib/recently-viewed";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const DWELL_MS = 7000;
const FADE_MS = 1200;

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_MOTION);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

/**
 * Subscribes to the viewer's own recent-view list. Returns an empty array on the
 * server so the first client render matches the markup that was sent.
 */
function useRecentlyViewedIds() {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener(RECENTLY_VIEWED_EVENT, onChange);
      window.addEventListener("storage", onChange);
      return () => {
        window.removeEventListener(RECENTLY_VIEWED_EVENT, onChange);
        window.removeEventListener("storage", onChange);
      };
    },
    () => localStorage.getItem("dynasty_recently_viewed") ?? "",
    () => "",
  );
}

/**
 * The homepage spotlight: a slow crossfade through properties, led by whatever
 * the viewer looked at last.
 *
 * This replaced a hardcoded Camps Bay listing with a stock photograph, which
 * showed the same home to everyone and pointed at a property whether or not it
 * existed. Now it is the visitor's own history first — their actual recent views
 * — and falls back to the catalogue's featured homes for anyone arriving fresh.
 * That is a genuine personalisation with no model behind it and nothing implied
 * about how it was chosen.
 */
export default function HomeSpotlight({ properties }: { properties: PropertyRecord[] }) {
  const recentRaw = useRecentlyViewedIds();
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [takenOver, setTakenOver] = useState(false);

  const recentIds: string[] = (() => {
    try {
      const parsed: unknown = recentRaw ? JSON.parse(recentRaw) : [];
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
    } catch {
      return [];
    }
  })();

  const recent = recentIds
    .map((id) => properties.find((p) => p.id === id || p.slug === id))
    .filter((p): p is PropertyRecord => Boolean(p))
    .slice(0, 5);

  const personalised = recent.length > 0;
  // Fall back to the highest-rated homes so a first-time visitor still sees the
  // catalogue at its best.
  const slides = personalised
    ? recent
    : [...properties].sort((a, b) => b.rating - a.rating).slice(0, 5);

  const many = slides.length > 1;
  const playing = many && !takenOver && !reducedMotion;
  const safeIndex = slides.length ? index % slides.length : 0;
  const active = slides[safeIndex];

  const go = useCallback(
    (next: number, manual = false) => {
      if (!slides.length) return;
      setIndex((next + slides.length) % slides.length);
      if (manual) setTakenOver(true);
    },
    [slides.length],
  );

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => go(safeIndex + 1), DWELL_MS);
    return () => window.clearTimeout(timer);
  }, [playing, safeIndex, go]);

  if (!active) return null;

  const isRental = active.listingType === "rent";

  return (
    <section className="relative z-10 mx-auto mt-6 max-w-[1440px]">
      <div className="rounded-[32px] border border-white/70 bg-white/45 p-4 shadow-[0_20px_45px_rgba(36,48,50,0.08)] backdrop-blur-xl md:p-5 dark:border-white/10 dark:bg-[#0c1a1c]/65 dark:shadow-[0_20px_45px_rgba(0,0,0,0.5)]">
        <div className="group relative overflow-hidden rounded-[26px] border border-white/60 bg-[#dbe8f0] shadow-sm dark:border-white/10 dark:bg-[#071113]">
          <div className="relative h-[400px] sm:h-[460px] md:h-[500px]">
            {slides.map((slide, i) => (
              <div
                key={slide.id}
                aria-hidden={i !== safeIndex}
                className={`absolute inset-0 bg-cover bg-center transition-opacity ${
                  i === safeIndex ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  backgroundImage:
                    i === safeIndex ||
                    i === (safeIndex + 1) % slides.length ||
                    i === (safeIndex - 1 + slides.length) % slides.length
                      ? `url(${slide.image})`
                      : undefined,
                  transitionDuration: `${FADE_MS}ms`,
                }}
              />
            ))}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />

            {/* Top badges. The first says plainly why this home is here. */}
            <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2 sm:left-6 sm:top-6">
              <span className="rounded-full border border-white/30 bg-black/40 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md dark:border-white/10">
                {personalised ? "Recently viewed by you" : "Premier spotlight"}
              </span>
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200 backdrop-blur-md">
                {active.suburb || active.city || active.province}
              </span>
            </div>

            {many && (
              <>
                <div className="pointer-events-none absolute right-4 top-4 rounded-full border border-white/25 bg-black/35 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-white backdrop-blur-md sm:right-6 sm:top-6">
                  {String(safeIndex + 1).padStart(2, "0")}
                  <span className="opacity-50"> / {String(slides.length).padStart(2, "0")}</span>
                </div>

                <button
                  type="button"
                  onClick={() => go(safeIndex - 1, true)}
                  aria-label="Previous property"
                  className="absolute left-3 top-[32%] flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-black/40 text-white opacity-85 shadow-lg backdrop-blur-md transition-all hover:bg-black/65 hover:opacity-100 sm:left-5 sm:top-1/2"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => go(safeIndex + 1, true)}
                  aria-label="Next property"
                  className="absolute right-3 top-[32%] flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-black/40 text-white opacity-85 shadow-lg backdrop-blur-md transition-all hover:bg-black/65 hover:opacity-100 sm:right-5 sm:top-1/2"
                >
                  <ArrowRightIcon className="h-4 w-4" />
                </button>

                {playing && (
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-white/10">
                    <div
                      key={safeIndex}
                      className="h-full origin-left bg-champagne-400/90"
                      style={{ animation: `dyn-dwell ${DWELL_MS}ms linear forwards` }}
                    />
                  </div>
                )}
              </>
            )}

            {/* Frosted showcase bar */}
            <div className="absolute inset-x-4 bottom-4 rounded-[24px] border border-white/20 bg-black/50 p-5 text-white backdrop-blur-xl sm:inset-x-6 sm:bottom-6 sm:p-6 dark:border-white/10">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 sm:text-xs">
                    <LocationPinIcon className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                    <span className="truncate">{active.location}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-baseline gap-2">
                    <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      {active.price}
                    </h2>
                    {isRental && (
                      <span className="text-xs font-normal text-slate-300 sm:text-sm">
                        {active.leaseTerm ? `• ${active.leaseTerm}` : ""}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-200 sm:text-sm">
                    {active.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-300">
                    {active.beds} Bedrooms • {active.baths} Bathrooms • {active.parking} Garages •{" "}
                    {active.area}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <Link
                    href={`/property/${active.slug}`}
                    className="cursor-pointer whitespace-nowrap rounded-2xl border border-emerald-400/30 bg-gradient-to-r from-[#0b4d4e] to-[#07393a] px-6 py-3 text-center text-xs font-bold text-white shadow-lg transition-all hover:scale-102 hover:from-[#0d595b] hover:to-[#094344] sm:text-sm dark:bg-gradient-to-r dark:from-emerald-600 dark:to-emerald-700 dark:text-white dark:border-emerald-500/50 dark:shadow-[0_0_20px_rgba(16,185,129,0.4)] dark:hover:from-emerald-500 dark:hover:to-emerald-600"
                  >
                    View this residence →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
