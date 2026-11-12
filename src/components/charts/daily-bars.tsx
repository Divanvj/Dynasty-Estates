"use client";

import { useRef, useState, type PointerEvent } from "react";

/**
 * One bar per day (d3, or d2 when bars stand alone), an optional second
 * measure as a d1 line, and today's bar in champagne — the chart's one
 * highlight. Hover or tap shows the day. Screen readers get the totals and
 * the busiest day instead of 30 separate numbers.
 */
export function DailyBars({
  days,
  bars,
  line,
  barLabel,
  lineLabel,
  formatDay,
  height = 200,
  width = 760,
}: {
  days: string[];
  bars: number[];
  line?: number[];
  barLabel: string;
  lineLabel?: string;
  formatDay: (day: string) => string;
  height?: number;
  /** The drawing's own width: match it roughly to the card so labels keep their size (760 for 8 columns, 1240 for full width). */
  width?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const W = width;
  const H = height;
  const left = 28;
  const bottom = 22;
  const top = 10;
  const n = Math.max(1, bars.length);
  const max = Math.max(1, ...bars) * 1.1;
  const slot = (W - left) / n;
  const y = (v: number) => H - bottom - ((H - bottom - top) * v) / max;
  const lineMax = line ? Math.max(1, ...line) * 1.25 : 1;
  const ly = (v: number) => H - bottom - ((H - bottom - top) * v) / lineMax;
  // Whole-number gridlines, without repeats when the busiest day is small.
  const ticks = [...new Set([0, 1, 2, 3].map((g) => Math.round((max * g) / 3)))];
  const labelEvery = Math.max(1, Math.round(n / 5));

  const busiest = bars.reduce((best, v, i) => (v > bars[best] ? i : best), 0);
  const total = bars.reduce((a, b) => a + b, 0);
  const lineTotal = line?.reduce((a, b) => a + b, 0) ?? 0;
  const summary = `${barLabel}: ${total} over ${n} days${bars[busiest] ? `, most on ${formatDay(days[busiest])} (${bars[busiest]})` : ""}.${
    line && lineLabel ? ` ${lineLabel}: ${lineTotal}.` : ""
  }`;

  function onMove(event: PointerEvent<SVGSVGElement>) {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    const rel = ((event.clientX - box.left) / box.width) * W - left;
    setHover(Math.min(n - 1, Math.max(0, Math.floor(rel / slot))));
  }

  const linePath = line
    ? line.map((v, i) => `${i ? "L" : "M"}${(left + i * slot + slot / 2).toFixed(1)},${ly(v).toFixed(1)}`).join("")
    : null;

  return (
    <div className="relative">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={summary}
        className="block w-full touch-none"
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={left} x2={W} y1={y(t)} y2={y(t)} stroke="var(--dash-line)" />
            <text x={0} y={y(t) + 4} fontSize="11" fill="currentColor" className="text-slate-500 dark:text-slate-400">
              {t}
            </text>
          </g>
        ))}
        {bars.map((v, i) => {
          const today = i === n - 1;
          const h = H - bottom - y(v);
          return (
            <rect
              key={days[i] ?? i}
              className="dash-grow-y"
              style={{ animationDelay: `${i * 10}ms` }}
              x={left + i * slot + slot * 0.18}
              y={y(v)}
              width={slot * 0.64}
              height={Math.max(0, h)}
              rx={3}
              fill={today ? "var(--dash-accent)" : line ? "var(--dash-d3)" : "var(--dash-d2)"}
              opacity={hover !== null && hover !== i ? 0.55 : 1}
            />
          );
        })}
        {linePath ? <path d={linePath} fill="none" stroke="var(--dash-d1)" strokeWidth="2.25" strokeLinejoin="round" /> : null}
        {days.map((d, i) =>
          i % labelEvery === 0 ? (
            <text key={d} x={left + i * slot} y={H - 5} fontSize="11" fill="currentColor" className="text-slate-500 dark:text-slate-400">
              {formatDay(d)}
            </text>
          ) : null,
        )}
      </svg>
      {hover !== null ? (
        <div
          role="status"
          className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-md dark:bg-white dark:text-slate-900"
          style={{ left: `${Math.min(90, Math.max(10, ((left + hover * slot + slot / 2) / W) * 100))}%` }}
        >
          {formatDay(days[hover])}: {bars[hover]} {barLabel.toLowerCase()}
          {line && lineLabel ? ` · ${line[hover]} ${lineLabel.toLowerCase()}` : ""}
        </div>
      ) : null}
    </div>
  );
}
