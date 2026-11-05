"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import HeroAurora from "@/components/hero-aurora";

export type CursorEffectMode = "aurora" | "halo" | "antigravity" | "off";

const EFFECT_STORAGE_KEY = "dynasty_cursor_effect_mode";
const EFFECT_MODES: CursorEffectMode[] = ["aurora", "halo", "antigravity", "off"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  originX: number;
  originY: number;
  size: number;
  alpha: number;
  color: string;
}

/**
 * Luxury Interactive Cursor & Ambient Effects Suite for Dynasty Estates
 * Scoped strictly to Hero section or custom container.
 * 
 * Modes:
 * 1. 'spotlight' (Default): Radiant luminous emerald spotlight following cursor within the hero
 * 2. 'halo': Precision emerald cursor dot + magnetic expanding halo
 * 3. 'antigravity': Interactive particle field swirling & repelling from cursor
 * 4. 'off': Standard browser cursor
 */
function subscribeEffect(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("dynasty_cursor_effect_change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("dynasty_cursor_effect_change", callback);
  };
}

function getEffectSnapshot(): CursorEffectMode {
  if (typeof window === "undefined") return "aurora";
  try {
    const saved = localStorage.getItem(EFFECT_STORAGE_KEY);
    // "spotlight" was the previous default; migrate anyone still holding it.
    if (saved === "spotlight") return "aurora";
    if (saved && EFFECT_MODES.includes(saved as CursorEffectMode)) {
      return saved as CursorEffectMode;
    }
  } catch {}
  return "aurora";
}

function getServerEffectSnapshot(): CursorEffectMode {
  return "aurora";
}

function subscribeTouch(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia("(hover: none) and (pointer: coarse)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getTouchSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}

function getServerTouchSnapshot(): boolean {
  return false;
}

interface AmbientCursorHueProps {
  heroScoped?: boolean;
}

export default function AmbientCursorHue({ heroScoped = true }: AmbientCursorHueProps) {
  const mode = useSyncExternalStore(subscribeEffect, getEffectSnapshot, getServerEffectSnapshot);
  const isTouchDevice = useSyncExternalStore(subscribeTouch, getTouchSnapshot, getServerTouchSnapshot);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  // References for DOM elements
  const containerRef = useRef<HTMLDivElement>(null);
  const backlightRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Coordinates
  const targetPos = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const prevTargetPos = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const currentHaloPos = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const currentBacklightPos = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });

  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  // Initialize particles for 'antigravity' mode
  useEffect(() => {
    // Skip on touch for the same reason as the interaction loop below: the
    // particle field is repelled by a cursor, and there is none. Reachable on a
    // hybrid device — a tablet with a trackpad shows the FX picker, so the mode
    // can be chosen with a fine pointer and then carried into touch use, where
    // the field would be built and then never driven.
    if (mode !== "antigravity" || isTouchDevice || typeof window === "undefined") return;

    const parentEl = heroScoped
      ? containerRef.current?.parentElement || document.getElementById("discover")
      : null;

    const width = parentEl ? parentEl.clientWidth : window.innerWidth;
    const height = parentEl ? parentEl.clientHeight : window.innerHeight;
    const count = Math.min(Math.floor((width * height) / 16000), 70);

    const colors = [
      "rgba(16, 185, 129, 0.7)",  // emerald
      "rgba(52, 211, 153, 0.7)",  // light emerald
      "rgba(20, 184, 166, 0.65)", // teal
      "rgba(203, 213, 225, 0.6)",  // silver slate
      "rgba(148, 163, 184, 0.5)",  // slate
    ];

    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      particles.push({
        x,
        y,
        originX: x,
        originY: y,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2.5 + 1.2,
        alpha: Math.random() * 0.6 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    particlesRef.current = particles;
  }, [mode, heroScoped, isTouchDevice]);

  // Main interaction loop
  useEffect(() => {
    // Aurora Silk drives its own pointer loop inside <HeroAurora />, so the
    // shared cursor machinery below would only burn frames.
    if (typeof window === "undefined" || isTouchDevice || mode === "off" || mode === "aurora") return;

    const targetElement = heroScoped
      ? containerRef.current?.parentElement || document.getElementById("discover")
      : window;

    if (!targetElement) return;

    const interactiveSelector =
      'a, button, input, select, textarea, [role="button"], [tabindex="0"], label, .cursor-pointer, [data-magnetic]';

    function getRelativePos(e: PointerEvent): { x: number; y: number } {
      if (heroScoped && targetElement instanceof HTMLElement) {
        const rect = targetElement.getBoundingClientRect();
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
      return { x: e.clientX, y: e.clientY };
    }

    function handlePointerEnter(e: PointerEvent) {
      const pos = getRelativePos(e);
      targetPos.current = pos;
      prevTargetPos.current = pos;
      currentBacklightPos.current = pos;
      currentHaloPos.current = pos;
      setIsVisible(true);
    }

    function handlePointerMove(e: PointerEvent) {
      const pos = getRelativePos(e);
      prevTargetPos.current = { ...targetPos.current };
      targetPos.current = pos;

      if (!isVisible) {
        setIsVisible(true);
        currentBacklightPos.current = pos;
        currentHaloPos.current = pos;
      }

      // Move precision dot directly
      if (dotRef.current && mode === "halo") {
        dotRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      }

      // Check hover state for magnetic expansion
      const target = e.target as HTMLElement | null;
      if (target && target.closest(interactiveSelector)) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    }

    function handlePointerDown() {
      setIsClicking(true);
    }

    function handlePointerUp() {
      setIsClicking(false);
    }

    function handlePointerLeave() {
      setIsVisible(false);
      setIsHovering(false);
      setIsClicking(false);
    }

    function handleResize() {
      if (canvasRef.current && mode === "antigravity") {
        if (heroScoped && targetElement instanceof HTMLElement) {
          canvasRef.current.width = targetElement.clientWidth;
          canvasRef.current.height = targetElement.clientHeight;
        } else {
          canvasRef.current.width = window.innerWidth;
          canvasRef.current.height = window.innerHeight;
        }
      }
    }

    if (canvasRef.current && mode === "antigravity") {
      handleResize();
    }

    if (heroScoped && targetElement instanceof HTMLElement) {
      targetElement.addEventListener("pointerenter", handlePointerEnter as EventListener);
      targetElement.addEventListener("pointermove", handlePointerMove as EventListener, { passive: true });
      targetElement.addEventListener("pointerleave", handlePointerLeave as EventListener);
      targetElement.addEventListener("pointerdown", handlePointerDown as EventListener, { passive: true });
      targetElement.addEventListener("pointerup", handlePointerUp as EventListener, { passive: true });
      window.addEventListener("resize", handleResize);
    } else {
      window.addEventListener("pointermove", handlePointerMove as EventListener, { passive: true });
      window.addEventListener("pointerdown", handlePointerDown as EventListener, { passive: true });
      window.addEventListener("pointerup", handlePointerUp as EventListener, { passive: true });
      document.addEventListener("mouseleave", handlePointerLeave);
      window.addEventListener("resize", handleResize);
    }

    // Animation ticker
    function tick() {
      const mouseX = targetPos.current.x;
      const mouseY = targetPos.current.y;

      // 1. Halo Position Easing
      if (mode === "halo" && haloRef.current) {
        const haloEase = 0.2;
        currentHaloPos.current.x += (mouseX - currentHaloPos.current.x) * haloEase;
        currentHaloPos.current.y += (mouseY - currentHaloPos.current.y) * haloEase;
        haloRef.current.style.transform = `translate3d(${currentHaloPos.current.x.toFixed(
          1
        )}px, ${currentHaloPos.current.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      }

      // 2. Ambient Backlight Easing (halo mode only)
      if (mode === "halo" && backlightRef.current) {
        currentBacklightPos.current.x += (mouseX - currentBacklightPos.current.x) * 0.1;
        currentBacklightPos.current.y += (mouseY - currentBacklightPos.current.y) * 0.1;

        const posX = currentBacklightPos.current.x.toFixed(1);
        const posY = currentBacklightPos.current.y.toFixed(1);

        // Tighter, brighter ambient glow for halo mode
        backlightRef.current.style.background = `radial-gradient(280px circle at ${posX}px ${posY}px, rgba(52, 211, 153, 0.40) 0%, rgba(16, 185, 129, 0.26) 30%, rgba(5, 150, 105, 0.10) 60%, transparent 85%)`;
      }

      // 3. Antigravity Particles Simulation
      if (mode === "antigravity" && canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

          const particles = particlesRef.current;
          const repulsionRadius = 140;
          const repulsionForce = 4.5;

          const mdx = mouseX - prevTargetPos.current.x;
          const mdy = mouseY - prevTargetPos.current.y;

          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            const dx = p.x - mouseX;
            const dy = p.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < repulsionRadius && dist > 1) {
              const normalX = dx / dist;
              const normalY = dy / dist;
              const power = (1 - dist / repulsionRadius) * repulsionForce;

              p.vx += normalX * power + mdx * 0.04;
              p.vy += normalY * power + mdy * 0.04;
            }

            p.vx += (p.originX - p.x) * 0.025;
            p.vy += (p.originY - p.y) * 0.025;
            p.vx *= 0.91;
            p.vy *= 0.91;

            p.x += p.vx;
            p.y += p.vy;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowColor = "rgba(16, 185, 129, 0.5)";
            ctx.shadowBlur = 8;
            ctx.fill();

            for (let j = i + 1; j < particles.length; j++) {
              const p2 = particles[j];
              const cdx = p.x - p2.x;
              const cdy = p.y - p2.y;
              const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

              if (cdist < 80) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = `rgba(16, 185, 129, ${0.18 * (1 - cdist / 80)})`;
                ctx.lineWidth = 0.75;
                ctx.stroke();
              }
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (heroScoped && targetElement instanceof HTMLElement) {
        targetElement.removeEventListener("pointerenter", handlePointerEnter as EventListener);
        targetElement.removeEventListener("pointermove", handlePointerMove as EventListener);
        targetElement.removeEventListener("pointerleave", handlePointerLeave as EventListener);
        targetElement.removeEventListener("pointerdown", handlePointerDown as EventListener);
        targetElement.removeEventListener("pointerup", handlePointerUp as EventListener);
      } else {
        window.removeEventListener("pointermove", handlePointerMove as EventListener);
        window.removeEventListener("pointerdown", handlePointerDown as EventListener);
        window.removeEventListener("pointerup", handlePointerUp as EventListener);
        document.removeEventListener("mouseleave", handlePointerLeave);
      }
      window.removeEventListener("resize", handleResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mode, isVisible, isTouchDevice, heroScoped]);

  // Aurora Silk is ambient rather than cursor-driven, so touch devices still get
  // the drifting light field — just none of the pointer FX or the FX picker.
  if (isTouchDevice) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-panel"
      >
        <HeroAurora />
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-panel"
      >
        {/* 1. Aurora Silk — always-alive ambient light field with cursor parallax */}
        {mode === "aurora" && <HeroAurora />}

        {/* 2. Magnetic Halo ambient backlight */}
        {mode === "halo" && (
          <div
            ref={backlightRef}
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 overflow-hidden rounded-panel transition-opacity duration-700 ease-out ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
            style={{ mixBlendMode: "multiply" }}
          />
        )}

        {/* 2. Antigravity Interactive Particle Field */}
        {mode === "antigravity" && (
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 overflow-hidden rounded-panel transition-opacity duration-500 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        {/* 3. Magnetic Precision Cursor Halo & Center Dot (for 'halo' mode) */}
        {mode === "halo" && (
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 overflow-hidden rounded-panel transition-opacity duration-300 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              ref={dotRef}
              className={`absolute left-0 top-0 rounded-full transition-transform duration-75 will-change-transform ${
                isClicking
                  ? "h-2 w-2 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)]"
                  : isHovering
                  ? "h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.9)]"
                  : "h-1.5 w-1.5 bg-emerald-600 shadow-[0_0_6px_rgba(16,185,129,0.8)]"
              }`}
              style={{ willChange: "transform" }}
            />

            <div
              ref={haloRef}
              className={`absolute left-0 top-0 rounded-full border transition-[width,height,background-color,border-color,box-shadow] duration-200 ease-out will-change-transform flex items-center justify-center ${
                isClicking
                  ? "h-8 w-8 border-emerald-500/80 bg-emerald-500/30 shadow-[0_0_24px_rgba(16,185,129,0.5)] scale-90"
                  : isHovering
                  ? "h-14 w-14 border-emerald-400 bg-emerald-500/20 shadow-[0_0_36px_rgba(16,185,129,0.45)] ring-1 ring-emerald-400/40"
                  : "h-9 w-9 border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              }`}
              style={{ willChange: "transform" }}
            />
          </div>
        )}
      </div>

      {/*
        The effect switcher that used to live here — a fixed corner pill reading
        "FX: Aurora Silk", opening a picker for Magnetic Halo, Antigravity
        Particles and Off — has been removed. It was a developer control that
        shipped to visitors, and a readout of the renderer's internal codename
        is the clearest possible signal that a site is someone's work in
        progress.

        The effect itself still runs; `mode` just no longer has a user-facing
        switch. Whether the ambient hero backdrop survives at all is a separate
        decision, taken in step S8.
      */}
    </>
  );
}
