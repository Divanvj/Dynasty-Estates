"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Shared pieces for the agent console and the admin pages: the section tab
 * row, page heading, stat tile, panel frame and a named confirmation dialog.
 * See docs/dashboards/PLAN.md — every route under /agent and /admin is one
 * page pattern, and these keep their chrome identical.
 */

export const panelClass =
  "rounded-panel border border-white/45 bg-white/40 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6 dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]";

export const rowClass =
  "rounded-control border border-slate-200 bg-[#f4f7f7] p-3.5 dark:border-white/10 dark:bg-surface-ink/70";

export const linkClass =
  "font-semibold text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-300";

export const secondaryButtonClass =
  "pill max-lg:min-h-11 border border-slate-300 bg-white/80 font-semibold text-slate-800 hover:bg-white disabled:opacity-60 dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-200 dark:hover:bg-white/10";

export const primaryButtonClass =
  "pill max-lg:min-h-11 bg-slate-900 font-semibold text-white shadow-md hover:bg-slate-800 disabled:opacity-60 dark:bg-emerald-700 dark:hover:bg-emerald-800";

export const errorBoxClass =
  "rounded-control border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200";

export const emptyBoxClass =
  "rounded-control border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 dark:border-white/15 dark:text-slate-300";

export type SectionLink = { href: string; label: string; exact?: boolean };

/** The tab row under the site header. Links, not buttons: each is a route. */
export function SectionNav({ label, links }: { label: string; links: SectionLink[] }) {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label={label} className="mb-6 -mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
      <ul className="flex gap-2 whitespace-nowrap">
        {links.map((link) => {
          const active = link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-2xl px-4 text-sm font-semibold ${
                  active
                    ? "border border-slate-950 bg-slate-950 text-white dark:border-emerald-500/50 dark:bg-emerald-700"
                    : "border border-white/70 bg-white/45 text-slate-700 hover:bg-white/75 dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300 dark:hover:bg-surface-panel dark:hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function PageHeading({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-900 md:text-4xl dark:text-white">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{description}</p>
      </div>
      {action}
    </div>
  );
}

/** One KPI. `value` null = still loading (shown as a dash, never as 0). */
export function StatTile({ label, value, detail }: { label: string; value: string | null; detail?: string }) {
  return (
    <div className="rounded-card border border-white/45 bg-white/40 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-900 dark:text-white">{value ?? "–"}</p>
      {detail ? <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{detail}</p> : null}
    </div>
  );
}

/** Filter chips for an inbox: one is always selected; announces the selection. */
export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="mb-4 flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-semibold ${
              active
                ? "border-slate-900 bg-slate-900 text-white dark:border-emerald-500/50 dark:bg-emerald-700"
                : "border-slate-300 bg-white/70 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300 dark:hover:bg-white/10"
            }`}
          >
            {option.label}
            {option.count !== undefined ? <span className="tabular-nums opacity-80">{option.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/** "3 min", "5 h", "2 d" since a moment. */
export function formatAge(from: Date, now: number = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - from.getTime()) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

/**
 * Confirmation for a destructive action. Names the thing in the title, the
 * confirm button carries the destructive verb, Cancel has focus on open and
 * Escape cancels (native <dialog>, so it sits in the top layer above the
 * header and restores focus to the trigger on close).
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Escape is handled on the key itself (below), so cancelling never depends
  // on the dialog's async `close` event; that event is still caught for any
  // other way the browser closes it, so `open` can't get stuck at true.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handle = () => onCancelRef.current();
    dialog.addEventListener("close", handle);
    return () => dialog.removeEventListener("close", handle);
  }, []);

  return (
    <dialog
      ref={ref}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
        }
      }}
      aria-labelledby="confirm-dialog-title"
      className="m-auto w-[min(480px,calc(100vw-32px))] rounded-card border border-white/70 bg-white p-0 text-slate-900 shadow-[0_30px_80px_rgba(15,23,42,0.35)] backdrop:bg-slate-950/55 dark:border-white/10 dark:bg-[#0d1b1d] dark:text-white"
    >
      {open ? (
        <div className="p-6">
          <h2 id="confirm-dialog-title" className="text-lg font-semibold tracking-tight">{title}</h2>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{body}</div>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button ref={cancelRef} type="button" onClick={onCancel} className={secondaryButtonClass}>
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onConfirm}
              className="pill max-lg:min-h-11 bg-rose-700 font-semibold text-white hover:bg-rose-800 disabled:opacity-60"
            >
              {busy ? "Working…" : confirmLabel}
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
