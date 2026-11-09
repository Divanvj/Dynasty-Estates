"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { InfoCircleIcon } from "@/components/icons";
import { DEFAULT_PLATFORM_CONFIG, type FeatureFlag, type PlatformConfig } from "@/lib/platform-config";

type Status = Pick<PlatformConfig, "maintenance" | "flags">;

/*
  One fetch per page load, shared by the banner and every FeatureGate. Until it
  answers, the defaults apply (no banner, every feature on), so a slow or
  failed status call never hides anything.
*/
const DEFAULT_STATUS: Status = {
  maintenance: DEFAULT_PLATFORM_CONFIG.maintenance,
  flags: DEFAULT_PLATFORM_CONFIG.flags,
};
let status: Status = DEFAULT_STATUS;
let started = false;
const listeners = new Set<() => void>();

function load() {
  if (started || typeof window === "undefined") return;
  started = true;
  fetch("/api/platform/status")
    .then((response) => (response.ok ? response.json() : null))
    .then((body: Status | null) => {
      if (!body?.flags || !body.maintenance) return;
      status = { maintenance: body.maintenance, flags: { ...status.flags, ...body.flags } };
      listeners.forEach((listener) => listener());
    })
    .catch(() => {});
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  load();
  return () => {
    listeners.delete(listener);
  };
}

export function usePlatformStatus(): Status {
  return useSyncExternalStore(
    subscribe,
    () => status,
    () => DEFAULT_STATUS,
  );
}

const TONES = {
  info: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-400/25 dark:bg-sky-950/60 dark:text-sky-100",
  warning:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-400/25 dark:bg-amber-950/60 dark:text-amber-100",
  critical:
    "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-400/30 dark:bg-rose-950/70 dark:text-rose-100",
} as const;

/** The site-wide notice set in /console/flags. Not shown inside the console itself. */
export function MaintenanceBanner() {
  const { maintenance } = usePlatformStatus();
  const pathname = usePathname();
  if (!maintenance.enabled || !maintenance.message || pathname?.startsWith("/console")) return null;
  return (
    <div
      role="status"
      className={`no-print relative z-40 border-b px-4 py-2.5 text-center text-xs font-semibold ${TONES[maintenance.tone]}`}
    >
      <InfoCircleIcon className="mr-1.5 inline h-4 w-4 align-[-3px]" aria-hidden />
      {maintenance.message}
    </div>
  );
}

/** Renders children unless the console has switched this feature off. */
export function FeatureGate({
  flag,
  name,
  children,
}: {
  flag: FeatureFlag;
  name: string;
  children: React.ReactNode;
}) {
  const { flags } = usePlatformStatus();
  if (flags[flag] !== false) return <>{children}</>;
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[var(--background)] px-4 py-16 text-slate-900 dark:text-white">
      <div className="w-full max-w-md rounded-panel border border-white/75 bg-white/60 p-8 text-center shadow-[var(--shadow-raised)] dark:border-white/10 dark:bg-surface-panel/80">
        <h1 className="text-xl font-bold">{name} is switched off for now</h1>
        <p className="mt-2 text-xs text-[var(--ink-muted)]">
          We have paused this feature while we work on it. Everything else on Dynasty Estates is available.
        </p>
        <Link
          href="/search"
          className="pill-lg mt-6 inline-flex bg-[var(--brand)] font-bold text-[var(--ink-inverse)] hover:bg-[var(--brand-hover)]"
        >
          Search homes instead
        </Link>
      </div>
    </main>
  );
}
