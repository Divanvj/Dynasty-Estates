/**
 * A progress ring. On the statement card ("hero") it is champagne on a pale
 * track — the card's one highlight; on an ordinary card it is teal (d1).
 * `value` is 0..1; `text` is what sits in the middle (defaults to the %).
 */
export function Ring({
  value,
  label,
  text,
  size = 120,
  tone = "hero",
}: {
  value: number;
  label: string;
  text?: string;
  size?: number;
  tone?: "hero" | "card";
}) {
  const clamped = Math.max(0, Math.min(1, value));
  const stroke = size >= 110 ? 10 : 9;
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  const mid = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className="shrink-0">
      <circle cx={mid} cy={mid} r={r} fill="none" stroke={tone === "hero" ? "var(--dash-hero-track)" : "var(--dash-track)"} strokeWidth={stroke} />
      <circle
        cx={mid}
        cy={mid}
        r={r}
        fill="none"
        stroke={tone === "hero" ? "var(--dash-accent)" : "var(--dash-d1)"}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - clamped)}
        transform={`rotate(-90 ${mid} ${mid})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize={size / 6}
        fontWeight={600}
        fill={tone === "hero" ? "var(--dash-hero-ink)" : "currentColor"}
        aria-hidden="true"
      >
        {text ?? `${Math.round(clamped * 100)}%`}
      </text>
    </svg>
  );
}
