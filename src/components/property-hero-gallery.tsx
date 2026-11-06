"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";

import { ArrowLeftIcon, ArrowRightIcon, SearchIcon } from "@/components/icons";
import PropertyGalleryLightbox from "@/components/property-gallery-lightbox";

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
  /** Which photograph the full-screen viewer is on; `null` while it is shut. */
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
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
  //
  // This scrolls the rail itself instead of calling scrollIntoView on the
  // thumbnail. scrollIntoView walks up and scrolls *every* scrollable
  // ancestor, the document included — so once the viewer had scrolled past
  // the gallery, each autoplay advance hauled the page back up to put the
  // strip on screen again, every six seconds, with no way to read the rest of
  // the listing. `block: "nearest"` does not help: the thumbnail is genuinely
  // off screen by then, so the minimum scroll is still a scroll. Moving the
  // rail's own scrollLeft cannot touch the page.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const active = rail.querySelector<HTMLElement>(`[data-frame="${index}"]`);
    if (!active) return;

    const railBox = rail.getBoundingClientRect();
    const activeBox = active.getBoundingClientRect();
    // How far the thumbnail's centre sits from the rail's centre, right now.
    const offset =
      activeBox.left + activeBox.width / 2 - (railBox.left + railBox.width / 2);
    if (Math.abs(offset) < 1) return;

    // scrollTo clamps to the rail's own scrollable range for us.
    rail.scrollTo({
      left: rail.scrollLeft + offset,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [index, reducedMotion]);

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
    <section className="overflow-hidden rounded-panel border border-white/80 bg-white/40 shadow-[0_20px_45px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-surface-panel/70 dark:shadow-[0_20px_45px_rgba(0,0,0,0.5)]">
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
            className={`absolute inset-0 transition-opacity ease-[cubic-bezier(0.4,0,0.2,1)] ${
              i === index ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
            style={{
              transitionDuration: `${FADE_MS}ms`,
            }}
          >
            {isLive(i) && (
              <Image
                src={src}
                alt={`${title} - Photograph ${i + 1}`}
                fill
                priority={i === 0}
                sizes="(max-width: 1280px) 100vw, 1400px"
                className="object-cover object-center"
              />
            )}
          </div>
        ))}

        {/*
          Legibility scrim for the headline and price.

          `z-20`, and everything below it `z-30`, because the active frame
          above carries `z-10` to win the crossfade against its neighbours. A
          positioned element with any z-index paints above every `z-auto`
          positioned sibling regardless of DOM order, so this scrim, both
          arrows, the dwell bar and the whole title/badges/price block were
          painted *behind* the photograph.

          That was not a subtle wash. Measured on /property/silver-lakes at
          375px, `document.elementFromPoint` over the centre of the <h1>
          returned `IMG.object-cover`, and the same over each arrow — so the
          listing's title, location and status badges never appeared at all,
          and neither arrow could be clicked. Only the thumbnail rail worked,
          because it sits outside this container.

          Same bug, same cause, as the one that hid the price on the /search
          grid cards: photo frames at z-10 over un-indexed chrome.
        */}
        <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/*
          The way into the full-screen viewer. The detail page's "Photos" media
          tab used to be the only one in the app, and it repeated this hero —
          rail, counter, arrows, swipe and all — for galleries that run to two
          or three photographs, so it is gone.

          This was already here as a `pointer-events-none` frame counter, so
          making the label the control costs the photograph no extra chrome. It
          sits outside the `many` guard because a single photograph is still
          worth seeing full-screen on a phone; the count appears only when
          there is more than one.
        */}
        <button
          type="button"
          onClick={() => setLightboxIndex(index)}
          aria-label={
            many
              ? `View all ${frames.length} photographs full screen`
              : "View this photograph full screen"
          }
          className="tap-44 absolute right-3 top-3 z-30 flex cursor-pointer items-center gap-1.5 rounded-full border border-white/25 bg-black/40 px-3 py-1.5 text-xs font-bold tracking-[0.2em] text-white backdrop-blur-md transition-all hover:bg-black/65 sm:right-6 sm:top-6"
        >
          <SearchIcon className="h-3.5 w-3.5 shrink-0" />
          {many && (
            <span>
              {String(index + 1).padStart(2, "0")}
              <span className="opacity-50"> / {String(frames.length).padStart(2, "0")}</span>
            </span>
          )}
        </button>

        {many && (
          <>
            {/* Arrows stay visible rather than appearing on hover. Hover-only
                controls look tidy in a mock-up and cost real discoverability —
                and they are invisible on touch, where most of this traffic is. */}
            <button
              type="button"
              onClick={() => go(index - 1, true)}
              aria-label="Previous photograph"
              className="tap-44 absolute left-3 top-[34%] z-30 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-black/40 text-white opacity-85 shadow-lg backdrop-blur-md transition-all hover:bg-black/65 hover:opacity-100 sm:left-5 sm:top-1/2 sm:h-11 sm:w-11"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1, true)}
              aria-label="Next photograph"
              className="tap-44 absolute right-3 top-[34%] z-30 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-black/40 text-white opacity-85 shadow-lg backdrop-blur-md transition-all hover:bg-black/65 hover:opacity-100 sm:right-5 sm:top-1/2 sm:h-11 sm:w-11"
            >
              <ArrowRightIcon className="h-4 w-4" />
            </button>

            {/* Dwell indicator. Champagne, keyed off the frame so it restarts
                with each advance; hidden once the viewer takes over. */}
            {playing && (
              <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[2px] bg-white/10">
                <div
                  key={index}
                  className="h-full origin-left bg-champagne-400/90"
                  style={{ animation: `dyn-dwell ${DWELL_MS}ms linear forwards` }}
                />
              </div>
            )}
          </>
        )}

        <div className="absolute inset-x-0 bottom-0 z-30 p-5 sm:p-6 md:p-10">{children}</div>
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
              className={`relative h-14 w-20 shrink-0 cursor-pointer overflow-hidden rounded-xl transition-all sm:h-16 sm:w-24 ${
                i === index
                  ? "ring-2 ring-champagne-400 brightness-100"
                  : "opacity-60 ring-1 ring-white/20 hover:opacity-100 dark:ring-white/10"
              }`}
            >
              <Image
                src={src}
                alt={`Thumbnail ${i + 1} of ${title}`}
                fill
                sizes="96px"
                className="object-cover object-center"
              />
            </button>
          ))}
        </div>
      )}

      {/* Controlled by this component's own frame index, so the viewer opens on
          the photograph already on show and the hero is left on whichever one
          you stopped at. Navigating inside it counts as taking over, which is
          what stops the slideshow moving under you. */}
      <PropertyGalleryLightbox
        images={frames}
        title={title}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={(next) => {
          setLightboxIndex(next);
          go(next, true);
        }}
      />
    </section>
  );
}
