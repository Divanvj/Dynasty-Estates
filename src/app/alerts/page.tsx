"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { ConfirmDialog, emptyBoxClass, errorBoxClass, linkClass, PageHeading, panelClass, primaryButtonClass, secondaryButtonClass } from "@/components/dashboard-ui";
import { accountApi, type SavedSearchRow } from "@/lib/account-api";
import { EMAIL_PREFS, type EmailPref, type EmailPrefs } from "@/lib/email-prefs";
import { formatDate } from "@/lib/formatters";
import { useAuthHref } from "@/lib/use-return-path";

// Pattern: Settings. Two sections on one page: the searches a person saved
// (each with its own alert switch) and which e-mails the site may send them.
// Both live server-side (/api/saved-searches, /api/email/preferences).

function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-11 w-14 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dash-d1)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {/* The knob sits in the track's flow and slides with transform only. */}
      <span
        aria-hidden="true"
        data-switch-track=""
        className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors duration-200 ${checked ? "bg-[var(--dash-hero-solid)] dark:bg-emerald-600" : "bg-slate-300 dark:bg-white/20"}`}
      >
        <span
          data-switch-knob=""
          className={`block h-5 w-5 shrink-0 rounded-full bg-white shadow transition-transform duration-200 motion-reduce:transition-none ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </span>
    </button>
  );
}

type Load<T> = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; value: T };

export default function AlertsPage() {
  // Sign-in returns to this page (S1-7).
  const signInHref = useAuthHref();
  const { user, loading } = useAuth();
  const [searches, setSearches] = useState<Load<SavedSearchRow[]>>({ kind: "loading" });
  const [prefs, setPrefs] = useState<Load<EmailPrefs>>({ kind: "loading" });
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SavedSearchRow | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    accountApi<{ searches: SavedSearchRow[] }>("/api/saved-searches")
      .then((r) => !cancelled && setSearches({ kind: "ready", value: r.searches }))
      .catch((e: Error) => !cancelled && setSearches({ kind: "error", message: e.message }));
    accountApi<{ prefs: EmailPrefs }>("/api/email/preferences")
      .then((r) => !cancelled && setPrefs({ kind: "ready", value: r.prefs }))
      .catch((e: Error) => !cancelled && setPrefs({ kind: "error", message: e.message }));
    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  async function setAlerts(search: SavedSearchRow, alerts: boolean) {
    if (searches.kind !== "ready") return;
    setBusy(search.id);
    setNotice(null);
    try {
      await accountApi("/api/saved-searches", { method: "PATCH", body: { id: search.id, alerts } });
      setSearches({ kind: "ready", value: searches.value.map((s) => (s.id === search.id ? { ...s, alerts } : s)) });
    } catch (e) {
      setNotice({ tone: "error", text: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  async function remove(search: SavedSearchRow) {
    if (searches.kind !== "ready") return;
    setBusy(search.id);
    setNotice(null);
    try {
      await accountApi("/api/saved-searches", { method: "DELETE", body: { id: search.id } });
      setSearches({ kind: "ready", value: searches.value.filter((s) => s.id !== search.id) });
      setNotice({ tone: "ok", text: `Deleted “${search.label}”.` });
    } catch (e) {
      setNotice({ tone: "error", text: (e as Error).message });
    } finally {
      setBusy(null);
      setConfirmDelete(null);
    }
  }

  async function setPref(pref: EmailPref, value: boolean) {
    if (prefs.kind !== "ready") return;
    setBusy(pref);
    setNotice(null);
    try {
      const r = await accountApi<{ prefs: EmailPrefs }>("/api/email/preferences", { method: "POST", body: { [pref]: value } });
      setPrefs({ kind: "ready", value: r.prefs });
    } catch (e) {
      setNotice({ tone: "error", text: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  const shell = (children: React.ReactNode) => (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-slate-900 md:px-8 dark:text-white">
      <div className="mx-auto max-w-3xl">
        <PageHeading title="Alerts & e-mails" description="Searches you saved, and which e-mails Dynasty Estates sends you." />
        {children}
      </div>
    </main>
  );

  if (loading) return shell(<p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading…</p>);
  if (!user) {
    return shell(
      <div className={emptyBoxClass}>
        <p>Sign in to save searches and choose your e-mails.</p>
        <Link href={signInHref} className={`${primaryButtonClass} mt-4 inline-flex`}>
          Sign in
        </Link>
      </div>,
    );
  }

  return shell(
    <div className="space-y-6">
      {notice ? (
        <p role={notice.tone === "error" ? "alert" : "status"} className={notice.tone === "error" ? errorBoxClass : "text-sm text-slate-700 dark:text-slate-200"}>
          {notice.text}
        </p>
      ) : null}

      <section aria-labelledby="searches-heading" className={panelClass}>
        <h2 id="searches-heading" className="text-xl font-semibold text-slate-900 dark:text-white">Saved searches</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          With alerts on, we e-mail you new homes that match, at most once a day. Save a search with <span className="font-semibold">Save this search</span> on the{" "}
          <Link href="/search?intent=buy" className={linkClass}>
            search page
          </Link>
          .
        </p>
        <div className="mt-4">
          {searches.kind === "loading" ? <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading your searches…</p> : null}
          {searches.kind === "error" ? <p role="alert" className={errorBoxClass}>{searches.message}</p> : null}
          {searches.kind === "ready" && searches.value.length === 0 ? (
            <div className={emptyBoxClass}>
              <p>No saved searches yet.</p>
              <Link href="/search?intent=buy" className={`${secondaryButtonClass} mt-3 inline-flex`}>
                Start a search
              </Link>
            </div>
          ) : null}
          {searches.kind === "ready" && searches.value.length > 0 ? (
            <ul className="divide-y divide-[var(--dash-line)]">
              {searches.value.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                  {/* Full width on phones, so the name isn't squeezed beside the controls. */}
                  <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
                    <Link href={`/search?${s.query}`} className={`${linkClass} text-base`}>
                      {s.label}
                    </Link>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Saved {formatDate(s.createdAt)}
                      {s.lastAlertAt ? ` · last alert ${formatDate(s.lastAlertAt)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-slate-700 dark:text-slate-200">
                    <span aria-hidden="true">Alerts</span>
                    <Switch checked={s.alerts} disabled={busy === s.id} onChange={(v) => void setAlerts(s, v)} label={`E-mail alerts for ${s.label}`} />
                  </div>
                  <button type="button" disabled={busy === s.id} onClick={() => setConfirmDelete(s)} className={secondaryButtonClass}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="emails-heading" className={panelClass}>
        <h2 id="emails-heading" className="text-xl font-semibold text-slate-900 dark:text-white">E-mails</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Account e-mails, like agency invitations, always go out. Every other e-mail has a link at the bottom to stop it.
        </p>
        {prefs.kind === "loading" ? <p role="status" className="mt-4 text-sm text-slate-600 dark:text-slate-300">Loading your e-mail settings…</p> : null}
        {prefs.kind === "error" ? <p role="alert" className={`${errorBoxClass} mt-4`}>{prefs.message}</p> : null}
        {prefs.kind === "ready" ? (
          <ul className="mt-2 divide-y divide-[var(--dash-line)]">
            {(Object.keys(EMAIL_PREFS) as EmailPref[]).map((pref) => (
              <li key={pref} className="flex items-center gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">{EMAIL_PREFS[pref].label}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{EMAIL_PREFS[pref].description}</p>
                </div>
                <Switch checked={prefs.value[pref]} disabled={busy === pref} onChange={(v) => void setPref(pref, v)} label={EMAIL_PREFS[pref].label} />
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <ConfirmDialog
        open={confirmDelete !== null}
        title={`Delete “${confirmDelete?.label ?? ""}”?`}
        body="Its alerts stop too. You can save the search again from the search page."
        confirmLabel="Delete search"
        busy={busy === confirmDelete?.id}
        onConfirm={() => confirmDelete && void remove(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>,
  );
}
