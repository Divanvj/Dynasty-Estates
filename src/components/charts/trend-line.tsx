import { useId } from "react";

/**
 * A small, static trend under a KPI figure (dashboard palette, d1). No axes,
 * no hover: the figure above it carries the number; this only shows the shape.
 * Hidden from screen readers — the card's own text says what changed.
 */
export function TrendLine({ values, height = 44 }: { values: number[]; height?: number }) {
  const id = useId();
  if (values.length < 2) return <div style={{ height }} aria-hidden="true" />;
  const W = 220;
  const H = height;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = W / (values.length - 1);
  const pts = values.map((v, i) => [i * step, H - 4 - ((v - min) / range) * (H - 10)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" className="block w-full" style={{ height }}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--dash-d1)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--dash-d1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${W},${H} L0,${H}Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke="var(--dash-d1)" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
