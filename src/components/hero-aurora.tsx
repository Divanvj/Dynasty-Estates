"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/**
 * Aurora Silk — the ambient hero backdrop for Dynasty Estates.
 *
 * Four blurred emerald/teal/champagne light fields, each drifting on its own
 * slow keyframe loop so the composition never repeats visibly. The cursor only
 * *leans* the layers (parallax, different depth per layer) rather than dragging
 * a hue around, which is what keeps it reading as ambient lighting instead of a
 * spotlight. A silk sheen band and film grain sit on top for texture.
 *
 * All motion is CSS; JS writes exactly two custom properties per frame.
 */

interface OrbConfig {
  className: string;
  /** Parallax travel in px. Negative values lean against the cursor for depth. */
  depth: number;
}

const ORBS: OrbConfig[] = [
  { className: "aurora__orb--emerald", depth: 26 },
  { className: "aurora__orb--teal", depth: -18 },
  { className: "aurora__orb--deep", depth: 12 },
  { className: "aurora__orb--champagne", depth: -30 },
];

export default function HeroAurora() {
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef({ x: 0, y: 0, tracking: false });
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const host = root.closest("section") ?? root.parentElement;
    if (!host) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (reducedMotion || coarsePointer) return;

    function handlePointerMove(event: PointerEvent) {
      pointerRef.current.x = event.clientX;
      pointerRef.current.y = event.clientY;
      pointerRef.current.tracking = true;
    }

    function handlePointerLeave() {
      pointerRef.current.tracking = false;
      targetRef.current.x = 0;
      targetRef.current.y = 0;
    }

    host.addEventListener("pointermove", handlePointerMove as EventListener, { passive: true });
    host.addEventListener("pointerleave", handlePointerLeave);

    let onScreen = true;

    function tick() {
      // A single layout read per frame rather than one per pointer event.
      if (pointerRef.current.tracking) {
        const rect = (host as HTMLElement).getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          targetRef.current.x = ((pointerRef.current.x - rect.left) / rect.width - 0.5) * 2;
          targetRef.current.y = ((pointerRef.current.y - rect.top) / rect.height - 0.5) * 2;
        }
      }

      // Heavy easing: the light should lag well behind the cursor.
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.045;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.045;

      root!.style.setProperty("--px", currentRef.current.x.toFixed(4));
      root!.style.setProperty("--py", currentRef.current.y.toFixed(4));

      const settled =
        !pointerRef.current.tracking &&
        Math.abs(currentRef.current.x - targetRef.current.x) < 0.0015 &&
        Math.abs(currentRef.current.y - targetRef.current.y) < 0.0015;

      // Park the loop once the parallax has come to rest. The CSS keyframes keep
      // the light drifting on their own; there is nothing for JS to do until the
      // pointer comes back.
      if (settled || !onScreen) {
        rafRef.current = null;
        return;
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

    // Stop everything — JS loop and CSS keyframes — while the hero is scrolled
    // past. Animation the user cannot see should never cost a frame.
    const observer = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0]?.isIntersecting ?? true;
        root!.classList.toggle("aurora--paused", !onScreen);
        if (onScreen) wake();
      },
      { threshold: 0 }
    );
    observer.observe(host as HTMLElement);

    wake();

    return () => {
      host.removeEventListener("pointermove", handlePointerMove as EventListener);
      host.removeEventListener("pointerleave", handlePointerLeave);
      host.removeEventListener("pointerenter", wake);
      host.removeEventListener("pointermove", wake as EventListener);
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={rootRef} aria-hidden="true" className="aurora">
      {ORBS.map((orb) => (
        <div
          key={orb.className}
          className="aurora__parallax"
          style={{ "--depth": orb.depth } as CSSProperties}
        >
          <div className={`aurora__orb ${orb.className}`} />
        </div>
      ))}

      <div className="aurora__silk" />
      <div className="aurora__grain" />
    </div>
  );
}
