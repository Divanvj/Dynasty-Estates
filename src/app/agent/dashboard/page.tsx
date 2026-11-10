"use client";

import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";

import { EnquiryList, useOwnerInquiries } from "@/components/enquiry-inbox";
import RoleGuard from "@/components/role-guard";
import { auth } from "@/lib/firebase";
import { getSellerListings, type SellerListing } from "@/lib/seller-listings";
import { ACTIVE_CATALOGUE_STATUSES, PUBLIC_LISTING_STATUSES } from "@/lib/types/domain";

// Sample listings and leads used to fill this page whenever an account had
// none (or nobody was signed in), under metrics labelled "Live data". They
// are gone: the console shows stored data only, with its empty states.

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export default function AgentDashboard() {
  // undefined until Firebase has said whether anyone is signed in.
  const [user, setUser] = useState<User | null | undefined>(auth ? undefined : null);
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [loadError, setLoadError] = useState("");
  // The counters read 0 while the queries were still running.
  const [loaded, setLoaded] = useState(!auth);
  const inbox = useOwnerInquiries(user === undefined ? undefined : (user?.uid ?? null));
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (!auth) return;

    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoadError("");

      if (!currentUser) {
        setListings([]);
        setLoaded(true);
        return;
      }
      setLoaded(false);

      try {
        setListings(await getSellerListings(currentUser.uid));
      } catch (error) {
        console.error("Agent dashboard load failed:", error);
        setLoadError("Your listings couldn’t be loaded. Check your connection and refresh the page.");
      } finally {
        setLoaded(true);
      }
    });
  }, []);

  // "Live" and "Featured" were never lifecycle statuses, so this counted nothing
  // that the write path actually produces. Uses the canonical list now.
  const activeListings = listings.filter((listing) =>
    (ACTIVE_CATALOGUE_STATUSES as readonly string[]).includes(listing.status),
  ).length;
  const leads = inbox.items;
  const newLeads = leads.filter((lead) => lead.status === "new").length;
  const viewingRequests = leads.filter((lead) => lead.kind === "tour" || lead.kind === "viewing").length;
  const leadsLast30Days = leads.filter(
    (lead) => lead.createdAt && now - lead.createdAt.getTime() <= THIRTY_DAYS_MS,
  ).length;
  // "Property views" was here, summing a `views` field that nothing ever
  // writes, so it always read 0. It comes back once views are recorded.
  const metrics = [
    { label: "New enquiries", value: `${newLeads}`, ready: inbox.state === "ready" },
    { label: "Enquiries, 30 days", value: `${leadsLast30Days}`, ready: inbox.state === "ready" },
    { label: "Viewing requests", value: `${viewingRequests}`, ready: inbox.state === "ready" },
    { label: "Active listings", value: `${activeListings}`, ready: loaded && !loadError },
  ];

  return (
    <RoleGuard allowedRoles={["Agent", "Admin"]} featureName="Agent Console">
      <main className="min-h-screen bg-[var(--background)] px-4 py-5 text-slate-900 md:px-6 lg:px-8 dark:text-white">
      <div className="mx-auto max-w-[1500px]">
        {/* No page bar: it held only Home / Search / Dashboard links, which
            SiteHeader (lg+) and MobileAppBar carry on every page. */}
        <h1 className="mb-5 text-3xl font-semibold tracking-[-0.04em] text-slate-900 md:text-4xl dark:text-white">Agent dashboard</h1>
        {user === null ? <p className="mb-4 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-3 text-sm text-amber-900 dark:text-amber-200">Sign in as an agent to see your listings and enquiries.</p> : null}
        {loadError ? <p role="alert" className="mb-4 rounded-2xl border border-rose-300/30 bg-rose-400/10 p-3 text-sm text-rose-900 dark:text-rose-200">{loadError}</p> : null}

        <section aria-label="Totals" className="mb-6 grid gap-4 grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-card border border-white/45 bg-white/40 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400 font-bold">{metric.label}</p>
              <p className="mt-4 text-3xl font-semibold tabular-nums text-slate-900 dark:text-white">{metric.ready ? metric.value : "–"}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Enquiries first: replying is the agent's most urgent job. This
              list used to be any 20 enquiries on the platform, unordered and
              undated, including other agents' and private sellers' buyers. */}
          <section
            aria-labelledby="enquiries-heading"
            className="rounded-panel border border-white/45 bg-white/40 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6 dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]"
          >
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 id="enquiries-heading" className="text-2xl font-semibold text-slate-900 dark:text-white">Enquiries</h2>
              {inbox.state === "ready" && newLeads > 0 ? (
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{newLeads} new</p>
              ) : null}
            </div>
            {/* Honest about the gap: nothing emails or texts the agent yet. */}
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
              Buyers&rsquo; messages and viewing requests on your listings, newest first. We don&rsquo;t send email or SMS alerts yet, so check back here.
            </p>
            <EnquiryList {...inbox} emptyMessage="No enquiries on your listings yet. When a buyer messages you or asks for a viewing, it shows here." />
          </section>

          <div className="rounded-panel border border-white/45 bg-white/40 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6 dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Your listings</h2>
              <Link
                href="/seller/listings/new"
                className="pill bg-slate-900 text-white dark:bg-emerald-700 dark:text-white dark:border-emerald-500/50 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] font-semibold shadow-md hover:opacity-95 transition-all"
              >
                + New listing
              </Link>
            </div>

            <div className="space-y-3">
              {!loaded ? <p role="status" className="p-1 text-sm text-slate-600 dark:text-slate-400">Loading…</p> : null}
              {loaded && !loadError && listings.length === 0 ? <p className="rounded-control border border-dashed border-slate-300 dark:border-white/15 p-4 text-sm text-slate-600 dark:text-slate-400">No listings have been created for this account yet.</p> : null}
              {listings.map((item) => {
                const enquiries = leads.filter((lead) => lead.propertyId === item.id).length;
                return (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-slate-200 bg-[#f4f7f7] dark:bg-surface-ink/70 dark:border-white/10 p-3.5 transition-all">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900 dark:text-white">{item.title}</p>
                      {/* Was "{views} views", which was always 0. */}
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {inbox.state === "ready" ? `${enquiries} ${enquiries === 1 ? "enquiry" : "enquiries"}` : " "}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-xs uppercase tracking-[0.14em] text-slate-600 dark:border-white/10 dark:bg-surface-ink/80 dark:text-slate-300 font-bold">
                        {item.status}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-emerald-400">{item.price}</span>
                      {(PUBLIC_LISTING_STATUSES as readonly string[]).includes(item.status) && (
                        <Link href={`/property/${item.id}`} className="text-sm font-semibold text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-300">
                          View<span className="sr-only"> {item.title}</span>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
    </RoleGuard>
  );
}
