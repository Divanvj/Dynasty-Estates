"use client";

import { useState } from "react";

import { ConsoleRequestError, consoleJson, dateTime, useConsole } from "../_lib/console-client";
import type { IntegrityResult } from "../_lib/types";
import { ScanIcon } from "../_components/console-icons";
import { Button, Empty, ErrorNotice, PageHeader, Pill, StateBadge } from "../_components/ui";

export default function IntegrityPage() {
  const { user } = useConsole();
  const [result, setResult] = useState<IntegrityResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<ConsoleRequestError | null>(null);

  async function run() {
    setRunning(true);
    setError(null);
    try {
      setResult(await consoleJson<IntegrityResult>(user, "/api/console/integrity", { method: "POST" }));
    } catch (err) {
      setError(err as ConsoleRequestError);
    } finally {
      setRunning(false);
    }
  }

  const problems = result?.findings.filter((f) => f.severity !== "info") ?? [];
  const notes = result?.findings.filter((f) => f.severity === "info") ?? [];

  return (
    <>
      <PageHeader
        title="Data integrity"
        description="Looks for records that point at something that no longer exists, accounts missing their profile, and role claims that disagree with profiles. Read-only: it reports and changes nothing. Runs on demand until Blaze allows a nightly schedule."
        actions={
          <Button variant="primary" onClick={() => void run()} loading={running}>
            {running ? null : <ScanIcon className="h-4 w-4" />}
            {result ? "Scan again" : "Run scan"}
          </Button>
        }
      />

      {error ? <ErrorNotice error={error} onRetry={() => void run()} /> : null}

      {!result && !running ? (
        <Empty title="No scan yet">Run a scan to check every account, profile, listing, enquiry, application, collection and photo fingerprint.</Empty>
      ) : null}

      {result ? (
        <>
          <p className="mb-4 text-xs text-[var(--ink-subtle)] tabular-nums">
            Ran {dateTime(result.ranAt)} ·{" "}
            {Object.entries(result.scanned)
              .map(([k, v]) => `${v} ${k}`)
              .join(" · ")}
          </p>

          {problems.length === 0 ? (
            <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] px-5 py-4 text-xs text-emerald-200">
              No integrity problems found.
            </div>
          ) : null}

          <div className="space-y-3">
            {[...problems, ...notes].map((finding) => (
              <section key={finding.check} className="rounded-2xl border border-white/[0.07] bg-[#0a1517] px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-[var(--ink)]">
                    {finding.title} <span className="text-[var(--ink-subtle)] tabular-nums">({finding.items.length})</span>
                  </h2>
                  <StateBadge state={finding.severity === "error" ? "error" : finding.severity === "warning" ? "warning" : "unknown"} label={finding.severity === "info" ? "Note" : undefined} />
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[var(--ink-subtle)]">{finding.description}</p>
                <ul className="mt-3 space-y-1">
                  {finding.items.slice(0, 50).map((item) => (
                    <li key={`${item.collection}-${item.id}`} className="flex flex-wrap items-center gap-2 text-xs">
                      <Pill>{item.collection}</Pill>
                      <span className="text-[var(--ink)]">{item.label}</span>
                      <span className="font-mono text-[var(--ink-subtle)]">{item.id}</span>
                    </li>
                  ))}
                  {finding.items.length > 50 ? <li className="text-xs text-[var(--ink-subtle)]">…and {finding.items.length - 50} more</li> : null}
                </ul>
              </section>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
