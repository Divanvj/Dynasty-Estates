"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";

/**
 * Where Firebase's verification page sends people after they confirm their
 * e-mail address (lib/server/email-verification.ts). The confirming itself
 * already happened there; this page re-reads the account so the rest of the
 * site sees it as confirmed straight away.
 */
export default function EmailVerifiedPage() {
  const { user, loading } = useAuth();
  const [state, setState] = useState<"checking" | "confirmed" | "not_yet">("checking");

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    user
      .reload()
      .then(() => user.getIdToken(true))
      .then(() => {
        if (!cancelled) setState(user.emailVerified ? "confirmed" : "not_yet");
      })
      .catch(() => {
        if (!cancelled) setState("not_yet");
      });
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  const signedOut = !loading && !user;
  const heading = signedOut || state === "confirmed" ? "Your e-mail address is confirmed" : state === "checking" ? "Checking…" : "Not confirmed yet";
  const body = signedOut
    ? "Thanks. Sign in to carry on where you left off."
    : state === "confirmed"
      ? "Thanks. Agents and sellers can now reach you, and your alerts will arrive."
      : state === "checking"
        ? "One moment while we check your account."
        : "This account still shows as unconfirmed. Open the newest link we e-mailed you, or ask for a new one from the banner at the top of any page.";

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[var(--background)] px-4 py-16 text-slate-900 dark:text-white">
      <div className="w-full max-w-md rounded-panel border border-white/75 bg-white/60 p-8 text-center shadow-[var(--shadow-raised)] dark:border-white/10 dark:bg-surface-panel/80">
        <h1 className="text-xl font-bold">{heading}</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]" aria-live="polite">
          {body}
        </p>
        <Link
          href={signedOut ? "/auth/login" : "/search"}
          className="pill-lg mt-6 inline-flex bg-[var(--brand)] font-bold text-[var(--ink-inverse)] hover:bg-[var(--brand-hover)]"
        >
          {signedOut ? "Sign in" : "Browse homes"}
        </Link>
      </div>
    </main>
  );
}
