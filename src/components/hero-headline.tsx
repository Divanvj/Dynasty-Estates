"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { HERO_HEADLINES, headlineText } from "@/lib/hero-headlines";

/**
 * Frosted emerald glass headline with a cursor-tracked specular sweep, rotating
 * through the approved hero copy.
 *
 * Every character is built from four stacked layers inside one inline-block:
 *   1. bleed — a heavily blurred teal copy: light diffusing through the glass
 *   2. rim   — a hairline white text-stroke: the polished edge of the pane
 *   3. fill  — a semi-transparent emerald gradient clipped to the glyph, so the
 *              aurora behind genuinely shows through (this is the "frosted" part)
 *   4. spec  — a white highlight clipped to the glyph, positioned from a single
 *              gradient shared across the whole headline via background-size /
 *              background-position, so the light reads as one continuous band
 *              sweeping the line rather than 34 independent per-letter glows
 *
 * Per frame JS writes: two custom properties on the wrapper (cursor position for
 * the specular) and one `--l` per character that has actually changed (proximity
 * lift). Everything else is CSS.
 */

/** How long each headline is held. */
const ROTATE_MS = 7000;
/** Fade-out length. The swap happens at the end of it, so the incoming headline
 *  fades in from a clean slate rather than cross-fading through the outgoing one. */
const TRANSITION_MS = 500;
/**
 * The headline rendered on the server and on the first client paint. It has to
 * be deterministic: picking at random during render would differ between the
 * server and client markup and trip a hydration mismatch. Randomisation starts
 * once mounted.
 */
const FIRST_HEADLINE = 0;

/** Radius in px within which a character reacts to the cursor. Kept close to
 *  the specular gradient's own reach so no character repaints a gradient that
 *  is already fully transparent on it. */
const INFLUENCE = 150;
/** Easing applied to each character's lift so letters settle rather than snap. */
const LIFT_EASE = 0.14;
/** Below this delta we skip the style write entirely. */
const WRITE_EPSILON = 0.004;
/** Minimum cursor travel before the specular gradient is repositioned. Each
 *  reposition repaints a text-clipped gradient on every lit character, so this
 *  trades imperceptible stepping (4px against a 120px-radius glow) for frames. */
const SWEEP_STEP = 4;

interface CharState {
  el: HTMLSpanElement;
  centerX: number;
  centerY: number;
  value: number;
  written: number;
}

/** Fisher–Yates. */
function shuffledIndexes(length: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export default function HeroHeadline() {
  const innerRef = useRef<HTMLSpanElement>(null);
  const charsRef = useRef<CharState[]>([]);
  const pointerRef = useRef({ x: 0, y: 0, inside: false });
  const lastSweep = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number | null>(null);

  const [index, setIndex] = useState(FIRST_HEADLINE);
  const [leaving, setLeaving] = useState(false);

  /**
   * Draw from a shuffled queue rather than picking at random each tick. Random
   * picks happily repeat and cluster; a queue visits every headline once before
   * any repeats, and the only seam is between queues — hence the swap below.
   */
  const queueRef = useRef<number[]>([]);
  const nextIndex = useCallback((current: number) => {
    if (HERO_HEADLINES.length < 2) return current;
    if (queueRef.current.length === 0) {
      const order = shuffledIndexes(HERO_HEADLINES.length);
      // A fresh queue could open on the headline that is already showing.
      if (order[0] === current) [order[0], order[1]] = [order[1], order[0]];
      queueRef.current = order;
    }
    const next = queueRef.current.shift();
    return next === undefined ? current : next;
  }, []);

  /**
   * Measure each glyph box (at rest) and cache its offset inside the headline.
   * `--cx` / `--cy` slice the shared specular gradient; the centers drive
   * proximity.
   *
   * This runs on mount, on resize, and after every headline change — see the
   * layout effect below for why that last one matters.
   */
  const measure = useCallback(() => {
    const inner = innerRef.current;
    if (!inner) return;

    const chars = Array.from(inner.querySelectorAll<HTMLSpanElement>(".hh-c"));
    inner.style.setProperty("--hw", `${inner.offsetWidth}px`);
    inner.style.setProperty("--hh", `${inner.offsetHeight}px`);

    charsRef.current = chars.map((el) => {
      const left = el.offsetLeft;
      const top = el.offsetTop;
      el.style.setProperty("--cx", `${-left}px`);
      el.style.setProperty("--cy", `${-top}px`);
      // React reuses these spans between headlines, so a character can arrive
      // still carrying the lift it had in the previous line. Reset it, or a
      // letter stays raised with the cursor nowhere near it.
      el.style.setProperty("--l", "0");
      return {
        el,
        centerX: left + el.offsetWidth / 2,
        centerY: top + el.offsetHeight / 2,
        value: 0,
        written: 0,
      };
    });
  }, []);

  /**
   * Re-measure before paint whenever the headline changes. React rebuilds the
   * character spans, which leaves every cached offset in `charsRef` pointing at
   * the previous line: the specular would sample a gradient sized for the old
   * headline and the proximity lift would raise the wrong letters. The
   * ResizeObserver below cannot cover this — two headlines can occupy boxes of
   * identical size, and it fires after paint rather than before it.
   */
  useLayoutEffect(() => {
    measure();
  }, [index, measure]);

  /** Rotation. Held separate from the pointer effect so neither restarts the other. */
  useEffect(() => {
    if (HERO_HEADLINES.length < 2) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let swap: number | undefined;

    const rotation = window.setInterval(() => {
      // Nothing to animate to in a background tab, and the swap timer would
      // land on a throttled clock anyway.
      if (document.hidden) return;

      if (reducedMotion) {
        setIndex((current) => nextIndex(current));
        return;
      }

      setLeaving(true);
      swap = window.setTimeout(() => {
        setIndex((current) => nextIndex(current));
        setLeaving(false);
      }, TRANSITION_MS);
    }, ROTATE_MS);

    return () => {
      window.clearInterval(rotation);
      if (swap) window.clearTimeout(swap);
    };
  }, [nextIndex]);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;

    const host = inner.closest("section") ?? inner.parentElement;
    if (!host) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

    // Web fonts land after first paint and shift every glyph box.
    if (document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }

    const resizeObserver = new ResizeObserver(() => measure());
    resizeObserver.observe(inner);

    if (reducedMotion || coarsePointer) {
      return () => resizeObserver.disconnect();
    }

    function handlePointerMove(event: PointerEvent) {
      pointerRef.current.x = event.clientX;
      pointerRef.current.y = event.clientY;
      pointerRef.current.inside = true;
    }

    function handlePointerLeave() {
      pointerRef.current.inside = false;
      inner!.style.setProperty("--spec", "0");
    }

    host.addEventListener("pointermove", handlePointerMove as EventListener, { passive: true });
    host.addEventListener("pointerleave", handlePointerLeave);

    let onScreen = true;

    function tick() {
      const chars = charsRef.current;

      if (pointerRef.current.inside && chars.length > 0) {
        const rect = inner!.getBoundingClientRect();
        const localX = pointerRef.current.x - rect.left;
        const localY = pointerRef.current.y - rect.top;

        // Moving --mx/--my repaints every visible specular gradient, so only
        // write when the cursor has actually travelled a perceptible distance.
        let sweepMoved = false;
        if (
          Math.abs(localX - lastSweep.current.x) > SWEEP_STEP ||
          Math.abs(localY - lastSweep.current.y) > SWEEP_STEP
        ) {
          sweepMoved = true;
          lastSweep.current.x = localX;
          lastSweep.current.y = localY;
          inner!.style.setProperty("--mx", `${localX.toFixed(1)}px`);
          inner!.style.setProperty("--my", `${localY.toFixed(1)}px`);
        }
        inner!.style.setProperty("--spec", "1");

        let settling = false;

        for (const char of chars) {
          const dx = localX - char.centerX;
          const dy = localY - char.centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          let target = 0;
          if (distance < INFLUENCE) {
            const linear = 1 - distance / INFLUENCE;
            // Smoothstep — no hard edge where the influence radius ends.
            target = linear * linear * (3 - 2 * linear);
          }

          if (Math.abs(target - char.value) > 0.002) settling = true;
          char.value += (target - char.value) * LIFT_EASE;

          if (Math.abs(char.value - char.written) > WRITE_EPSILON) {
            char.written = char.value;
            char.el.style.setProperty("--l", char.value.toFixed(3));
          }
        }

        // Cursor is in the hero but parked, and every character has reached its
        // target: there is nothing to draw. Park until the next pointermove.
        if (!sweepMoved && !settling) {
          rafRef.current = null;
          return;
        }
      } else {
        // Settle every lifted character back to rest.
        let moving = false;
        for (const char of chars) {
          if (char.value < 0.001 && char.written === 0) continue;
          char.value += (0 - char.value) * LIFT_EASE;
          if (char.value < 0.001) char.value = 0;
          if (Math.abs(char.value - char.written) > WRITE_EPSILON || char.value === 0) {
            char.written = char.value;
            char.el.style.setProperty("--l", char.value.toFixed(3));
          }
          if (char.value > 0) moving = true;
        }

        // Nothing left to animate — stop the loop entirely rather than burning a
        // frame forever on a headline nobody is pointing at.
        if (!moving || !onScreen) {
          rafRef.current = null;
          return;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    function wake() {
      if (rafRef.current === null && onScreen) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    host.addEventListener("pointerenter", wake);
    host.addEventListener("pointermove", wake as EventListener, { passive: true });

    const visibility = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0]?.isIntersecting ?? true;
        if (onScreen) wake();
      },
      { threshold: 0 }
    );
    visibility.observe(host as HTMLElement);

    return () => {
      host.removeEventListener("pointermove", handlePointerMove as EventListener);
      host.removeEventListener("pointerleave", handlePointerLeave);
      host.removeEventListener("pointerenter", wake);
      host.removeEventListener("pointermove", wake as EventListener);
      visibility.disconnect();
      resizeObserver.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [measure]);

  const headline = HERO_HEADLINES[index];
  const text = headlineText(headline);

  return (
    <h1
      className="hh text-3xl sm:text-4xl font-light leading-tight tracking-[-0.05em] md:text-5xl lg:text-6xl"
      aria-label={text}
    >
      {/* No aria-live: this rotates for atmosphere, and announcing a new
          headline every few seconds would talk over whatever the visitor is
          actually doing. The label above carries the current text. */}
      <span
        ref={innerRef}
        className={`hh__inner${leaving ? " hh__inner--leaving" : ""}${
          headline.compact ? " hh__inner--compact" : ""
        }`}
        aria-hidden="true"
      >
        {/* Single blurred copy behind everything — the light bleeding through
            the pane. One layer for the whole headline, not one per character. */}
        <span className="hh__bleed">
          {headline.lines.map((line, lineIndex) => (
            <span key={lineIndex} className="hh-l">
              {line}
            </span>
          ))}
        </span>

        {headline.lines.map((line, lineIndex) => (
          <span key={lineIndex} className="hh-l">
            {line.split(" ").map((word, wordIndex) => (
              <span key={`${word}-${wordIndex}`}>
                {wordIndex > 0 ? " " : null}
                <span className="hh-w">
                  {Array.from(word).map((character, charIndex) => (
                    <span key={`${character}-${charIndex}`} className="hh-c">
                      <span className="hh-c__rim">{character}</span>
                      <span className="hh-c__fill">{character}</span>
                      <span className="hh-c__spec">{character}</span>
                    </span>
                  ))}
                </span>
              </span>
            ))}
          </span>
        ))}
      </span>
    </h1>
  );
}
