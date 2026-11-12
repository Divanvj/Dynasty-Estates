"use client";

import Link from "next/link";
import { useState } from "react";

import { reportClientError } from "@/lib/telemetry-client";

import { ConsoleRequestError, consoleFetch, consoleJson, dateTime, useConsole } from "../_lib/console-client";
import { DownloadIcon, PulseIcon } from "../_components/console-icons";
import { Button, ErrorNotice, PageHeader, Panel, StateBadge } from "../_components/ui";

type Probe = { id: string; label: string; ok: boolean; ms: number; detail: string };

const EXPORTABLE = [
  "users",
  "properties",
  "physical_properties",
  "inquiries",
  "applications",
  "support_requests",
  "collections",
  "audit_logs",
  "console_events",
  "app_errors",
] as const;

export default function ToolsPage() {
  const { user } = useConsole();
  const [health, setHealth] = useState<{ ranAt: string; origin: string; probes: Probe[] } | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [error, setError] = useState<ConsoleRequestError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [collection, setCollection] = useState<(typeof EXPORTABLE)[number]>("users");

  async function task(id: string, run: () => Promise<void>) {
    setRunning(id);
    setError(null);
    setNotice(null);
    try {
      await run();
    } catch (err) {
      setError(err instanceof ConsoleRequestError ? err : new ConsoleRequestError(String(err), 0));
    } finally {
      setRunning(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Tools"
        description="One-off jobs. Every run is recorded in the event log under Console actions."
      />

      {error ? (
        <div className="mb-4">
          <ErrorNotice error={error} />
        </div>
      ) : null}
      {notice ? <p className="mb-4 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2 text-xs text-emerald-200">{notice}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          className="lg:col-span-2"
          title="Health check"
          description="Times Firestore, Auth, the key pages and GitHub from the server running this console. The only uptime check until a scheduler is set up."
          actions={
            <Button variant="primary" loading={running === "health"} onClick={() => void task("health", async () => setHealth(await consoleJson(user, "/api/console/health", { method: "POST" })))}>
              {running === "health" ? null : <PulseIcon className="h-4 w-4" />}
              Run health check
            </Button>
          }
        >
          {health ? (
            <>
              <ul className="divide-y divide-white/[0.05]">
                {health.probes.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 py-2.5 text-xs">
                    <StateBadge state={p.ok ? "ok" : "error"} label={p.ok ? "Up" : "Down"} />
                    <span className="min-w-[10rem] flex-1 font-semibold text-[var(--ink)]">{p.label}</span>
                    <span className="text-[var(--ink-subtle)]">{p.detail}</span>
                    <span className="w-20 text-right font-semibold text-[var(--ink)] tabular-nums">{p.ms} ms</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-[var(--ink-subtle)]">
                Ran {dateTime(health.ranAt)} against {health.origin}. A dev server compiles pages on first request, so its times run high.
              </p>
            </>
          ) : (
            <p className="text-xs text-[var(--ink-subtle)]">Not run yet in this visit. Past runs are in the event log.</p>
          )}
        </Panel>

        <Panel title="Export a collection" description="Downloads every document as CSV for a spreadsheet. Some collections hold personal data (ID numbers, phone numbers); handle the file accordingly.">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="export-collection" className="sr-only">
              Collection
            </label>
            <select
              id="export-collection"
              value={collection}
              onChange={(e) => setCollection(e.target.value as (typeof EXPORTABLE)[number])}
              className="min-h-9 cursor-pointer rounded-lg border border-white/10 bg-black/30 px-2 font-mono text-xs text-[var(--ink)]"
            >
              {EXPORTABLE.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Button
              loading={running === "export"}
              onClick={() =>
                void task("export", async () => {
                  const response = await consoleFetch(user, `/api/console/tools/export?collection=${collection}`);
                  const blob = await response.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${collection}-${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  setNotice(`Exported ${collection}.`);
                })
              }
            >
              {running === "export" ? null : <DownloadIcon className="h-4 w-4" />}
              Download CSV
            </Button>
          </div>
        </Panel>

        <Panel title="Clear the page cache" description="Drops every cached page so the next visitor gets a fresh render. Use after changing data a cached page shows.">
          <Button
            loading={running === "revalidate"}
            onClick={() =>
              void task("revalidate", async () => {
                await consoleJson(user, "/api/console/tools/revalidate", { method: "POST" });
                setNotice("Page cache cleared.");
              })
            }
          >
            Clear cache
          </Button>
        </Panel>

        <Panel title="Send a test error" description="Checks the error pipeline end to end: browser → /api/telemetry/error → Firestore → the Errors page. Test errors are labelled and do not count in the dashboard.">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => {
                reportClientError({
                  error: new Error(`Console test error ${new Date().toISOString()}`),
                  test: true,
                });
                setNotice("Test error sent. It should appear on the Errors page within a few seconds.");
              }}
            >
              Send test error
            </Button>
            <Link href="/console/errors" className="text-xs font-semibold text-[var(--brand)] hover:underline">
              Open Errors
            </Link>
          </div>
        </Panel>
      </div>
    </>
  );
}
