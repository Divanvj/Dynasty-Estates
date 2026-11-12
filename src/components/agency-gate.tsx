"use client";

import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";

import type { AgencyLoad } from "@/components/agency-team";
import { errorBoxClass, linkClass, panelClass, primaryButtonClass } from "@/components/dashboard-ui";
import { usePractitioner } from "@/components/practitioner-profile";
import { getMemberships, registerAgency, type Agency } from "@/lib/agency";

/**
 * What an /agency page shows before its content (PLAN.md Phase G):
 * loading / error, a member's pointer to their agency, the registration form
 * for a verified agent, or what to do first for anyone else. Children render
 * only for the agency's principal.
 */

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none aria-[invalid=true]:border-rose-500 dark:border-white/10 dark:bg-surface-ink dark:text-white";

function RegisterAgency({ uid, onDone }: { uid: string; onDone: () => void }) {
  const [name, setName] = useState("");
  const [firm, setFirm] = useState("");
  const [nameError, setNameError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const nameId = useId();
  const firmId = useId();

  const check = (value: string) => (value.trim().length < 2 ? "Enter the agency's trading name." : "");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const error = check(name);
    setNameError(error);
    if (error) {
      document.getElementById(nameId)?.focus();
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await registerAgency(uid, name, firm);
      onDone();
    } catch (err) {
      console.error("Could not register the agency:", err);
      setSaveError("The agency wasn't registered. Check your connection and try again.");
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="register-heading" className={panelClass}>
      <h2 id="register-heading" className="text-2xl font-semibold text-slate-900 dark:text-white">Register your agency</h2>
      <p className="mt-1 max-w-2xl text-sm text-slate-700 dark:text-slate-300">
        As principal you see every agent&rsquo;s listings, enquiries and reply times in one place, and hand enquiries to the
        right agent. Invite your agents once it is registered.
      </p>
      <form noValidate onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={nameId} className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">Agency name</label>
          <input
            id={nameId}
            value={name}
            maxLength={120}
            autoComplete="organization"
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError("");
            }}
            onBlur={(e) => setNameError(check(e.target.value))}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? `${nameId}-error` : undefined}
            className={inputClass}
          />
          {nameError ? <p id={`${nameId}-error`} className="mt-1 text-sm text-rose-700 dark:text-rose-300">{nameError}</p> : null}
        </div>
        <div>
          <label htmlFor={firmId} className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">PPRA firm number (optional)</label>
          <input id={firmId} value={firm} maxLength={40} onChange={(e) => setFirm(e.target.value)} className={inputClass} aria-describedby={`${firmId}-hint`} />
          <p id={`${firmId}-hint`} className="mt-1 text-xs text-slate-600 dark:text-slate-400">The firm&rsquo;s own FFC number, if it has one.</p>
        </div>
        <div className="sm:col-span-2">
          {saveError ? <p role="alert" className={`mb-3 ${errorBoxClass}`}>{saveError}</p> : null}
          <button type="submit" disabled={saving} className={primaryButtonClass}>{saving ? "Registering…" : "Register agency"}</button>
        </div>
      </form>
    </section>
  );
}

export function AgencyGate({
  uid,
  load,
  reload,
  children,
}: {
  uid: string | null | undefined;
  load: AgencyLoad;
  reload: () => void;
  children: (ready: Extract<AgencyLoad, { state: "ready" }>) => ReactNode;
}) {
  const practitioner = usePractitioner(load.state === "none" ? uid : null);
  const [memberOf, setMemberOf] = useState<{ uid: string; agency: Agency | null } | null | "loading">("loading");

  useEffect(() => {
    if (load.state !== "none" || !uid) return;
    let cancelled = false;
    getMemberships(uid)
      .then((rows) => !cancelled && setMemberOf(rows[0] ? { uid, agency: rows[0].agency } : null))
      .catch(() => !cancelled && setMemberOf(null));
    return () => {
      cancelled = true;
    };
  }, [load.state, uid]);

  if (uid === null) return <p className={errorBoxClass}>Sign in to see your agency.</p>;
  if (load.state === "loading") return <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading the agency…</p>;
  if (load.state === "error") {
    return <p role="alert" className={errorBoxClass}>The agency couldn&rsquo;t be loaded. Check your connection and refresh the page.</p>;
  }
  if (load.state === "ready") return <>{children(load)}</>;

  // No agency of their own.
  if (memberOf === "loading" || practitioner.load.state === "loading") {
    return <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading…</p>;
  }
  if (memberOf) {
    return (
      <p className={`${panelClass} text-sm text-slate-700 dark:text-slate-300`}>
        You&rsquo;re an agent at <strong className="text-slate-900 dark:text-white">{memberOf.agency?.name ?? "an agency"}</strong>. Only the
        principal sees the agency view; your own work is in the <Link href="/agent/dashboard" className={linkClass}>agent console</Link>.
        Manage your membership on your <Link href="/agent/profile" className={linkClass}>profile</Link>.
      </p>
    );
  }
  const verified = practitioner.load.state === "ready" && practitioner.load.record?.status === "verified";
  if (!verified || !uid) {
    return (
      <p className={`${panelClass} text-sm text-slate-700 dark:text-slate-300`}>
        Registering an agency needs a Fidelity Fund Certificate that Dynasty has verified.{" "}
        <Link href="/agent/profile" className={linkClass}>File or check yours on your profile</Link>. If an agency invited you, accept the
        invitation there too.
      </p>
    );
  }
  return <RegisterAgency uid={uid} onDone={reload} />;
}
