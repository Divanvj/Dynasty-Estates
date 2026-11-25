"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The scroll-driven camera move behind the home hero (concept A, "Arrival",
 * owner 25 Nov 2026): the render walks from the living room, through the
 * open doors, out to the pool as the visitor scrolls.
 *
 * It is a layer over the still photo in HomeHeroPhoto, never a replacement:
 * the still is the first paint, and stays the whole experience for anyone who
 * turns motion off, has Data Saver on, or is on a 2G connection. For
 * everyone else the frames load only after the page has finished loading and
 * the browser is idle, and the canvas fades in once all of them are ready.
 *
 *   Desktop (from md): 36 frames, 1600×900 WebP, about 0.9 MB in all. The
 *   hero is held (sticky) for 70vh of scrolling while the camera moves; see
 *   the `motion-safe:` height on #discover in app/page.tsx.
 *   Phones: 18 upright frames, 828×1472 WebP, about 0.3 MB. Nothing is held;
 *   the move plays as the hero scrolls away, so the page is no longer.
 *
 * Frames are static files in public/hero/frames, rendered with the Blender
 * set-up in hero-render/ (outside the repo).
 */
const SETS = {
  desktop: { dir: "/hero/frames/d", count: 36 },
  phone: { dir: "/hero/frames/p", count: 18 },
} as const;
const OBJECT_Y = 0.58; // matches the still's object-position: center 58%

function frameUrl(dir: string, i: number) {
  return `${dir}/${String(i + 1).padStart(2, "0")}.webp`;
}

function allowed(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (conn?.saveData) return false;
  // Only 2G: Chrome reports "3g" for many ordinary desktop links (it is an RTT
  // estimate), and the frames load after the page anyway.
  if (conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return false;
  return true;
}

export default function HomeHeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = canvas?.closest<HTMLElement>("#discover");
    if (!canvas || !hero || !allowed()) return;

    const desktop = window.matchMedia("(min-width: 768px)").matches;
    const set = desktop ? SETS.desktop : SETS.phone;
    const frames: (HTMLImageElement | null)[] = new Array(set.count).fill(null);
    let cancelled = false;
    let drawn = -1;
    let raf = 0;

    function progress(): number {
      const rect = hero!.getBoundingClientRect();
      const vh = window.innerHeight;
      const stage = canvas!.parentElement!.getBoundingClientRect().height;
      // Held on desktop: the section is taller than its sticky stage, and the
      // move spans exactly the extra height. Otherwise: from the top of the
      // page until the hero's bottom edge reaches 35% of the screen.
      const held = hero!.offsetHeight - stage > 8;
      const span = held ? hero!.offsetHeight - stage : Math.max(200, rect.bottom + window.scrollY - 0.35 * vh);
      const travelled = held ? -rect.top : window.scrollY;
      return Math.min(1, Math.max(0, travelled / span));
    }

    function draw(force = false) {
      raf = 0;
      const i = Math.round(progress() * (set.count - 1));
      // Nearest loaded frame, so a slow load never shows a blank.
      let pick = i;
      while (pick > 0 && !frames[pick]) pick--;
      const img = frames[pick];
      if (!img || (!force && pick === drawn)) return;
      const ctx = canvas!.getContext("2d");
      if (!ctx) return;
      const { width: cw, height: ch } = canvas!;
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.drawImage(img, (cw - w) / 2, (ch - h) * OBJECT_Y, w, h);
      drawn = pick;
    }

    function size() {
      const box = canvas!.parentElement!.getBoundingClientRect();
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      canvas!.width = Math.round(box.width * dpr);
      canvas!.height = Math.round(box.height * dpr);
      draw(true);
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(() => draw());
    };

    async function load() {
      let next = 0;
      const worker = async () => {
        while (!cancelled && next < set.count) {
          const i = next++;
          const img = new Image();
          img.decoding = "async";
          img.src = frameUrl(set.dir, i);
          try {
            await img.decode();
            frames[i] = img;
          } catch {
            // A missing frame is skipped; the nearest earlier one is drawn.
          }
        }
      };
      await Promise.all([worker(), worker(), worker(), worker()]);
      if (cancelled || !frames[0]) return;
      size();
      setReady(true);
    }

    // Only once the page has loaded and the browser is idle: the frames never
    // compete with the still photo, the search or the listings.
    const start = () => {
      const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
      if (idle) idle(() => void load(), { timeout: 3000 });
      else setTimeout(() => void load(), 1500);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", size);
    return () => {
      cancelled = true;
      window.removeEventListener("load", start);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", size);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 h-full w-full transition-opacity duration-500 motion-reduce:hidden ${ready ? "opacity-100" : "opacity-0"}`}
    />
  );
}
