"use client";

import Link from "next/link";
import { useId, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { createSupportRequest } from "@/lib/support-requests";

/**
 * "Request this package / plan".
 *
 * There is no online payment yet, so a request is filed in `support_requests`
 * with the package spelled out, and the Dynasty team reads it on /admin and
 * invoices by hand. The button says exactly that rather than pretending to
 * check out. No email is sent: there is no mail service yet.
 *
 * Inline, not a modal: two fields do not need to take over the page.
 */
export default function PackageRequestButton({
  summary,
  priceLabel,
  label = "Request this package",
  primary = false,
}: {
  /** The package as the admin should read it, e.g. "Sell 90 · 90 days · R 799 incl. VAT". */
  summary: string;
  /** What the invoice will be for, e.g. "R 799 incl. VAT" or "R 399 a month excl. VAT". */
  priceLabel: string;
  label?: string;
  primary?: boolean;
}) {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const panelId = useId();
  const noteId = useId();

  const buttonClass = primary
    ? "pill w-full bg-slate-900 font-semibold text-white hover:bg-slate-800 dark:bg-emerald-700 dark:hover:bg-emerald-800"
    : "pill w-full border border-slate-300 bg-white/70 font-semibold text-slate-900 hover:bg-white dark:border-white/15 dark:bg-surface-ink/60 dark:text-white dark:hover:bg-white/10";

  if (state === "sent") {
    return (
      <p role="status" className="rounded-control border border-emerald-300/60 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200">
        Request sent. We&rsquo;ll email an invoice to {user?.email ?? "you"}.
      </p>
    );
  }

  if (!loading && !user) {
    return (
      <Link href="/auth/login" className={buttonClass}>
        Sign in to request
      </Link>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setState("sending");
    try {
      const extra = note.trim();
      await createSupportRequest({
        userId: user.uid,
        userEmail: user.email,
        message: `Package request: ${summary}${extra ? `\n\n${extra}` : ""}`,
      });
      setState("sent");
    } catch {
      setState("error");
    }
  }

  return (
    <div>
      <button
        type="button"
        className={buttonClass}
        aria-expanded={open}
        aria-controls={panelId}
        disabled={loading}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
      </button>

      {open && (
        <form id={panelId} onSubmit={submit} className="mt-3 space-y-2">
          <label htmlFor={noteId} className="block text-sm font-medium text-slate-800 dark:text-slate-200">
            Anything we should know? <span className="font-normal text-slate-600 dark:text-slate-400">(optional)</span>
          </label>
          <textarea
            id={noteId}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={1000}
            rows={2}
            placeholder="The address, or a VAT number for the invoice"
            className="w-full rounded-control border border-slate-300 bg-white p-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-white/15 dark:bg-surface-ink dark:text-white dark:placeholder:text-slate-400"
          />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Payment isn&rsquo;t online yet. We&rsquo;ll email you an invoice for {priceLabel}.
          </p>
          {state === "error" && (
            <p role="alert" className="text-sm text-rose-800 dark:text-rose-300">
              Your request couldn&rsquo;t be sent. Check your connection and try again.
            </p>
          )}
          <button
            type="submit"
            disabled={state === "sending"}
            className="pill w-full bg-slate-900 font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-emerald-700 dark:hover:bg-emerald-800"
          >
            {state === "sending" ? "Sending…" : "Send request"}
          </button>
        </form>
      )}
    </div>
  );
}
