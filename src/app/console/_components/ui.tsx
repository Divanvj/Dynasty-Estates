"use client";

import Link from "next/link";

import type { ConsoleRequestError } from "../_lib/console-client";
import { AlertIcon, ChevronRightIcon, CircleCheckIcon, LockSmallIcon, RefreshIcon } from "./console-icons";

/*
  The console's component vocabulary. One shape for every panel, one button
  family, one badge family, so each page reads as part of the same tool.
  Always rendered under `.dark` (the shell sets it), so these use the dark ink
  tokens from globals.css directly.
*/

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------- layout

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-[-0.01em] text-[var(--ink)] text-balance">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-[68ch] text-xs leading-relaxed text-[var(--ink-subtle)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  id,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cx(
        "rounded-2xl border border-white/[0.07] bg-[#0a1517] shadow-[0_1px_2px_rgb(0_0_0/0.4),0_12px_32px_-18px_rgb(0_0_0/0.8)]",
        className,
      )}
    >
      {title || actions ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="min-w-0">
            {title ? <h2 className="text-base font-semibold text-[var(--ink)]">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-xs text-[var(--ink-subtle)]">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cx("px-5 py-4", bodyClassName)}>{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------- numbers

export function Delta({ current, previous, invert = false }: { current: number; previous: number | null; invert?: boolean }) {
  if (previous === null) {
    return <span className="text-xs text-[var(--ink-subtle)]">no earlier figure</span>;
  }
  if (previous === 0 && current === 0) {
    return <span className="text-xs text-[var(--ink-subtle)]">same as before</span>;
  }
  const up = current > previous;
  const flat = current === previous;
  const label =
    previous === 0 ? `+${current} new` : `${up ? "+" : ""}${Math.round(((current - previous) / previous) * 100)}%`;
  // For errors, up is bad: `invert` swaps the colours, never the arrow.
  const good = flat ? null : invert ? !up : up;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        good === null && "bg-white/[0.06] text-[var(--ink-muted)]",
        good === true && "bg-emerald-400/10 text-emerald-300",
        good === false && "bg-rose-400/10 text-rose-300",
      )}
      title={`Previous period: ${previous}`}
    >
      {flat ? "±0" : label}
      <span className="sr-only"> compared with {previous} in the period before</span>
    </span>
  );
}

export function StatTile({
  label,
  value,
  sub,
  href,
  icon,
  tone = "neutral",
  footer,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  href?: string;
  icon?: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad";
  footer?: React.ReactNode;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs font-medium text-[var(--ink-muted)]">
          {icon ? <span className="text-[var(--ink-subtle)]">{icon}</span> : null}
          {label}
        </span>
        {tone !== "neutral" ? (
          <span
            className={cx(
              "h-2 w-2 rounded-full",
              tone === "good" && "bg-emerald-400",
              tone === "warn" && "bg-amber-300",
              tone === "bad" && "bg-rose-400",
            )}
            aria-hidden
          />
        ) : null}
      </div>
      <div className="mt-3 text-[1.75rem] font-semibold leading-none tracking-[-0.02em] text-[var(--ink)] tabular-nums">
        {value}
      </div>
      {sub ? <div className="mt-2 text-xs leading-snug text-[var(--ink-subtle)]">{sub}</div> : null}
      {footer ? <div className="mt-3">{footer}</div> : null}
    </>
  );
  const shell =
    "block rounded-2xl border border-white/[0.07] bg-[#0a1517] p-4 shadow-[0_1px_2px_rgb(0_0_0/0.4)] transition-colors duration-200";
  return href ? (
    <Link href={href} className={cx(shell, "hover:border-[var(--brand)]/40 hover:bg-[#0c1a1c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]")}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  );
}

/** Label / value rows. */
export function Facts({ rows }: { rows: Array<[React.ReactNode, React.ReactNode]> }) {
  return (
    <dl className="divide-y divide-white/[0.05]">
      {rows.map(([k, v], i) => (
        <div key={i} className="flex items-baseline justify-between gap-4 py-2 text-xs">
          <dt className="text-[var(--ink-subtle)]">{k}</dt>
          <dd className="min-w-0 text-right font-medium text-[var(--ink)] tabular-nums break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

// ---------------------------------------------------------------- state

export type State = "ok" | "warning" | "error" | "blocked" | "unknown";

const STATE_STYLE: Record<State, { label: string; className: string }> = {
  ok: { label: "OK", className: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20" },
  warning: { label: "Attention", className: "bg-amber-300/10 text-amber-200 ring-amber-300/25" },
  error: { label: "Problem", className: "bg-rose-400/10 text-rose-300 ring-rose-400/25" },
  blocked: { label: "Blocked", className: "bg-violet-400/10 text-violet-200 ring-violet-400/25" },
  unknown: { label: "Unknown", className: "bg-white/[0.05] text-[var(--ink-muted)] ring-white/10" },
};

export function StateBadge({ state, label }: { state: State; label?: string }) {
  const style = STATE_STYLE[state];
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset", style.className)}>
      {state === "ok" ? <CircleCheckIcon className="h-3.5 w-3.5" /> : state === "blocked" ? <LockSmallIcon className="h-3.5 w-3.5" /> : state === "unknown" ? null : <AlertIcon className="h-3.5 w-3.5" />}
      {label ?? style.label}
    </span>
  );
}

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "brand" | "warn" | "bad" | "good" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium",
        tone === "neutral" && "bg-white/[0.06] text-[var(--ink-muted)]",
        tone === "brand" && "bg-[var(--brand-quiet)] text-[var(--brand)]",
        tone === "warn" && "bg-amber-300/10 text-amber-200",
        tone === "bad" && "bg-rose-400/10 text-rose-300",
        tone === "good" && "bg-emerald-400/10 text-emerald-300",
      )}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------- controls

export function Button({
  children,
  variant = "secondary",
  loading = false,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        "inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg px-3.5 text-xs font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-[var(--brand)] text-[#04201b] hover:bg-[var(--brand-hover)]",
        variant === "secondary" && "border border-white/10 bg-white/[0.04] text-[var(--ink)] hover:bg-white/[0.08]",
        variant === "ghost" && "text-[var(--ink-muted)] hover:bg-white/[0.06] hover:text-[var(--ink)]",
        variant === "danger" && "border border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20",
        className,
      )}
    >
      {loading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function RefreshButton({ onClick, loading, loadedAt }: { onClick: () => void; loading: boolean; loadedAt?: number | null }) {
  return (
    <Button onClick={onClick} loading={loading} title={loadedAt ? `Loaded ${new Date(loadedAt).toLocaleTimeString("en-ZA")}` : undefined}>
      {loading ? null : <RefreshIcon className="h-3.5 w-3.5" />}
      Refresh
    </Button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cx(
              "min-h-8 cursor-pointer rounded-md px-3 text-xs font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand)]",
              active ? "bg-white/[0.1] text-[var(--ink)]" : "text-[var(--ink-subtle)] hover:text-[var(--ink)]",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- loading / errors / empty

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-lg bg-white/[0.05]", className)} aria-hidden />;
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2.5" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-9" />
      ))}
    </div>
  );
}

export function ErrorNotice({ error, onRetry }: { error: ConsoleRequestError; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-rose-400/25 bg-rose-500/[0.07] p-5">
      <div className="flex items-start gap-3">
        <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-rose-100">
            {error.notConnected ? "The console is not connected to Firebase" : "This could not be loaded"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-rose-200/90 break-words">{error.message}</p>
          {error.notConnected ? (
            <p className="mt-2 text-xs leading-relaxed text-rose-200/90">
              On Vercel, add the service-account key JSON as <code className="font-mono">FIREBASE_SERVICE_ACCOUNT</code> and
              redeploy. Locally, set <code className="font-mono">FIREBASE_SERVICE_ACCOUNT_PATH</code> in .env.local.
            </p>
          ) : null}
        </div>
        {onRetry ? (
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 px-5 py-8 text-center">
      <p className="text-sm font-semibold text-[var(--ink)]">{title}</p>
      {children ? <div className="mx-auto mt-1.5 max-w-[56ch] text-xs leading-relaxed text-[var(--ink-subtle)]">{children}</div> : null}
    </div>
  );
}

export function RowLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)] underline-offset-4 hover:underline"
    >
      {children}
      <ChevronRightIcon className="h-3.5 w-3.5" />
    </Link>
  );
}
