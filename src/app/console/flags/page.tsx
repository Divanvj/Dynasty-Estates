"use client";

import { useState } from "react";

import type { FeatureFlag, PlatformConfig } from "@/lib/platform-config";

import { ConsoleRequestError, consoleJson, dateTime, useConsole, useConsoleData } from "../_lib/console-client";
import { Button, ErrorNotice, PageHeader, Panel, Segmented, SkeletonRows, cx } from "../_components/ui";

type ConfigResponse = { config: PlatformConfig; flags: Record<FeatureFlag, { label: string; description: string }> };

function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-[var(--brand)]" : "bg-white/15",
      )}
    >
      <span
        className={cx(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

const PREVIEW = {
  info: "border-sky-400/25 bg-sky-950/60 text-sky-100",
  warning: "border-amber-400/25 bg-amber-950/60 text-amber-100",
  critical: "border-rose-400/30 bg-rose-950/70 text-rose-100",
} as const;

export default function FlagsPage() {
  const { user } = useConsole();
  const { data, error, loading, refresh, setData } = useConsoleData<ConfigResponse>("/api/console/config");
  const [draft, setDraft] = useState<PlatformConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<ConsoleRequestError | null>(null);
  const [saved, setSaved] = useState(false);

  const current = draft ?? data?.config ?? null;
  const dirty = Boolean(draft && data && JSON.stringify(draft) !== JSON.stringify(data.config));

  function edit(next: PlatformConfig) {
    setDraft(next);
    setSaved(false);
  }

  async function save() {
    if (!draft || !data) return;
    setSaving(true);
    setSaveError(null);
    try {
      const body = await consoleJson<{ config: PlatformConfig }>(user, "/api/console/config", { method: "PUT", body: JSON.stringify(draft) });
      setData({ ...data, config: body.config });
      setDraft(null);
      setSaved(true);
    } catch (err) {
      setSaveError(err as ConsoleRequestError);
    } finally {
      setSaving(false);
    }
  }

  const bannerTooShort = Boolean(current?.maintenance.enabled && !current.maintenance.message.trim());

  return (
    <>
      <PageHeader
        title="Site switches"
        description="A notice banner across the site, and switches that pause individual features. Visitors see changes within about 30 seconds. These hide things in the interface; they are not security."
        actions={
          <>
            {dirty ? (
              <Button variant="ghost" onClick={() => setDraft(null)} disabled={saving}>
                Discard
              </Button>
            ) : null}
            <Button variant="primary" onClick={() => void save()} disabled={!dirty || bannerTooShort} loading={saving}>
              Save changes
            </Button>
          </>
        }
      />

      {error ? <ErrorNotice error={error} onRetry={refresh} /> : null}
      {saveError ? (
        <div className="mb-4">
          <ErrorNotice error={saveError} />
        </div>
      ) : null}
      {saved ? <p className="mb-4 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2 text-xs text-emerald-200">Saved and logged. The site picks it up within about 30 seconds.</p> : null}

      {!current ? (
        loading ? <SkeletonRows rows={4} /> : null
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel
            title="Notice banner"
            description="A line across the top of every page, for maintenance or an incident."
            actions={
              <Switch
                label="Show the notice banner"
                checked={current.maintenance.enabled}
                onChange={(enabled) => edit({ ...current, maintenance: { ...current.maintenance, enabled } })}
              />
            }
          >
            <label htmlFor="banner-message" className="text-xs text-[var(--ink-subtle)]">
              Message
            </label>
            <textarea
              id="banner-message"
              value={current.maintenance.message}
              maxLength={280}
              rows={3}
              onChange={(e) => edit({ ...current, maintenance: { ...current.maintenance, message: e.target.value } })}
              placeholder="Example: Listing photos are temporarily unavailable while we upgrade our storage."
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs leading-relaxed text-[var(--ink)] placeholder:text-[var(--ink-subtle)] focus:border-[var(--brand)]/60 focus:outline-none"
            />
            <div className="mt-1 flex justify-between text-xs text-[var(--ink-subtle)]">
              <span>{bannerTooShort ? <span className="text-amber-200">Write a message before turning the banner on.</span> : null}</span>
              <span className="tabular-nums">{current.maintenance.message.length}/280</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-xs text-[var(--ink-subtle)]">Tone</span>
              <Segmented
                label="Banner tone"
                value={current.maintenance.tone}
                onChange={(tone) => edit({ ...current, maintenance: { ...current.maintenance, tone } })}
                options={[
                  { value: "info", label: "Info" },
                  { value: "warning", label: "Warning" },
                  { value: "critical", label: "Critical" },
                ]}
              />
            </div>
            <p className="mt-4 text-xs text-[var(--ink-subtle)]">Preview</p>
            <div className={cx("mt-1.5 rounded-lg border px-3 py-2 text-center text-xs font-semibold", PREVIEW[current.maintenance.tone])}>
              {current.maintenance.message || "Your message"}
            </div>
          </Panel>

          <Panel title="Features" description="Switched-off pages show a short notice and a link to search instead.">
            <ul className="divide-y divide-white/[0.05]">
              {(Object.keys(data?.flags ?? {}) as FeatureFlag[]).map((key) => (
                <li key={key} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">{data!.flags[key].label}</p>
                    <p className="mt-0.5 text-xs text-[var(--ink-subtle)]">{data!.flags[key].description}</p>
                  </div>
                  <Switch
                    label={`${data!.flags[key].label} on`}
                    checked={current.flags[key]}
                    onChange={(on) => edit({ ...current, flags: { ...current.flags, [key]: on } })}
                  />
                </li>
              ))}
            </ul>
          </Panel>

          {data?.config.updatedAt ? (
            <p className="text-xs text-[var(--ink-subtle)] lg:col-span-2">
              Last changed {dateTime(data.config.updatedAt)} by {data.config.updatedBy}.
            </p>
          ) : null}
        </div>
      )}
    </>
  );
}
