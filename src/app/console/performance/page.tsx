"use client";

import { useState } from "react";

import { formatInt, useConsoleData } from "../_lib/console-client";
import type { Vitals } from "../_lib/types";
import { Empty, ErrorNotice, PageHeader, Panel, RefreshButton, Segmented, SkeletonRows, cx } from "../_components/ui";

const METRICS = [
  { key: "LCP", name: "Largest paint", hint: "When the main content has loaded." },
  { key: "INP", name: "Interaction delay", hint: "How long a tap or click takes to show a response." },
  { key: "CLS", name: "Layout shift", hint: "How much the page jumps while loading. Unitless." },
  { key: "FCP", name: "First paint", hint: "When anything first appears." },
  { key: "TTFB", name: "Server response", hint: "Time to the first byte from the server." },
] as const;

type Threshold = { good: number; poor: number; unit: "ms" | "" };

function format(value: number | null | undefined, unit: "ms" | "") {
  if (value == null) return "—";
  if (unit === "") return value.toFixed(3);
  return value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${Math.round(value)} ms`;
}

function rating(value: number | null | undefined, t: Threshold) {
  if (value == null) return null;
  return value <= t.good ? "good" : value <= t.poor ? "needs work" : "poor";
}

function RatingText({ value, t }: { value: number | null | undefined; t: Threshold }) {
  const r = rating(value, t);
  return (
    <span
      className={cx(
        "font-semibold tabular-nums",
        r === "good" && "text-emerald-300",
        r === "needs work" && "text-amber-200",
        r === "poor" && "text-rose-300",
        r === null && "text-[var(--ink-subtle)]",
      )}
    >
      {format(value, t.unit)}
    </span>
  );
}

export default function PerformancePage() {
  const [days, setDays] = useState<"1" | "7" | "30">("7");
  const { data, error, loading, refresh, loadedAt } = useConsoleData<Vitals>(`/api/console/vitals?days=${days}`);

  return (
    <>
      <PageHeader
        title="Performance"
        description="Real visitors' page speed (Core Web Vitals), reported by their browsers. Figures are the 75th percentile: three in four visits were at least this fast. Thresholds follow Google's good / needs-work / poor bands."
        actions={
          <>
            <Segmented
              label="Time range"
              value={days}
              onChange={setDays}
              options={[
                { value: "1", label: "24 h" },
                { value: "7", label: "7 days" },
                { value: "30", label: "30 days" },
              ]}
            />
            <RefreshButton onClick={refresh} loading={loading} loadedAt={loadedAt} />
          </>
        }
      />

      {error ? <ErrorNotice error={error} onRetry={refresh} /> : null}

      {!data && loading ? (
        <SkeletonRows rows={6} />
      ) : data && data.samples === 0 ? (
        <Empty title="No speed samples in this range">
          Samples are sent as people browse the site, once the page is hidden or closed. Dev-server visits count too, but are
          much slower than production.
        </Empty>
      ) : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {METRICS.map((m) => {
              const t = data.thresholds[m.key] as Threshold;
              const s = data.metrics[m.key];
              return (
                <div key={m.key} className="rounded-2xl border border-white/[0.07] bg-[#0a1517] p-4">
                  <p className="text-xs font-medium text-[var(--ink-muted)]">
                    {m.name} <span className="text-[var(--ink-subtle)]">({m.key})</span>
                  </p>
                  <p className="mt-3 text-2xl">
                    <RatingText value={s?.p75} t={t} />
                  </p>
                  <p className="mt-2 text-xs leading-snug text-[var(--ink-subtle)]">
                    {m.hint} {s ? `${formatInt(s.samples)} samples.` : "No samples."}
                  </p>
                </div>
              );
            })}
          </div>

          <Panel title="By page" description="Slowest largest paint first." className="mt-6" bodyClassName="px-0 py-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[var(--ink-subtle)]">
                    <th scope="col" className="px-5 py-2.5 font-medium">Page</th>
                    {METRICS.map((m) => (
                      <th key={m.key} scope="col" className="px-3 py-2.5 text-right font-medium">
                        {m.key}
                      </th>
                    ))}
                    <th scope="col" className="px-5 py-2.5 text-right font-medium">Samples</th>
                  </tr>
                </thead>
                <tbody>
                  {data.routes.map((row) => (
                    <tr key={row.route} className="border-b border-white/[0.04] last:border-0">
                      <td className="px-5 py-2.5 font-mono text-[var(--ink)]">{row.route}</td>
                      {METRICS.map((m) => (
                        <td key={m.key} className="px-3 py-2.5 text-right">
                          <RatingText value={row.metrics[m.key]?.p75} t={data.thresholds[m.key] as Threshold} />
                        </td>
                      ))}
                      <td className="px-5 py-2.5 text-right text-[var(--ink-subtle)] tabular-nums">{row.samples}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          {data.truncated ? <p className="mt-3 text-xs text-amber-200">Only the latest 5,000 samples are included.</p> : null}
        </>
      ) : null}
    </>
  );
}
