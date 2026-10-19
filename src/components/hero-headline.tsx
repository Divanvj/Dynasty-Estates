"use client";

import React, { useEffect, useRef } from "react";

/**
 * Dynasty Estates Luxury Hero Headline
 *
 * Professional editorial typography with cursor-reactive ambient emerald sheen:
 * - Natural font shaping and kerning (no per-glyph fracturing).
 * - Symmetrical luxury aesthetic in both Light Mode (deep jewel emerald)
 *   and Dark Mode (luminous moonlight emerald with subtle aura).
 * - Clean, flawless vector edges without artificial pixelated stroke borders.
 */
export default function HeroHeadline() {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const rafRef = useRef<number | null>(null);
  const targetPos = useRef({ x: 50, y: 50 });
  const currentPos = useRef({ x: 50, y: 50 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const host = el.closest("section") ?? el.parentElement;
    if (!host) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

    if (reducedMotion || coarsePointer) {
      el.style.setProperty("--mx", "50%");
      el.style.setProperty("--my", "50%");
      return;
    }

    function handlePointerMove(e: PointerEvent) {
      const rect = el!.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      targetPos.current = {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      };

      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(update);
      }
    }

    function handlePointerLeave() {
      targetPos.current = { x: 50, y: 50 };
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(update);
      }
    }

    function update() {
      const dx = targetPos.current.x - currentPos.current.x;
      const dy = targetPos.current.y - currentPos.current.y;

      currentPos.current.x += dx * 0.12;
      currentPos.current.y += dy * 0.12;

      el!.style.setProperty("--mx", `${currentPos.current.x.toFixed(2)}%`);
      el!.style.setProperty("--my", `${currentPos.current.y.toFixed(2)}%`);

      if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
        rafRef.current = requestAnimationFrame(update);
      } else {
        rafRef.current = null;
      }
    }

    host.addEventListener("pointermove", handlePointerMove as EventListener, { passive: true });
    host.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      host.removeEventListener("pointermove", handlePointerMove as EventListener);
      host.removeEventListener("pointerleave", handlePointerLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <h1
      ref={containerRef}
      className="hero-headline text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light sm:font-normal leading-[1.15] tracking-[-0.025em]"
    >
      <span className="hero-headline__glow" aria-hidden="true" />
      <span className="hero-headline__text">
        A smarter way to discover
        <br />
        property.
      </span>
    </h1>
  );
}
