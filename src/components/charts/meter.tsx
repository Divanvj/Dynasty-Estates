/**
 * A thin inline bar for tables and lists (leaderboard, listing health, queue
 * age). `tone` "late" turns it rose — the only time a bar is not teal.
 * Decorative: the number beside it is the value.
 */
export function Meter({
  value,
  max,
  tone = "data",
  marker,
  height = 8,
}: {
  value: number;
  max: number;
  tone?: "data" | "late";
  /** Where a target line sits, as a value on the same scale. */
  marker?: number;
  height?: number;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <span aria-hidden="true" className="relative block w-full rounded-full bg-[var(--dash-track)]" style={{ height }}>
      <span
        className="dash-grow-x absolute inset-y-0 left-0 rounded-full"
        style={{ width: `${pct}%`, background: tone === "late" ? "var(--dash-down)" : "var(--dash-d2)" }}
      />
      {marker !== undefined && max > 0 ? (
        <span className="absolute -inset-y-1 w-0.5 rounded bg-[var(--dash-accent)]" style={{ left: `${Math.min(100, (marker / max) * 100)}%` }} />
      ) : null}
    </span>
  );
}
