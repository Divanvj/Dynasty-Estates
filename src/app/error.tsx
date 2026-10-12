"use client"; // Error boundaries must be Client Components

import Link from "next/link";
import { useEffect } from "react";

/**
 * Catches runtime errors thrown while rendering any route in the app.
 *
 * Data loaders no longer substitute demo data when a Firestore query fails, so a
 * genuine failure now reaches the renderer. Without this boundary a server-side
 * throw becomes a bare 500 — which is what happened to /property/[slug] once the
 * catalogue stopped swallowing its own errors.
 *
 * `retry` re-fetches and re-renders the segment. It replaced `reset` in Next 16.3
 * (`reset` only clears the error state without re-fetching, which is rarely what
 * you want for a failed data load).
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error while rendering a route:", error);
  }, [error]);

  const isPermissionError = /permission|insufficient/i.test(error.message);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-16 text-slate-900 dark:text-white">
      <div className="w-full max-w-lg rounded-[32px] border border-white/75 bg-white/55 p-8 text-center shadow-[0_14px_34px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0c1a1c]/80 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-emerald-400">
          Dynasty Estates
        </p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
          Something went wrong on our side
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-xs text-slate-600 dark:text-slate-300">
          {isPermissionError
            ? "We could not read the property data. This is a configuration problem here, not something you did."
            : "This page could not finish loading. Nothing you did caused it."}
        </p>

        {error.digest ? (
          <p className="mt-4 font-mono text-[10px] text-slate-400 dark:text-slate-500">
            Reference: {error.digest}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => retry()}
            className="cursor-pointer rounded-full bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:from-[#093e3f] hover:to-[#052c2d] dark:hover:from-emerald-500 dark:hover:to-emerald-600"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border border-slate-300/80 bg-white/60 px-6 py-2.5 text-xs font-semibold text-slate-700 transition-all hover:bg-white dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:text-white"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
