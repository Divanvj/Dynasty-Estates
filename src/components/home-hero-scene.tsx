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
 * everyone else the frames start loading once the still has loaded, every
 * sixth frame first: the canvas fades in after that coarse pass and the
 * in-between frames fill in behind it.
 *
 * Smoothness (owner, 26 Nov): the picture glides to the scroll position
 * rather than snapping, and positions between two frames are a cross-fade of
 * both, so 36 frames read as a continuous move. Only while scrolling.
 *
 *   Desktop (from md): 36 frames, 1600×900 WebP, about 0.9 MB in all. The
 *   hero is held (sticky) for 70vh of scrolling while the camera moves; see
 *   the `motion-safe:` height on #discover in app/page.tsx.
 *   Phones: 36 upright frames, 828×1472 WebP, about 0.65 MB (was 18; every
 *   frame since 26 Nov, so the cross-fades are as fine as on desktop). Nothing
 *   is held; the move plays as the hero scrolls away, so the page is no
 *   longer. They download only after the first touch or scroll (or 3 s).
 *
 * Frames are static files in public/hero/frames, rendered with the Blender
 * set-up in hero-render/ (outside the repo).
 */
const SETS = {
  desktop: { dir: "/hero/frames/d", count: 36 },
  phone: { dir: "/hero/frames/p", count: 36 },
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
    const frames: (ImageBitmap | HTMLImageElement | null)[] = new Array(set.count).fill(null);
    let cancelled = false;
    let pos = -1; // the position on screen, in frames; fractional between two
    let shown = ""; // what the canvas holds now, so an unchanged paint is skipped
    let raf = 0;
    let lastTick = 0;

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

    function target(): number {
      return progress() * (set.count - 1);
    }

    // Nearest loaded frame either side, so the move works (in coarser steps)
    // while the in-between frames are still arriving.
    function nearest(i: number): number {
      for (let d = 0; d < set.count; d++) {
        if (frames[i - d]) return i - d;
        if (frames[i + d]) return i + d;
      }
      return -1;
    }

    function drawFrame(ctx: CanvasRenderingContext2D, img: ImageBitmap | HTMLImageElement) {
      const { width: cw, height: ch } = canvas!;
      const iw = img instanceof HTMLImageElement ? img.naturalWidth : img.width;
      const ih = img instanceof HTMLImageElement ? img.naturalHeight : img.height;
      const scale = Math.max(cw / iw, ch / ih);
      const w = iw * scale;
      const h = ih * scale;
      ctx.drawImage(img, (cw - w) / 2, (ch - h) * OBJECT_Y, w, h);
    }

    // Blend: between two rendered frames, the next one is laid over the
    // current one at the fraction of the way between them, so the in-between
    // positions are a soft cross-fade instead of a held frame. Falls back to
    // the nearest single frame while a neighbour has not loaded yet.
    function paint(p: number, force = false) {
      const i = Math.floor(p);
      const f = p - i;
      let a = i;
      let b = -1;
      if (!frames[i] || !frames[i + 1] || f < 0.02) a = nearest(Math.round(p));
      else if (f > 0.98) a = i + 1;
      else b = i + 1;
      if (a < 0) return;
      // Blend steps of 1/32 are invisible and spare repaints of the same picture.
      const key = b < 0 ? `${a}` : `${a}:${Math.round(f * 32)}`;
      if (!force && key === shown) return;
      const ctx = canvas!.getContext("2d");
      if (!ctx) return;
      drawFrame(ctx, frames[a]!);
      if (b >= 0) {
        ctx.globalAlpha = f;
        drawFrame(ctx, frames[b]!);
        ctx.globalAlpha = 1;
      }
      shown = key;
    }

    // Glide: the picture eases towards the scroll position instead of jumping
    // to it, so a mouse-wheel notch (~100 px, six frames on desktop) plays as
    // a short move through the frames. Time-based, so it settles in about
    // 0.3 s at any refresh rate; the loop stops once it has caught up, so
    // nothing runs while the page is still. Phones glide for less: a finger
    // already scrolls smoothly, and a long glide leaves the picture trailing
    // behind it.
    const GLIDE_MS = desktop ? 90 : 45;
    function tick(now: number) {
      raf = 0;
      const goal = target();
      if (pos < 0) pos = goal;
      const dt = lastTick ? Math.min(64, now - lastTick) : 16;
      pos += (goal - pos) * (1 - Math.exp(-dt / GLIDE_MS));
      if (Math.abs(goal - pos) < 0.01) pos = goal;
      paint(pos);
      if (pos !== goal) {
        lastTick = now;
        raf = requestAnimationFrame(tick);
      } else {
        lastTick = 0;
      }
    }

    function size() {
      const box = canvas!.parentElement!.getBoundingClientRect();
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      canvas!.width = Math.round(box.width * dpr);
      canvas!.height = Math.round(box.height * dpr);
      if (pos < 0) pos = target();
      paint(pos, true);
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    // Coarse to fine: every sixth frame first, so the whole move is usable
    // after a handful of downloads; then every third; then the rest.
    const coarse = new Set<number>([set.count - 1]); // the end of the move too
    for (let i = 0; i < set.count; i += 6) coarse.add(i);
    const order = [...coarse].sort((a, b) => a - b);
    for (const step of [3, 1]) {
      for (let i = 0; i < set.count; i += step) if (!order.includes(i)) order.push(i);
    }
    const firstPass = coarse.size;

    // Decoded off the main thread with createImageBitmap. `img.decode()` was
    // queued behind the page's own work: on a slow phone the coarse frames had
    // downloaded half a second after the first scroll but took ~8 s more to
    // decode, so the move stayed off. Older browsers fall back to decode().
    async function fetchFrame(i: number) {
      const url = frameUrl(set.dir, i);
      try {
        if (typeof createImageBitmap === "function") {
          const res = await fetch(url);
          if (!res.ok) return;
          frames[i] = await createImageBitmap(await res.blob());
        } else {
          const img = new Image();
          img.src = url;
          await img.decode();
          frames[i] = img;
        }
      } catch {
        // A missing frame is skipped; the nearest loaded one is drawn.
      }
    }

    async function load() {
      let next = 0;
      let done = 0;
      const worker = async () => {
        while (!cancelled && next < order.length) {
          await fetchFrame(order[next++]);
          done++;
          // Show the canvas once the coarse pass is in; later frames only
          // make the move smoother.
          if (!cancelled && done === firstPass && frames.some(Boolean)) {
            size();
            setReady(true);
          } else if (!cancelled && done > firstPass && pos >= 0) {
            paint(pos, true);
          }
        }
      };
      await Promise.all([worker(), worker(), worker(), worker()]);
      if (!cancelled && frames.some(Boolean)) {
        size();
        setReady(true);
      }
    }

    // As soon as the still photo has loaded (the page's largest paint), not
    // after the whole page: waiting for window `load` also waited for every
    // listing photo below the hero, which kept the move off for 5–10s.
    //
    // Phones wait a little longer: until the first touch, scroll or key, or
    // 3 s after the still, whichever comes first. On a phone the first seconds
    // belong to the photo, the search and the page's scripts (PageSpeed mobile
    // counted the frames against the page); the move only matters once the
    // visitor scrolls, and the coarse pass is in well within a second of that.
    let started = false;
    let timer = 0;
    const intents = ["touchstart", "pointerdown", "keydown", "scroll"] as const;
    const go = () => {
      if (started || cancelled) return;
      started = true;
      window.clearTimeout(timer);
      intents.forEach((t) => window.removeEventListener(t, go));
      void load();
    };
    const start = () => {
      if (desktop) return go();
      if (timer) return;
      timer = window.setTimeout(go, 3000);
      intents.forEach((t) => window.addEventListener(t, go, { once: true, passive: true }));
    };
    const still = canvas.parentElement?.querySelector("img");
    if (!still || still.complete) start();
    else {
      still.addEventListener("load", start, { once: true });
      still.addEventListener("error", start, { once: true });
    }
    // Safety net: if the still never reports in, start with the page load.
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", size);
    return () => {
      cancelled = true;
      frames.forEach((f) => {
        if (f && "close" in f) f.close(); // free decoded bitmaps
      });
      window.clearTimeout(timer);
      intents.forEach((t) => window.removeEventListener(t, go));
      still?.removeEventListener("load", start);
      still?.removeEventListener("error", start);
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
