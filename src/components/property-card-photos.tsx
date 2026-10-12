"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
/** Slower than the hero: a card is scanned, not studied. */
const HOVER_DWELL_MS = 2200;
const FADE_MS = 550;

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

type Props = {
  images: string[];
  /** Used for the control labels, so each card's buttons are distinguishable. */
  title: string;
  /** Applied to every frame — lets a card keep its own hover zoom. */
  frameClassName?: string;
};

/**
 * The photo layer for a listing card: crossfading frames, arrows and dots.
 *
 * Deliberately different from the hero gallery in one respect — it advances only
 * while the pointer is over the card, never on its own. Twenty cards crossfading
 * at once turns a results page into a flicker and makes it impossible to scan,
 * so the motion is tied to the one card the viewer is actually looking at. On
 * touch, where there is no hover, the frames are swiped.
 */
export default function PropertyCardPhotos({ images, title, frameClassName = "" }: Props) {
  const frames = images.filter(Boolean);
  const many = frames.length > 1;

  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const go = useCallback(
    (next: number) => {
      if (!frames.length) return;
      setIndex((next + frames.length) % frames.length);
    },
    [frames.length],
  );

  useEffect(() => {
    if (!many || !hovered || reducedMotion) return;
    const timer = window.setTimeout(() => go(index + 1), HOVER_DWELL_MS);
    return () => window.clearTimeout(timer);
  }, [many, hovered, reducedMotion, index, go]);

  // Only the current frame and its neighbours carry a URL, so a long results
  // page does not request every photograph of every listing up front.
  function isLive(i: number) {
    const n = frames.length;
    return i === index || i === (index + 1) % n || i === (index - 1 + n) % n;
  }

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setIndex(0);
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        touchStartX.current = null;
        if (start === null || !many) return;
        const delta = (e.changedTouches[0]?.clientX ?? start) - start;
        if (Math.abs(delta) > 40) go(delta < 0 ? index + 1 : index - 1);
      }}
    >
      {frames.map((src, i) => (
        <div
          key={`${src}-${i}`}
          aria-hidden={i !== index}
          className={`absolute inset-0 bg-cover bg-center transition-opacity ${
            i === index ? "opacity-100" : "opacity-0"
          } ${frameClassName}`}
          style={{
            backgroundImage: isLive(i) ? `url(${src})` : undefined,
            transitionDuration: `${FADE_MS}ms`,
          }}
        />
      ))}

      {many && (
        <>
          {/* Arrows are revealed on hover on a pointer device — a results page
              covered in permanent chrome looks cluttered — and stay visible on
              touch, where there is no hover to reveal them. */}
          <button
            type="button"
            aria-label={`Previous photograph of ${title}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              go(index - 1);
            }}
            className="tap-44 absolute left-2 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-black/45 text-white backdrop-blur-md transition-opacity hover:bg-black/70 md:opacity-0 md:group-hover:opacity-100"
          >
            <ArrowLeftIcon className="h-3 w-3" />
          </button>
          <button
            type="button"
            aria-label={`Next photograph of ${title}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              go(index + 1);
            }}
            className="tap-44 absolute right-2 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-black/45 text-white backdrop-blur-md transition-opacity hover:bg-black/70 md:opacity-0 md:group-hover:opacity-100"
          >
            <ArrowRightIcon className="h-3 w-3" />
          </button>

          {/* Dots double as a count, so the card says how much there is to see.
              These sit side by side, so the shared `tap-44` helper is the wrong
              tool — expanded areas would overlap and steal each other's taps.
              Each dot instead gets its own padded button: the visual dot stays
              small while the button reaches a comfortable height, and the row
              keeps enough horizontal separation to stay tappable. */}
          <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-0.5 pb-1">
            {frames.map((_, i) => (
              <button
                key={`dot-${i}`}
                type="button"
                aria-label={`Show photograph ${i + 1} of ${frames.length}`}
                aria-current={i === index}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  go(i);
                }}
                className="group/dot flex cursor-pointer items-center justify-center px-1.5 py-2.5"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all ${
                    i === index ? "w-4 bg-champagne-400" : "w-1.5 bg-white/60 group-hover/dot:bg-white/90"
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
