"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { errorBoxClass, linkClass, panelClass, primaryButtonClass } from "@/components/dashboard-ui";
import { EMAIL_PREFS, isEmailPref } from "@/lib/email-prefs";

// Pattern: Form (one confirm button). Opened from "Stop these e-mails" at the
// foot of an e-mail. It asks first, because mail scanners open links: only
// the button (or a mail app's one-click POST) turns anything off. The token is
// checked on the server; here it only names the kind of e-mail.

function Unsubscribe() {
  const token = useSearchParams()?.get("t") ?? "";
  const pref = token.split(".")[1];
  const label = isEmailPref(pref) ? EMAIL_PREFS[pref].label : null;
  const [state, setState] = useState<{ kind: "idle" | "busy" | "done" } | { kind: "error"; message: string }>({ kind: "idle" });

  async function stop() {
    setState({ kind: "busy" });
    try {
      const response = await fetch("/api/email/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: token }) });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "That didn't save. Try again in a moment.");
      setState({ kind: "done" });
    } catch (error) {
      setState({ kind: "error", message: (error as Error).message });
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-12 text-slate-900 dark:text-white">
      <div className={`${panelClass} mx-auto max-w-lg`}>
        {!label ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">This link isn&apos;t complete</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Open it again from the e-mail, or choose your e-mails on the{" "}
              <Link href="/alerts" className={linkClass}>
                Alerts page
              </Link>
              .
            </p>
          </>
        ) : state.kind === "done" ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Stopped</h1>
            <p role="status" className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              You won&apos;t get “{label}” e-mails any more. To turn them back on, or change others, sign in and open{" "}
              <Link href="/alerts" className={linkClass}>
                Alerts &amp; e-mails
              </Link>
              .
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Stop “{label}” e-mails?</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{EMAIL_PREFS[pref as keyof typeof EMAIL_PREFS].description}</p>
            {state.kind === "error" ? (
              <p role="alert" className={`${errorBoxClass} mt-4`}>
                {state.message}
              </p>
            ) : null}
            <button type="button" onClick={() => void stop()} disabled={state.kind === "busy"} className={`${primaryButtonClass} mt-5`}>
              {state.kind === "busy" ? "Stopping…" : "Stop these e-mails"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={null}>
      <Unsubscribe />
    </Suspense>
  );
}
