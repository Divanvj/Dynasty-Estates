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

// Cards are solid now (REDESIGN-PLAN.md, "D · Petrol"): a white or charcoal
// surface, a hairline and a soft shadow — no frosted glass over the page.
export const panelClass =
  "rounded-card border border-[var(--dash-line)] bg-[var(--dash-card)] p-5 shadow-[var(--dash-shadow)] md:p-6";

export const rowClass =
  "rounded-2xl border border-[var(--dash-line)] bg-[var(--dash-card-2)] p-3.5";

export const linkClass =
  "font-semibold text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-300";

export const secondaryButtonClass =
  "pill max-lg:min-h-11 border border-[var(--dash-line-2)] bg-[var(--dash-card)] font-semibold text-slate-800 hover:bg-[var(--dash-card-2)] disabled:opacity-60 dark:text-slate-200";

// Petrol in light (the statement card's own deep teal-obsidian), muted sea-glass in dark.
export const primaryButtonClass =
  "pill max-lg:min-h-11 bg-[var(--dash-hero-solid)] font-semibold text-white shadow-sm hover:bg-[var(--dash-d1)] disabled:opacity-60 dark:bg-emerald-700 dark:hover:bg-emerald-600";

export const errorBoxClass =
  "rounded-control border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200";

/** Needs attention soon (a certificate running out): the Petrol champagne, its one highlight. */
export const attentionBoxClass =
  "rounded-control border border-[var(--dash-accent)]/40 bg-[var(--dash-accent-soft)] p-3.5 text-sm text-slate-800 dark:text-slate-100";

/** Must be dealt with now (a certificate that has expired). */
export const urgentBoxClass =
  "rounded-control border border-[var(--dash-down)]/30 bg-[var(--dash-down-soft)] p-3.5 text-sm text-[var(--dash-down)]";

export const emptyBoxClass =
  "rounded-control border border-dashed border-[var(--dash-line-2)] bg-[var(--dash-card-2)] p-6 text-center text-sm text-slate-600 dark:text-slate-300";

/** A table in a card: the frame, the header row and one body row. */
export const tableFrameClass =
  "overflow-hidden rounded-card border border-[var(--dash-line)] bg-[var(--dash-card)] shadow-[var(--dash-shadow)]";
export const tableHeadClass =
  "border-b border-[var(--dash-line)] bg-[var(--dash-card-2)] text-left text-xs font-semibold uppercase tracking-[0.1em] text-slate-600 dark:text-slate-400";
export const tableRowClass = "border-t border-[var(--dash-line)] first:border-t-0";

/** The search box above a list (label above, icon inside). */
export const searchInputClass =
  "h-11 w-full rounded-xl border border-[var(--dash-line-2)] bg-[var(--dash-card)] pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dash-d1)] dark:text-white dark:placeholder:text-slate-400";

export type SectionLink = { href: string; label: string; exact?: boolean };

/** The tab row under the site header. Links, not buttons: each is a route. */
export function SectionNav({ label, links }: { label: string; links: SectionLink[] }) {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label={label} className="no-print mb-6 -mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
      <ul className="flex gap-1 whitespace-nowrap border-b border-[var(--dash-line-2)]">
        {links.map((link) => {
          const active = link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`-mb-px inline-flex min-h-11 items-center border-b-2 px-3.5 text-sm font-semibold transition-colors ${
                  active
                    ? "border-[var(--dash-d1)] text-slate-900 dark:text-white"
                    : "border-transparent text-slate-600 hover:border-[var(--dash-line-2)] hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
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
    <div className="rounded-card border border-[var(--dash-line)] bg-[var(--dash-card)] p-5 shadow-[var(--dash-shadow)]">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold tabular-nums tracking-[-0.03em] text-slate-900 dark:text-white">{value ?? "–"}</p>
      {detail ? <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{detail}</p> : null}
    </div>
  );
}

/** "▲ 18%" / "▼ 6%" against the previous period. The only place green and red appear. */
export function Delta({ now, before, unit = "%" }: { now: number; before: number; unit?: "%" | "count" }) {
  if (before === 0 && now === 0) return null;
  const diff = now - before;
  if (diff === 0) {
    return <span className="rounded-full bg-[var(--dash-track)] px-2 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">No change</span>;
  }
  const up = diff > 0;
  const text = unit === "count" || before === 0 ? `${up ? "+" : "−"}${Math.abs(diff)}` : `${Math.round((Math.abs(diff) / before) * 100)}%`;
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
        up ? "bg-[var(--dash-up-soft)] text-[var(--dash-up)]" : "bg-[var(--dash-down-soft)] text-[var(--dash-down)]"
      }`}
    >
      <span aria-hidden="true">{up ? "▲" : "▼"}</span>
      <span className="sr-only">{up ? "Up" : "Down"} </span>
      {text}
    </span>
  );
}

/**
 * A KPI with its trend: label, the figure, the change against the previous
 * period and a small line of the period's daily values. `value` null = still
 * loading (a dash, never 0).
 */
export function KpiCard({
  label,
  value,
  delta,
  trend,
  detail,
}: {
  label: string;
  value: string | null;
  delta?: ReactNode;
  trend?: ReactNode;
  detail?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-card border border-[var(--dash-line)] bg-[var(--dash-card)] p-5 shadow-[var(--dash-shadow)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-400">{label}</p>
        {delta}
      </div>
      <p className="mt-2.5 text-[2.125rem] font-semibold leading-none tabular-nums tracking-[-0.04em] text-slate-900 dark:text-white">{value ?? "–"}</p>
      {trend ? <div className="mt-4">{trend}</div> : null}
      {detail ? <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{detail}</p> : null}
    </div>
  );
}

/**
 * The statement card at the top of a dashboard: Petrol (deep teal fading into
 * obsidian) in both themes. A real listing photo, when there is one, sits on
 * the right and fades into the card; `spot` floats over it.
 */
export function StatementCard({
  eyebrow,
  title,
  lead,
  actions,
  photo,
  spot,
  className = "",
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  photo?: { src: string; alt: string } | null;
  spot?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`relative isolate flex min-h-[280px] flex-col overflow-hidden rounded-[24px] border border-[var(--dash-hero-line)] text-[var(--dash-hero-ink)] shadow-[var(--dash-shadow)] [background:var(--dash-hero)] md:flex-row ${className}`}>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- listing photos come from Storage URLs of any size
        <img
          src={photo.src}
          alt={photo.alt}
          className="h-48 w-full object-cover [mask-image:linear-gradient(0deg,transparent,#000_45%)] md:absolute md:inset-y-0 md:right-0 md:h-full md:w-[62%] md:[mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.4)_22%,#000_55%)]"
        />
      ) : null}
      <div className="relative z-10 flex flex-1 flex-col justify-between gap-6 p-6 md:max-w-[58%] md:p-7">
        <div>
          <p className="text-xs tracking-[0.04em] text-[var(--dash-hero-muted)]">{eyebrow}</p>
          <h1 className="mt-1.5 text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.035em]">{title}</h1>
          {lead ? <p className="mt-2.5 max-w-md text-sm text-[var(--dash-hero-muted)] [&_strong]:font-semibold [&_strong]:text-[var(--dash-hero-ink)]">{lead}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {spot ? (
        <div className="relative z-10 mx-5 mb-5 rounded-2xl border border-[var(--dash-hero-line)] bg-[color-mix(in_srgb,var(--dash-hero-solid)_80%,transparent)] p-4 backdrop-blur-md md:absolute md:bottom-5 md:right-5 md:m-0 md:min-w-[250px]">
          {spot}
        </div>
      ) : null}
    </section>
  );
}

/** Buttons on the statement card: a light primary and a quiet outline. */
export const heroPrimaryClass =
  "pill max-lg:min-h-11 bg-[var(--dash-hero-ink)] font-semibold text-[#0c1213] hover:bg-white";
export const heroSecondaryClass =
  "pill max-lg:min-h-11 border border-[var(--dash-hero-line)] bg-white/5 font-semibold text-[var(--dash-hero-ink)] hover:bg-white/10";

/** The dark companion card beside the statement card: one ring, one big figure, three small ones. */
export function RingCard({
  label,
  sub,
  ring,
  figure,
  unit,
  status,
  minis,
}: {
  label: string;
  sub: string;
  ring: ReactNode;
  figure: string;
  unit?: string;
  status?: string;
  minis: { value: string; label: string }[];
}) {
  return (
    <section className="flex flex-col justify-between gap-5 rounded-[24px] border border-[var(--dash-hero-line)] p-6 text-[var(--dash-hero-ink)] shadow-[var(--dash-shadow)] [background:var(--dash-hero)]">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--dash-hero-muted)]">{label}</h2>
        <p className="mt-1 text-xs text-[var(--dash-hero-muted)]">{sub}</p>
      </div>
      <div className="flex items-center gap-5">
        {ring}
        <div>
          <p className="text-[2.75rem] font-semibold leading-none tabular-nums tracking-[-0.04em]">
            {figure}
            {unit ? <span className="ml-0.5 text-lg font-medium text-[var(--dash-hero-muted)]">{unit}</span> : null}
          </p>
          {status ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--dash-hero-muted)]">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--dash-accent)]" />
              {status}
            </p>
          ) : null}
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-3 border-t border-[var(--dash-hero-line)] pt-4">
        {minis.map((m) => (
          <div key={m.label} className="flex flex-col-reverse">
            <dt className="text-xs text-[var(--dash-hero-muted)]">{m.label}</dt>
            <dd className="text-lg font-semibold tabular-nums">{m.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** A dashboard card with a heading row. */
export function DashCard({
  title,
  aside,
  children,
  className = "",
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 rounded-card border border-[var(--dash-line)] bg-[var(--dash-card)] p-5 shadow-[var(--dash-shadow)] md:p-6 ${className}`}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-base font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">{title}</h2>
        {aside ? <div className="text-xs text-slate-600 dark:text-slate-400">{aside}</div> : null}
      </div>
      {children}
    </section>
  );
}

/** "3 h" waiting: rose when late, champagne when getting close, neutral otherwise. */
export function AgeChip({ label, tone = "neutral" }: { label: string; tone?: "late" | "soon" | "neutral" | "good" }) {
  const cls =
    tone === "late"
      ? "bg-[var(--dash-down-soft)] text-[var(--dash-down)]"
      : tone === "soon"
        ? "bg-[var(--dash-accent-soft)] text-[var(--dash-accent-ink)]"
        : tone === "good"
          ? "bg-[var(--dash-up-soft)] text-[var(--dash-up)]"
          : "bg-[var(--dash-track)] text-slate-600 dark:text-slate-300";
  return <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${cls}`}>{label}</span>;
}

/**
 * The figures strip under a page heading: three or four facts in one card,
 * divided by hairlines. `value` null = still loading (a dash, never 0).
 * `tone` "late" marks a figure that needs attention (rose text, and the
 * note says why, so it is never colour alone).
 */
export function SummaryStrip({
  label,
  items,
}: {
  label: string;
  items: { label: string; value: string | null; note?: string; tone?: "late" | "accent" }[];
}) {
  return (
    <section aria-label={label} className="mb-6 rounded-card border border-[var(--dash-line)] bg-[var(--dash-card)] shadow-[var(--dash-shadow)]">
      <dl className={`grid grid-cols-2 ${items.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        {items.map((item, i) => (
          <div
            key={item.label}
            className={`flex min-w-0 flex-col gap-1.5 p-4 md:px-6 md:py-5 ${i % 2 === 1 ? "border-l border-[var(--dash-line)]" : ""} ${
              i >= 2 ? "border-t border-[var(--dash-line)] lg:border-t-0" : ""
            } ${i === 2 ? "lg:border-l" : ""}`}
          >
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-400">{item.label}</dt>
            <dd
              className={`text-[1.75rem] font-semibold leading-none tabular-nums tracking-[-0.035em] ${
                item.tone === "late"
                  ? "text-[var(--dash-down)]"
                  : item.tone === "accent"
                    ? "text-[var(--dash-accent-ink)]"
                    : "text-slate-900 dark:text-white"
              }`}
            >
              {item.value ?? "–"}
            </dd>
            {item.note ? <dd className="text-xs text-slate-600 dark:text-slate-400">{item.note}</dd> : null}
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Two-letter initials in a soft teal disc, for people in lists. */
export function Initials({ name, size = 40 }: { name: string; size?: number }) {
  const letters =
    name
      .replace(/[^\p{L}\s]/gu, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "?";
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--dash-d3)_55%,var(--dash-card))] font-semibold tracking-wide text-[var(--dash-d1)] ring-1 ring-[var(--dash-line)] dark:bg-[color-mix(in_srgb,var(--dash-d2)_35%,var(--dash-card))]"
    >
      {letters}
    </span>
  );
}

/** A listing's cover photo at thumbnail size; a Petrol tile when there is none. */
export function ListingThumb({ src, className = "h-11 w-16" }: { src?: string | null; className?: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- Storage URLs of any size
    <img src={src} alt="" className={`${className} shrink-0 rounded-lg border border-[var(--dash-line)] object-cover`} />
  ) : (
    <span aria-hidden="true" className={`${className} shrink-0 rounded-lg border border-[var(--dash-line)] [background:var(--dash-hero)]`} />
  );
}

/** Tone of a listing status chip: rose when the owner must act, champagne while it moves, green when live. */
export function listingStatusTone(status: string): "late" | "soon" | "neutral" | "good" {
  if (status === "Needs changes" || status === "Rejected") return "late";
  if (status === "Submitted" || status === "Under offer") return "soon";
  if (status === "Published") return "good";
  return "neutral";
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
    <div role="group" aria-label={label} className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${
              active
                ? "border-[var(--dash-d1)] bg-[var(--dash-d1)] text-white dark:text-[#0b0e0f]"
                : "border-[var(--dash-line-2)] bg-[var(--dash-card)] text-slate-700 hover:border-[var(--dash-d2)] dark:text-slate-300"
            }`}
          >
            {option.label}
            {option.count !== undefined ? (
              <span
                className={`min-w-6 rounded-full px-1.5 text-center text-xs tabular-nums ${
                  active ? "bg-white/20 dark:bg-black/15" : "bg-[var(--dash-track)] text-slate-600 dark:text-slate-300"
                }`}
              >
                {option.count}
              </span>
            ) : null}
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
