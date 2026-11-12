"use client";

import { useEffect, useId, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { errorBoxClass, linkClass, panelClass, primaryButtonClass, secondaryButtonClass } from "@/components/dashboard-ui";
import { resolveAccount } from "@/lib/auth";
import { formatDate } from "@/lib/formatters";
import {
  complianceState,
  EXPIRY_WARNING_DAYS,
  getPractitioner,
  practitionerFieldError,
  PPRA_URL,
  submitPractitioner,
  type ComplianceState,
  type Practitioner,
  type PractitionerInput,
} from "@/lib/practitioners";
import { setActiveUserRole, setDeveloperAccount } from "@/lib/use-user-role";

/**
 * The practitioner's own compliance record (PLAN.md Phase F): a status card
 * and the form that files it for an admin to check. Used by /agent/profile
 * (existing agents) and /join/agent (accounts applying for agent access).
 */

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none aria-[invalid=true]:border-rose-500 dark:border-white/10 dark:bg-surface-ink dark:text-white";
const labelClass = "mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200";

export type PractitionerLoad = { state: "loading" } | { state: "error" } | { state: "ready"; record: Practitioner | null };

/** The signed-in account's record; `uid` undefined while auth resolves. */
export function usePractitioner(uid: string | null | undefined) {
  const [loaded, setLoaded] = useState<{ uid: string; load: PractitionerLoad } | null>(null);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    getPractitioner(uid)
      .then((record) => !cancelled && setLoaded({ uid, load: { state: "ready", record } }))
      .catch((error) => {
        console.error("Could not load the practitioner record:", error);
        if (!cancelled) setLoaded({ uid, load: { state: "error" } });
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const load: PractitionerLoad =
    uid === null ? { state: "ready", record: null } : uid && loaded?.uid === uid ? loaded.load : { state: "loading" };
  const replace = (record: Practitioner) => uid && setLoaded({ uid, load: { state: "ready", record } });
  return { load, replace };
}

const STATE_COPY: Record<ComplianceState["kind"], { label: string; tone: string }> = {
  none: { label: "Not filed", tone: "border-slate-300 bg-white/60 text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-300" },
  pending: { label: "Waiting for review", tone: "border-amber-400/40 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200" },
  rejected: { label: "Not accepted", tone: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-200" },
  verified: { label: "Verified", tone: "border-emerald-400/40 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-200" },
  expiring: { label: "Expires soon", tone: "border-amber-400/40 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200" },
  expired: { label: "Expired", tone: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-200" },
};

export function ComplianceBadge({ state }: { state: ComplianceState }) {
  const copy = STATE_COPY[state.kind];
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] ${copy.tone}`}>
      {copy.label}
    </span>
  );
}

/** One sentence on where the certificate stands and what to do next. */
export function complianceMessage(state: ComplianceState, record: Practitioner | null): string {
  switch (state.kind) {
    case "none":
      return "File your Fidelity Fund Certificate (FFC) so Dynasty can check it against the PPRA register.";
    case "pending":
      return "Dynasty is checking your certificate against the PPRA register. You'll see the result here.";
    case "rejected":
      return state.note ? `Not accepted: “${state.note}” Correct your details and send them again.` : "Not accepted. Correct your details and send them again.";
    case "verified":
      return `Checked against the PPRA register. Valid until ${record ? formatDate(`${record.ffcExpiry}T12:00:00Z`) : "–"}.`;
    case "expiring":
      return `Your certificate expires in ${state.daysLeft} ${state.daysLeft === 1 ? "day" : "days"}. Renew it with the PPRA, then file the new expiry date here.`;
    case "expired":
      return `Your certificate expired ${state.daysAgo} ${state.daysAgo === 1 ? "day" : "days"} ago. You may not act as a practitioner until it is renewed. File the new certificate here.`;
  }
}

const EMPTY: PractitionerInput = { fullName: "", phone: "", ffcNumber: "", ffcExpiry: "", agencyName: "" };
const FIELDS: (keyof PractitionerInput)[] = ["fullName", "phone", "ffcNumber", "ffcExpiry", "agencyName"];

export function PractitionerProfile({
  uid,
  intro,
}: {
  uid: string | null | undefined;
  /** Shown above the card; differs between the agent's profile and the application page. */
  intro?: React.ReactNode;
}) {
  const { user } = useAuth();
  const { load, replace } = usePractitioner(uid);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PractitionerInput>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof PractitionerInput, string>>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const ids = { fullName: useId(), phone: useId(), ffcNumber: useId(), ffcExpiry: useId(), agencyName: useId() };

  const record = load.state === "ready" ? load.record : null;
  const state = complianceState(record, now);

  // Once verified, pick up the agent role the admin's decision granted.
  useEffect(() => {
    if (!user || record?.status !== "verified") return;
    resolveAccount(user, true)
      .then((account) => {
        setActiveUserRole(account.role);
        setDeveloperAccount(account.developer);
      })
      .catch(() => undefined);
  }, [user, record?.status]);

  function startEditing() {
    setForm(record ? { fullName: record.fullName, phone: record.phone, ffcNumber: record.ffcNumber, ffcExpiry: record.ffcExpiry, agencyName: record.agencyName } : { ...EMPTY, fullName: user?.displayName ?? "" });
    setErrors({});
    setSaveError(null);
    setEditing(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!uid) return;
    const found: Partial<Record<keyof PractitionerInput, string>> = {};
    for (const field of FIELDS) {
      const message = practitionerFieldError(field, form[field]);
      if (message) found[field] = message;
    }
    setErrors(found);
    const first = FIELDS.find((field) => found[field]);
    if (first) {
      document.getElementById(ids[first])?.focus();
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await submitPractitioner(uid, user?.email ?? null, form);
      const fresh = await getPractitioner(uid);
      if (fresh) replace(fresh);
      setEditing(false);
    } catch (error) {
      console.error("Could not file the practitioner details:", error);
      setSaveError("Your details weren't sent. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  function field(name: keyof PractitionerInput, label: string, props: React.InputHTMLAttributes<HTMLInputElement>, hint?: string) {
    const error = errors[name];
    const hintId = `${ids[name]}-hint`;
    const errorId = `${ids[name]}-error`;
    return (
      <div>
        <label htmlFor={ids[name]} className={labelClass}>{label}</label>
        <input
          id={ids[name]}
          value={form[name]}
          onChange={(e) => {
            setForm((prev) => ({ ...prev, [name]: e.target.value }));
            if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
          }}
          onBlur={(e) => {
            const message = practitionerFieldError(name, e.target.value);
            setErrors((prev) => ({ ...prev, [name]: message || undefined }));
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hint ? hintId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined}
          className={inputClass}
          {...props}
        />
        {hint ? <p id={hintId} className="mt-1 text-xs text-slate-600 dark:text-slate-400">{hint}</p> : null}
        {error ? <p id={errorId} className="mt-1 text-sm text-rose-700 dark:text-rose-300">{error}</p> : null}
      </div>
    );
  }

  if (uid === null) {
    return <p className={errorBoxClass}>Sign in to file your practitioner details.</p>;
  }
  if (load.state === "loading") {
    return <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading your details…</p>;
  }
  if (load.state === "error") {
    return <p role="alert" className={errorBoxClass}>Your details couldn&rsquo;t be loaded. Check your connection and refresh the page.</p>;
  }

  return (
    <section aria-labelledby="compliance-heading" className={panelClass}>
      {intro}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="compliance-heading" className="text-2xl font-semibold text-slate-900 dark:text-white">Fidelity Fund Certificate</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-700 dark:text-slate-300">{complianceMessage(state, record)}</p>
        </div>
        <ComplianceBadge state={state} />
      </div>

      {record && !editing ? (
        <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {([
            ["Full name", record.fullName],
            ["FFC number", record.ffcNumber],
            ["Expires", formatDate(`${record.ffcExpiry}T12:00:00Z`)],
            ["Phone", record.phone],
            ["Agency", record.agencyName || "Not given"],
            ["Sent", record.submittedAt ? formatDate(record.submittedAt) : "–"],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-slate-200/70 pb-2 text-sm dark:border-white/10">
              <dt className="text-slate-600 dark:text-slate-400">{k}</dt>
              <dd className="text-right font-semibold text-slate-900 dark:text-white">{v}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {editing ? (
        <form noValidate onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
          {field("fullName", "Full name", { autoComplete: "name", maxLength: 120 })}
          {field("phone", "Phone", { type: "tel", autoComplete: "tel", maxLength: 40 })}
          {field("ffcNumber", "FFC number", { maxLength: 40, autoCapitalize: "characters" }, "As printed on your certificate.")}
          {field("ffcExpiry", "Expiry date", { type: "date" }, `You'll be reminded ${EXPIRY_WARNING_DAYS} days before it expires.`)}
          {field("agencyName", "Agency (optional)", { autoComplete: "organization", maxLength: 120 })}
          <div className="sm:col-span-2">
            {record ? (
              <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">Sending changes puts your certificate back in the review queue until Dynasty checks it again.</p>
            ) : null}
            {saveError ? <p role="alert" className={`mb-3 ${errorBoxClass}`}>{saveError}</p> : null}
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={saving} className={primaryButtonClass}>
                {saving ? "Sending…" : "Send for review"}
              </button>
              <button type="button" onClick={() => setEditing(false)} className={secondaryButtonClass}>
                Cancel
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button type="button" onClick={startEditing} className={state.kind === "verified" ? secondaryButtonClass : primaryButtonClass}>
            {record ? "Update details" : "File my certificate"}
          </button>
          <a href={PPRA_URL} target="_blank" rel="noopener noreferrer" className={`text-sm ${linkClass}`}>
            PPRA website<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      )}
    </section>
  );
}
