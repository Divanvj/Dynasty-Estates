"use client";

import { useId, useRef, useState, type PointerEvent } from "react";

/**
 * One measure over time, as a small area line (dataviz: single series, no
 * legend — the tile's title names it; one hue, validated for light and dark:
 * #047857 on light surfaces, #0fa673 on the dark panel; 2px line; hover
 * crosshair + tooltip; the numbers are also in the daily table beside it).
 */
export default function Sparkline({
  label,
  points,
  formatDay,
}: {
  label: string;
  points: { day: string; value: number }[];
  formatDay: (day: string) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const gradientId = useId();
  const W = 240;
  const H = 56;
  const pad = 3;
  const max = Math.max(1, ...points.map((p) => p.value));
  const step = points.length > 1 ? (W - pad * 2) / (points.length - 1) : 0;
  const x = (i: number) => pad + i * step;
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${H - pad} L${x(0).toFixed(1)},${H - pad} Z`;

  function onMove(event: PointerEvent<SVGSVGElement>) {
    const box = ref.current?.getBoundingClientRect();
    if (!box || points.length === 0) return;
    const rel = ((event.clientX - box.left) / box.width) * W;
    setHover(Math.min(points.length - 1, Math.max(0, Math.round((rel - pad) / (step || 1)))));
  }

  const hovered = hover !== null ? points[hover] : null;
  const leftPct = hover !== null ? (x(hover) / W) * 100 : 0;

  return (
    <div className="relative">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${label}, last ${points.length} days, peak ${max === 1 && points.every((p) => p.value === 0) ? 0 : max} a day`}
        className="block h-14 w-full touch-none text-[#047857] dark:text-[#0fa673]"
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Recessive baseline. */}
        <line x1={pad} x2={W - pad} y1={H - pad} y2={H - pad} className="stroke-slate-300 dark:stroke-white/15" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {hover !== null ? (
          <line x1={x(hover)} x2={x(hover)} y1={pad} y2={H - pad} className="stroke-slate-400 dark:stroke-white/40" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ) : null}
      </svg>
      {hovered ? (
        <div
          role="status"
          className="pointer-events-none absolute -top-9 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900 shadow-md dark:border-white/10 dark:bg-[#0c1a1c] dark:text-white"
          style={{ left: `${Math.min(88, Math.max(12, leftPct))}%` }}
        >
          {formatDay(hovered.day)}: {hovered.value}
        </div>
      ) : null}
    </div>
  );
}
