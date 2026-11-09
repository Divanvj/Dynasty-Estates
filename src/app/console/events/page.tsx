"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { dateTime, timeAgo, useConsoleData } from "../_lib/console-client";
import type { LogEvent } from "../_lib/types";
import { ChevronRightIcon } from "../_components/console-icons";
import { Empty, ErrorNotice, PageHeader, RefreshButton, Segmented, SkeletonRows, cx } from "../_components/ui";

type Range = "1h" | "24h" | "7d" | "30d";
type Category = LogEvent["category"];

const CATEGORIES: Array<{ key: Category; label: string; description: string }> = [
  { key: "errors", label: "App errors", description: "Browser and server errors the site reported" },
  { key: "accounts", label: "Accounts", description: "New accounts and the latest sign-in of each" },
  { key: "listings", label: "Listings", description: "Listings created and updated" },
  { key: "enquiries", label: "Enquiries and applications", description: "Enquiries, tenant applications, collections" },
  { key: "support", label: "Support", description: "Support & Guidance messages" },
  { key: "admin", label: "Moderation", description: "The /admin audit trail" },
  { key: "console", label: "Console actions", description: "What developers and admins did here, and health checks" },
];

export default function EventsPage() {
  const [range, setRange] = useState<Range>("24h");
  const [query, setQuery] = useState("");
  const [openCategory, setOpenCategory] = useState<Category | null>(null);
  const { data, error, loading, refresh, loadedAt } = useConsoleData<{ events: LogEvent[] }>(`/api/console/events?range=${range}`);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const events = data?.events ?? [];
    return q ? events.filter((e) => `${e.title} ${e.detail} ${e.actor ?? ""}`.toLowerCase().includes(q)) : events;
  }, [data, query]);

  const byCategory = useMemo(() => {
    const map = new Map<Category, LogEvent[]>();
    for (const e of filtered) map.set(e.category, [...(map.get(e.category) ?? []), e]);
    return map;
  }, [filtered]);

  return (
    <>
      <PageHeader
        title="Event log"
        description="Everything the platform recorded, newest first: accounts, listings, enquiries, support, moderation, console actions and errors. Open a category for its entries."
        actions={<RefreshButton onClick={refresh} loading={loading} loadedAt={loadedAt} />}
      />

      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-[#0a1517] p-3 sm:flex-row sm:items-center">
        <Segmented
          label="Time range"
          value={range}
          onChange={setRange}
          options={[
            { value: "1h", label: "Last hour" },
            { value: "24h", label: "24 hours" },
            { value: "7d", label: "7 days" },
            { value: "30d", label: "30 days" },
          ]}
        />
        <label className="relative flex-1">
          <span className="sr-only">Filter events</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name, email, page or action"
            className="min-h-9 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-xs text-[var(--ink)] placeholder:text-[var(--ink-subtle)] focus:border-[var(--brand)]/60 focus:outline-none"
          />
        </label>
        <span className="shrink-0 text-xs text-[var(--ink-subtle)] tabular-nums">{data ? `${filtered.length} events` : ""}</span>
      </div>

      {error ? <ErrorNotice error={error} onRetry={refresh} /> : null}

      {!data && loading ? (
        <SkeletonRows rows={7} />
      ) : (
        <ul className="space-y-2">
          {CATEGORIES.map((category) => {
            const events = byCategory.get(category.key) ?? [];
            const open = openCategory === category.key;
            const warnings = events.filter((e) => e.severity !== "info").length;
            return (
              <li key={category.key} className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a1517]">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenCategory(open ? null : category.key)}
                  disabled={events.length === 0}
                  className="flex w-full cursor-pointer items-center gap-3 px-5 py-3.5 text-left hover:bg-white/[0.02] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--brand)] disabled:cursor-default disabled:hover:bg-transparent"
                >
                  <ChevronRightIcon className={cx("h-4 w-4 shrink-0 text-[var(--ink-subtle)] transition-transform duration-200", open && "rotate-90", events.length === 0 && "opacity-30")} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--ink)]">{category.label}</p>
                    <p className="text-xs text-[var(--ink-subtle)]">{category.description}</p>
                  </div>
                  {warnings ? (
                    <span className="rounded-md bg-amber-300/10 px-1.5 py-0.5 text-xs font-semibold text-amber-200">
                      {warnings} flagged
                    </span>
                  ) : null}
                  <span className="w-10 text-right text-sm font-semibold text-[var(--ink)] tabular-nums">{events.length}</span>
                </button>
                {open ? (
                  <ul className="divide-y divide-white/[0.04] border-t border-white/[0.06]">
                    {events.slice(0, 200).map((e) => (
                      <li key={e.id} className="flex items-start gap-3 px-5 py-2.5 text-xs">
                        <span
                          className={cx(
                            "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                            e.severity === "error" ? "bg-rose-400" : e.severity === "warning" ? "bg-amber-300" : "bg-white/25",
                          )}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[var(--ink)]">
                            {e.href ? (
                              <Link href={e.href} className="hover:underline">
                                {e.title}
                              </Link>
                            ) : (
                              e.title
                            )}
                          </p>
                          {e.detail ? <p className="mt-0.5 break-words text-[var(--ink-muted)]">{e.detail}</p> : null}
                          {e.actor ? <p className="mt-0.5 text-[var(--ink-subtle)]">{e.actor}</p> : null}
                        </div>
                        <time dateTime={e.at} title={dateTime(e.at)} className="shrink-0 text-[var(--ink-subtle)]">
                          {timeAgo(e.at)}
                        </time>
                      </li>
                    ))}
                    {events.length > 200 ? (
                      <li className="px-5 py-2.5 text-xs text-[var(--ink-subtle)]">Showing the newest 200 of {events.length}. Narrow the range or filter.</li>
                    ) : null}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {data && data.events.length === 0 && !query ? (
        <div className="mt-4">
          <Empty title="Nothing happened in this range">Try a longer range.</Empty>
        </div>
      ) : null}
    </>
  );
}
