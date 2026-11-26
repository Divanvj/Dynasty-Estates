"use client";

import { useEffect, useState } from "react";

import CustomSelect from "@/components/custom-select";
import { AgeChip, errorBoxClass, Initials, linkClass, panelClass } from "@/components/dashboard-ui";
import { formatDateTime, formatNumber } from "@/lib/formatters";
import {
  APPLICATION_STATUS_LABEL,
  getApplicationsForOwner,
  OWNER_APPLICATION_STATUSES,
  setApplicationStatus,
  type OwnerApplicationStatus,
  type TenantApplication,
} from "@/lib/tenant-applications";

/**
 * Tenancy applications on the signed-in account's own rental listings: the
 * letting agent's (/agent/enquiries) or private landlord's (/seller/portal)
 * queue. The owner is e-mailed about each new one (src/lib/server/notify.ts)
 * with a link to #applications here.
 *
 * The section stays hidden until there is at least one application, so an
 * account that only sells never sees an empty rental panel.
 */
export default function TenancyApplications({ uid }: { uid: string | null | undefined }) {
  const [loaded, setLoaded] = useState<{ uid: string; items: TenantApplication[]; failed: boolean } | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  // ID numbers are masked until the owner asks to see one.
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    getApplicationsForOwner(uid)
      .then((items) => {
        if (!cancelled) setLoaded({ uid, items, failed: false });
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Could not load tenancy applications on this account's listings:", error);
        setLoaded({ uid, items: [], failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  // Arriving from the e-mail with #applications: scroll there once loaded.
  const count = uid && loaded?.uid === uid ? loaded.items.length : 0;
  useEffect(() => {
    if (count > 0 && window.location.hash === "#applications") {
      document.getElementById("applications")?.scrollIntoView({ block: "start" });
    }
  }, [count]);

  const current = uid && loaded?.uid === uid ? loaded : null;
  if (!current || (!current.failed && current.items.length === 0)) return null;

  async function changeStatus(item: TenantApplication, status: OwnerApplicationStatus) {
    if (item.status === status) return;
    setSavingId(item.id);
    setStatusError(null);
    try {
      await setApplicationStatus(item.id, status);
      setLoaded((prev) => (prev ? { ...prev, items: prev.items.map((row) => (row.id === item.id ? { ...row, status } : row)) } : prev));
    } catch (error) {
      console.error("Could not change the application's status:", error);
      setStatusError("That change couldn’t be saved. Check your connection and try again.");
    } finally {
      setSavingId(null);
    }
  }

  const waiting = current.items.filter((item) => item.status === "submitted").length;

  return (
    <section id="applications" aria-labelledby="applications-heading" className={`mt-6 scroll-mt-24 ${panelClass}`}>
      <h2 id="applications-heading" className="text-lg font-bold text-slate-900 dark:text-white">
        Tenancy applications
        {waiting ? (
          <span className="ml-2 inline-flex rounded-full bg-[var(--dash-track)] px-2 py-0.5 align-[2px] text-xs font-semibold text-slate-600 dark:text-slate-300">
            {waiting} new
          </span>
        ) : null}
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Tenants who applied online to rent one of your homes. Each one consented to credit and reference checks for this
        application; run them as you normally would, then record the outcome here.
      </p>

      {statusError ? (
        <p role="alert" className={`mt-3 ${errorBoxClass}`}>
          {statusError}
        </p>
      ) : null}

      {current.failed ? (
        <p role="alert" className={`mt-4 ${errorBoxClass}`}>
          Your tenancy applications couldn&rsquo;t be loaded. Check your connection and refresh the page.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {current.items.map((item) => {
            const isNew = item.status === "submitted";
            const idShown = revealed.has(item.id);
            const facts: Array<[string, string]> = [
              ["Move-in", item.occupationDate],
              ["Lease", item.leaseTerm],
              ["Employer", item.employer ?? ""],
              ["Net income", item.netIncome],
              ["Rent", item.monthlyRentZAR ? `R ${formatNumber(item.monthlyRentZAR)} / month` : ""],
              ["Move-in total", item.totalMoveInCostZAR ? `R ${formatNumber(item.totalMoveInCostZAR)}` : ""],
            ];
            return (
              <li
                key={item.id}
                id={`application-${item.id}`}
                className={`relative flex scroll-mt-24 gap-3.5 rounded-2xl border p-4 ${
                  isNew
                    ? "border-[var(--dash-line-2)] bg-[var(--dash-card-2)] before:absolute before:inset-y-4 before:left-0 before:w-[3px] before:rounded-r-full before:bg-[var(--dash-d1)]"
                    : "border-[var(--dash-line)] bg-[var(--dash-card)]"
                }`}
              >
                <span className="hidden sm:block">
                  <Initials name={item.fullName || "Tenant"} size={42} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                    <div className="min-w-0">
                      <p className={`text-slate-900 dark:text-white ${isNew ? "font-bold" : "font-semibold"}`}>
                        {item.fullName || "A tenant"}
                        <span className="ml-2 inline-flex rounded-full bg-[var(--dash-track)] px-2 py-0.5 align-[2px] font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {item.reference}
                        </span>
                      </p>
                      <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                        <span className="font-medium text-slate-700 dark:text-slate-200">{item.propertyTitle}</span>
                        {item.createdAt ? ` · ${formatDateTime(new Date(item.createdAt))}` : ""}
                      </p>
                    </div>
                    <AgeChip
                      label={APPLICATION_STATUS_LABEL[item.status] ?? item.status}
                      tone={item.status === "approved" ? "good" : item.status === "vetting" ? "soon" : "neutral"}
                    />
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3">
                    {facts
                      .filter(([, value]) => value)
                      .map(([label, value]) => (
                        <div key={label} className="min-w-0">
                          <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
                          <dd className="truncate font-medium text-slate-800 dark:text-slate-200">{value}</dd>
                        </div>
                      ))}
                    <div className="min-w-0">
                      <dt className="text-xs text-slate-500 dark:text-slate-400">ID number</dt>
                      <dd className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                        <span className="font-mono">{idShown ? item.idNumber : `••••••••${String(item.idNumber ?? "").slice(-4)}`}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setRevealed((prev) => {
                              const next = new Set(prev);
                              if (next.has(item.id)) next.delete(item.id);
                              else next.add(item.id);
                              return next;
                            })
                          }
                          className="tap-44 relative text-xs font-semibold text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-300"
                        >
                          {idShown ? "Hide" : "Show"}
                          <span className="sr-only"> the ID number of {item.fullName || "this tenant"}</span>
                        </button>
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    {item.email ? (
                      <a href={`mailto:${item.email}`} className={linkClass}>
                        {item.email}
                      </a>
                    ) : null}
                    {item.phone ? (
                      <a href={`tel:${item.phone.replace(/\s+/g, "")}`} className={linkClass}>
                        {item.phone}
                      </a>
                    ) : null}
                    {item.status === "withdrawn" ? (
                      <span className="ml-auto text-xs text-slate-600 dark:text-slate-400">Withdrawn by the tenant</span>
                    ) : (
                      <div className="ml-auto flex items-center gap-2">
                        {savingId === item.id ? (
                          <span role="status" className="text-xs text-slate-600 dark:text-slate-400">Saving…</span>
                        ) : null}
                        <CustomSelect
                          ariaLabel={`Status of the application from ${item.fullName || "a tenant"}`}
                          value={item.status}
                          disabled={savingId === item.id}
                          onChange={(value) => void changeStatus(item, value as OwnerApplicationStatus)}
                          options={OWNER_APPLICATION_STATUSES.map((value) => ({ value, label: APPLICATION_STATUS_LABEL[value] }))}
                          label="Status"
                          align="right"
                          className="w-44"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
