/**
 * Where asking prices sit, lowest to highest: one dot per listing on a single
 * line, the middle half shaded when there is one, the median marked in
 * champagne. The table below it carries every figure; this shows the spread.
 */
export function PriceStrip({
  prices,
  median,
  quartiles,
  format,
  label,
}: {
  prices: number[];
  median: number;
  quartiles?: { p25: number; p75: number } | null;
  format: (n: number) => string;
  label: string;
}) {
  if (prices.length === 0) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  // Keep dots off the very ends so they are not clipped.
  const at = (n: number) => `${4 + ((n - min) / span) * 92}%`;
  return (
    <figure className="m-0">
      <figcaption className="sr-only">{label}</figcaption>
      <div aria-hidden="true" className="relative h-24">
        {/* Median label above its marker. */}
        <span
          className="absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--dash-accent-soft)] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[var(--dash-accent-ink)]"
          style={{ left: at(median) }}
        >
          Median {format(median)}
        </span>
        <span className="absolute inset-x-0 top-[54px] h-1.5 rounded-full bg-[var(--dash-track)]" />
        {quartiles ? (
          <span
            className="absolute top-[50px] h-3.5 rounded-full bg-[color-mix(in_srgb,var(--dash-d2)_35%,transparent)]"
            style={{ left: at(quartiles.p25), width: `${((quartiles.p75 - quartiles.p25) / span) * 92}%` }}
          />
        ) : null}
        {prices.map((p, i) => (
          <span
            key={i}
            className="absolute top-[57px] size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--dash-card)] bg-[var(--dash-d1)] shadow-sm"
            style={{ left: at(p) }}
          />
        ))}
        <span className="absolute top-7 h-[34px] w-0.5 -translate-x-1/2 rounded bg-[var(--dash-accent)]" style={{ left: at(median) }} />
      </div>
      <div className="mt-1 flex justify-between gap-4 text-xs tabular-nums text-slate-600 dark:text-slate-400">
        <span>
          <span className="block font-semibold uppercase tracking-[0.12em]">Lowest</span>
          {format(min)}
        </span>
        {quartiles ? (
          <span className="text-center">
            <span className="block font-semibold uppercase tracking-[0.12em]">Middle half</span>
            {format(quartiles.p25)} – {format(quartiles.p75)}
          </span>
        ) : null}
        <span className="text-right">
          <span className="block font-semibold uppercase tracking-[0.12em]">Highest</span>
          {format(max)}
        </span>
      </div>
    </figure>
  );
}
