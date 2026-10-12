"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Reads the reduced-motion preference as an external store rather than mirroring
 * it into state from an effect, which would trigger a cascading render on mount.
 * The server snapshot is `false` so the markup matches on hydration.
 */
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

/** How long each frame holds before the slideshow advances. */
const DWELL_MS = 6000;
/** Crossfade duration. Long and slow reads as premium; a fast cut reads cheap. */
const FADE_MS = 1200;

type Props = {
  images: string[];
  title: string;
  /** The headline, badges and price that sit over the image. */
  children: React.ReactNode;
};

/**
 * The property hero: a crossfading slideshow with a thumbnail rail underneath.
 *
 * Replaces a single static background image. Every frame stays mounted and is
 * crossfaded by opacity rather than swapped, so there is no flash of empty
 * container while the next photograph decodes, and the transition can be slow
 * without feeling broken.
 *
 * The autoplay is deliberately unhurried and yields to the viewer: any manual
 * interaction stops it for good, because a carousel that keeps moving under
 * someone who is trying to look at one photograph is the single most irritating
 * pattern in property listings. It also never starts for a viewer who has asked
 * for reduced motion.
 */
export default function PropertyHeroGallery({ images, title, children }: Props) {
  const frames = images.filter(Boolean);
  const many = frames.length > 1;

  const [index, setIndex] = useState(0);
  const [takenOver, setTakenOver] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const reducedMotion = usePrefersReducedMotion();
  // Derived rather than stored: autoplay runs only when there is more than one
  // photograph, the viewer has not taken control, and motion is welcome.
  const playing = many && !takenOver && !reducedMotion;

  const go = useCallback(
    (next: number, manual = false) => {
      if (!frames.length) return;
      setIndex((next + frames.length) % frames.length);
      // Once someone takes control, stop moving on them.
      if (manual) setTakenOver(true);
    },
    [frames.length],
  );

  // Which frames carry a background URL. Derived rather than tracked in state:
  // the current frame plus its neighbours covers the outgoing half of a crossfade
  // and preloads the next advance, and the browser caches anything already
  // fetched, so a revisited frame is instant without bookkeeping.
  function isLive(i: number) {
    const n = frames.length;
    return i === index || i === (index + 1) % n || i === (index - 1 + n) % n;
  }

  useEffect(() => {
    if (!playing || !many) return;
    const timer = window.setTimeout(() => go(index + 1), DWELL_MS);
    return () => window.clearTimeout(timer);
  }, [playing, many, index, go]);

  // Keep the active thumbnail in view as the slideshow moves.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const active = rail.querySelector<HTMLElement>(`[data-frame="${index}"]`);
    active?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [index]);

  function onKeyDown(event: React.KeyboardEvent) {
    if (!many) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1, true);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1, true);
    }
  }

  return (
    <section className="overflow-hidden rounded-[32px] border border-white/80 bg-white/40 shadow-[0_20px_45px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0c1a1c]/70 dark:shadow-[0_20px_45px_rgba(0,0,0,0.5)]">
      <div
        className="group relative h-[380px] sm:h-[440px] md:h-[540px]"
        role="region"
        aria-roledescription="carousel"
        aria-label={`Photographs of ${title}`}
        tabIndex={many ? 0 : -1}
        onKeyDown={onKeyDown}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          touchStartX.current = null;
          if (start === null || !many) return;
          const delta = (e.changedTouches[0]?.clientX ?? start) - start;
          if (Math.abs(delta) > 45) go(delta < 0 ? index + 1 : index - 1, true);
        }}
      >
        {frames.map((src, i) => (
          <div
            key={`${src}-${i}`}
            aria-hidden={i !== index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity ease-[cubic-bezier(0.4,0,0.2,1)] ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            style={{
              backgroundImage: isLive(i) ? `url(${src})` : undefined,
              transitionDuration: `${FADE_MS}ms`,
            }}
          />
        ))}

        {/* Legibility scrim for the headline and price. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {many && (
          <>
            {/* Frame counter, set in the editorial style the rest of the page uses. */}
            <div className="pointer-events-none absolute right-4 top-4 rounded-full border border-white/25 bg-black/35 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-white backdrop-blur-md sm:right-6 sm:top-6">
              {String(index + 1).padStart(2, "0")}
              <span className="opacity-50"> / {String(frames.length).padStart(2, "0")}</span>
            </div>

            {/* Arrows stay visible rather than appearing on hover. Hover-only
                controls look tidy in a mock-up and cost real discoverability —
                and they are invisible on touch, where most of this traffic is. */}
            <button
              type="button"
              onClick={() => go(index - 1, true)}
              aria-label="Previous photograph"
              className="absolute left-3 top-[34%] flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-black/40 text-white opacity-85 shadow-lg backdrop-blur-md transition-all hover:bg-black/65 hover:opacity-100 sm:left-5 sm:top-1/2 sm:h-11 sm:w-11"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1, true)}
              aria-label="Next photograph"
              className="absolute right-3 top-[34%] flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-black/40 text-white opacity-85 shadow-lg backdrop-blur-md transition-all hover:bg-black/65 hover:opacity-100 sm:right-5 sm:top-1/2 sm:h-11 sm:w-11"
            >
              <ArrowRightIcon className="h-4 w-4" />
            </button>

            {/* Dwell indicator. Champagne, keyed off the frame so it restarts
                with each advance; hidden once the viewer takes over. */}
            {playing && (
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-white/10">
                <div
                  key={index}
                  className="h-full origin-left bg-champagne-400/90"
                  style={{ animation: `dyn-dwell ${DWELL_MS}ms linear forwards` }}
                />
              </div>
            )}
          </>
        )}

        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 md:p-10">{children}</div>
      </div>

      {/* The rail. Sits directly under the hero so choosing a photograph never
          means scrolling away from the one on show. */}
      {many && (
        <div
          ref={railRef}
          className="flex gap-2 overflow-x-auto px-3 py-3 sm:gap-2.5 sm:px-5 sm:py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {frames.map((src, i) => (
            <button
              key={`thumb-${src}-${i}`}
              type="button"
              data-frame={i}
              onClick={() => go(i, true)}
              aria-label={`Show photograph ${i + 1} of ${frames.length}`}
              aria-current={i === index}
              className={`relative h-14 w-20 shrink-0 cursor-pointer overflow-hidden rounded-xl bg-cover bg-center transition-all sm:h-16 sm:w-24 ${
                i === index
                  ? "ring-2 ring-champagne-400 brightness-100"
                  : "opacity-60 ring-1 ring-white/20 hover:opacity-100 dark:ring-white/10"
              }`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
