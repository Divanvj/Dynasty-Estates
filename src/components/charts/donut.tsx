/**
 * Two-part share (e.g. for sale vs to rent): d1 for the first part, d3 for the
 * rest, the total in the middle. Labelled for screen readers; the legend
 * beside it carries the same numbers as text.
 */
export function Donut({ part, total, centre, caption, label }: { part: number; total: number; centre: string; caption: string; label: string }) {
  const size = 132;
  const r = 50;
  const c = 2 * Math.PI * r;
  const share = total > 0 ? part / total : 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--dash-d3)" strokeWidth="16" />
      {share > 0 ? (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--dash-d1)"
          strokeWidth="16"
          strokeDasharray={`${c * share} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      ) : null}
      <text x="50%" y="47%" textAnchor="middle" fontSize="22" fontWeight="600" fill="currentColor" aria-hidden="true">
        {centre}
      </text>
      <text x="50%" y="62%" textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7" aria-hidden="true">
        {caption}
      </text>
    </svg>
  );
}
