"use client";

import Link from "next/link";
import { useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { accountApi, type SavedSearchRow } from "@/lib/account-api";

/**
 * "Save this search" on /search: stores the current filters for the
 * signed-in person, with e-mail alerts on (managed on /alerts). The parent
 * keys it by the query, so changing a filter offers to save the new search.
 */
export default function SaveSearchButton({ query }: { query: string }) {
  const { user, loading } = useAuth();
  const [state, setState] = useState<{ kind: "idle" | "busy" } | { kind: "saved"; search: SavedSearchRow } | { kind: "error"; message: string }>({ kind: "idle" });

  const chip =
    "tap-44 relative inline-flex items-center gap-1.5 rounded-full border border-[var(--dash-line-2)] bg-[var(--dash-card)] px-3 py-1 text-xs font-semibold text-slate-800 transition-colors hover:bg-[var(--dash-card-2)] disabled:opacity-60 dark:text-slate-100";

  if (loading) return null;
  if (!user) {
    return (
      <Link href="/auth/login" className={chip}>
        Sign in to save this search
      </Link>
    );
  }
  if (state.kind === "saved") {
    return (
      <p role="status" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
        Saved, with e-mail alerts.{" "}
        <Link href="/alerts" className="text-emerald-800 underline underline-offset-2 dark:text-emerald-300">
          Manage alerts
        </Link>
      </p>
    );
  }

  async function save() {
    setState({ kind: "busy" });
    try {
      const { search } = await accountApi<{ search: SavedSearchRow }>("/api/saved-searches", { method: "POST", body: { query } });
      setState({ kind: "saved", search });
    } catch (error) {
      setState({ kind: "error", message: (error as Error).message });
    }
  }

  return (
    <>
      <button type="button" onClick={() => void save()} disabled={state.kind === "busy"} className={chip}>
        {state.kind === "busy" ? "Saving…" : "Save this search"}
      </button>
      {state.kind === "error" ? (
        <p role="alert" className="basis-full text-xs text-rose-700 dark:text-rose-300">
          {state.message}
        </p>
      ) : null}
    </>
  );
}
