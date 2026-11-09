/**
 * A ranked list of counts with a proportional bar behind each label. For small
 * categorical breakdowns (roles, statuses, providers), where a chart would be
 * more ink than information.
 */
export function BarList({ data, labels = {} }: { data: Record<string, number>; labels?: Record<string, string> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, n]) => n));
  if (!entries.length) return <p className="text-xs text-[var(--ink-subtle)]">Nothing recorded.</p>;
  return (
    <ul className="space-y-1.5">
      {entries.map(([key, count]) => (
        <li key={key} className="relative flex items-center justify-between gap-3 overflow-hidden rounded-md px-2.5 py-1.5 text-xs">
          <span
            className="absolute inset-y-0 left-0 rounded-md bg-[var(--brand-quiet)]"
            style={{ width: `${Math.max(4, (count / max) * 100)}%` }}
            aria-hidden
          />
          <span className="relative capitalize text-[var(--ink-muted)]">{labels[key] ?? key}</span>
          <span className="relative font-semibold text-[var(--ink)] tabular-nums">{count}</span>
        </li>
      ))}
    </ul>
  );
}
