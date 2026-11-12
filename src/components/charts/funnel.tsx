/**
 * How far buyers got: one bar per stage, as a share of the first stage, with
 * the step-to-step conversion under each. The teal ramp darkens towards the
 * top of the funnel (d1 → d3), so the order reads without a legend.
 */
export function Funnel({ steps, label }: { steps: { label: string; count: number }[]; label: string }) {
  const top = Math.max(1, steps[0]?.count ?? 0);
  const fills = ["var(--dash-d1)", "var(--dash-d2)", "var(--dash-d2)", "var(--dash-d3)", "var(--dash-d3)"];
  return (
    <ol aria-label={label} className="flex flex-col gap-2.5">
      {steps.map((step, i) => {
        const share = step.count / top;
        const next = steps[i + 1];
        const conversion = next && step.count > 0 ? Math.round((next.count / step.count) * 100) : null;
        // White text on the two darker fills; ink beside a short bar.
        const inside = share >= 0.3;
        const onDark = i < 3;
        return (
          <li key={step.label}>
            <div className="grid grid-cols-[96px_1fr_40px] items-center gap-3 sm:grid-cols-[120px_1fr_48px]">
              <span className="text-sm text-slate-600 dark:text-slate-300">{step.label}</span>
              <span className="relative h-8 overflow-hidden rounded-lg bg-[var(--dash-track)]">
                <span
                  className="dash-grow-x absolute inset-y-0 left-0 rounded-lg"
                  style={{ width: `${share * 100}%`, background: fills[i] ?? "var(--dash-d3)", animationDelay: `${i * 60}ms` }}
                />
                <span
                  className={`absolute top-1/2 -translate-y-1/2 text-xs font-semibold tabular-nums ${
                    inside && onDark ? "text-white dark:text-[#0b0e0f]" : "text-slate-900 dark:text-white"
                  }`}
                  style={{ left: inside ? 10 : `calc(${share * 100}% + 8px)` }}
                >
                  {Math.round(share * 100)}%
                </span>
              </span>
              <b className="text-right font-semibold tabular-nums text-slate-900 dark:text-white">{step.count}</b>
            </div>
            {conversion !== null ? (
              <p className="ml-[108px] mt-1 text-xs text-slate-500 sm:ml-[132px] dark:text-slate-400">↓ {conversion}% moved on</p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
