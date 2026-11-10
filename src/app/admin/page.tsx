"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  emptyBoxClass,
  errorBoxClass,
  formatAge,
  linkClass,
  PageHeading,
  panelClass,
  rowClass,
  StatTile,
} from "@/components/dashboard-ui";
import { countEnquiriesSince, countLiveListings, getWaitingForReview, type WaitingListing } from "@/lib/admin-overview";
import { getSupportRequests, PACKAGE_REQUEST_PREFIX, type SupportRequest } from "@/lib/support-requests";
import { useAccountUid } from "@/lib/use-owner-listings";

// Pattern 4 — Dashboard / Overview (docs/dashboards/PLAN.md, Phase A). The
// platform's business pulse at a glance, read-only; every line links to the
// page that deals with it. Errors, deploys and vitals belong to the developer
// console, not here.

type Loaded<T> = { ok: true; value: T } | { ok: false } | null;

/** Runs `load` once the admin is signed in; each figure fails on its own. */
function useLoaded<T>(uid: string | null | undefined, load: () => Promise<T>): Loaded<T> {
  const [result, setResult] = useState<Loaded<T>>(null);
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    load()
      .then((value) => !cancelled && setResult({ ok: true, value }))
      .catch((error) => {
        console.error("Admin overview figure failed:", error);
        if (!cancelled) setResult({ ok: false });
      });
    return () => {
      cancelled = true;
    };
    // `load` is a stable module-level function per call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);
  return result;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function show<T>(loaded: Loaded<T>, format: (value: T) => string): string | null {
  if (!loaded) return null;
  return loaded.ok ? format(loaded.value) : "Error";
}

export default function AdminOverview() {
  const uid = useAccountUid();
  const [now] = useState(() => Date.now());
  const live = useLoaded(uid, countLiveListings);
  const enquiries = useLoaded(uid, () => countEnquiriesSince(new Date(Date.now() - SEVEN_DAYS_MS)));
  const waiting = useLoaded<WaitingListing[]>(uid, getWaitingForReview);
  const support = useLoaded<SupportRequest[]>(uid, getSupportRequests);

  const openSupport = support?.ok ? support.value.filter((r) => r.status !== "closed") : [];
  const newSupport = openSupport.filter((r) => r.status === "new" && !r.message.startsWith(PACKAGE_REQUEST_PREFIX));
  const openPackages = openSupport.filter((r) => r.message.startsWith(PACKAGE_REQUEST_PREFIX));
  const oldestWaiting = waiting?.ok ? waiting.value.find((w) => w.submittedAt)?.submittedAt ?? null : null;
  const anyFailed = [live, enquiries, waiting, support].some((x) => x && !x.ok);

  type Action = { key: string; title: string; detail: string; href: string; age?: string };
  const actions: Action[] = [
    ...(waiting?.ok ? waiting.value.slice(0, 3) : []).map((w) => ({
      key: `mod-${w.id}`,
      title: `Review “${w.title}”`,
      detail: "Waiting for moderation",
      href: `/admin/moderation?id=${encodeURIComponent(w.id)}`,
      age: w.submittedAt ? `Waiting ${formatAge(w.submittedAt, now)}` : undefined,
    })),
    ...openPackages.slice(0, 3).map((r) => ({
      key: `pkg-${r.id}`,
      title: r.message.split("\n")[0],
      detail: `${r.userEmail ?? r.userId} · invoice by hand`,
      href: "/admin/support?show=new",
      age: r.createdAt ? formatAge(new Date(r.createdAt), now) + " ago" : undefined,
    })),
    ...newSupport.slice(0, 3).map((r) => ({
      key: `sup-${r.id}`,
      title: `Answer ${r.userEmail ?? "a user"}`,
      detail: r.message.length > 90 ? `${r.message.slice(0, 90)}…` : r.message,
      href: "/admin/support?show=new",
      age: r.createdAt ? formatAge(new Date(r.createdAt), now) + " ago" : undefined,
    })),
  ];
  const allLoaded = Boolean(waiting && support);

  return (
    <>
      <PageHeading
        title="Overview"
        description="How the marketplace is doing and what is waiting for the Dynasty team."
      />

      <section aria-label="Totals" className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatTile label="Live listings" value={show(live, String)} detail="Published or under offer" />
        <StatTile
          label="Waiting for review"
          value={show(waiting, (v) => String(v.length))}
          detail={oldestWaiting ? `Oldest ${formatAge(oldestWaiting, now)}` : waiting?.ok ? "Queue is clear" : undefined}
        />
        <StatTile label="Enquiries" value={show(enquiries, String)} detail="Last 7 days" />
        <StatTile label="Support requests" value={support?.ok ? String(newSupport.length) : show(support, () => "")} detail="New, not yet answered" />
        <StatTile label="Package requests" value={support?.ok ? String(openPackages.length) : show(support, () => "")} detail="Open, to invoice" />
      </section>

      {anyFailed ? (
        <p role="alert" className={`mb-4 ${errorBoxClass}`}>
          Some figures couldn&rsquo;t be loaded. Check your connection and refresh the page.
        </p>
      ) : null}

      <section aria-labelledby="actions-heading" className={panelClass}>
        <h2 id="actions-heading" className="mb-4 text-2xl font-semibold text-slate-900 dark:text-white">Needs action</h2>
        {!allLoaded ? (
          <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading…</p>
        ) : actions.length === 0 ? (
          <p className={emptyBoxClass}>Nothing is waiting. Submitted listings, package requests and support messages show here.</p>
        ) : (
          <ul className="space-y-3">
            {actions.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className={`${rowClass} flex flex-wrap items-center justify-between gap-x-4 gap-y-1 hover:border-slate-300 hover:bg-white dark:hover:bg-surface-ink`}>
                  <span className="min-w-0">
                    <span className="block font-semibold text-slate-900 dark:text-white">{item.title}</span>
                    <span className="mt-0.5 block truncate text-sm text-slate-600 dark:text-slate-300">{item.detail}</span>
                  </span>
                  <span className="flex items-center gap-3 text-sm">
                    {item.age ? <span className="font-semibold text-amber-800 dark:text-amber-300">{item.age}</span> : null}
                    <span aria-hidden="true" className="text-slate-400">→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          Prices and plans: <Link href="/admin/packages" className={linkClass}>Packages</Link>.
        </p>
      </section>
    </>
  );
}
