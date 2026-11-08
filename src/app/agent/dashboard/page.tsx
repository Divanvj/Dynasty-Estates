"use client";

import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";

import RoleGuard from "@/components/role-guard";
import { getRecentInquiries, type AgentInquiry } from "@/lib/agent-inquiries";
import { auth } from "@/lib/firebase";
import { formatNumber } from "@/lib/formatters";
import { getSellerListings, type SellerListing } from "@/lib/seller-listings";
import { ACTIVE_CATALOGUE_STATUSES, PUBLIC_LISTING_STATUSES } from "@/lib/types/domain";

// Sample listings and leads used to fill this page whenever an account had
// none (or nobody was signed in), under metrics labelled "Live data". They
// are gone: the console shows stored data only, with its empty states.

export default function AgentDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [leads, setLeads] = useState<AgentInquiry[]>([]);
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [loadError, setLoadError] = useState("");
  // The four counters read 0 while the queries were still running.
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!auth) {
      return;
    }

    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoadError("");

      if (!currentUser) {
        setListings([]);
        setLeads([]);
        setLoaded(true);
        return;
      }
      setLoaded(false);

      try {
        const [sellerListings, inquiries] = await Promise.all([
          getSellerListings(currentUser.uid),
          getRecentInquiries(),
        ]);
        setListings(sellerListings);
        setLeads(inquiries);
      } catch (error) {
        console.error("Agent dashboard load failed:", error);
        setLoadError("Your dashboard couldn’t be loaded. Check your connection and refresh the page.");
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
  const newLeads = leads.filter((lead) => lead.status.toLowerCase() === "new").length;
  const tourBookings = leads.filter((lead) => lead.kind === "tour" || lead.kind === "viewing").length;
  const totalViews = listings.reduce((sum, listing) => sum + listing.views, 0);
  // No "Live data" badge on each figure any more: it sat on zeros too, and
  // every number on this page is stored data, so it said nothing.
  const metrics = [
    { label: "New enquiries", value: `${newLeads}` },
    { label: "Active listings", value: `${activeListings}` },
    { label: "Viewing requests", value: `${tourBookings}` },
    { label: "Property views", value: formatNumber(totalViews) },
  ];

  return (
    <RoleGuard allowedRoles={["Agent", "Admin"]} featureName="Agent Console">
      <main className="min-h-screen bg-[var(--background)] px-4 py-5 text-slate-900 md:px-6 lg:px-8 dark:text-white">
      <div className="mx-auto max-w-[1500px]">
        {/* No page bar: it held only Home / Search / Dashboard links, which
            SiteHeader (lg+) and MobileAppBar carry on every page. */}
        {/* The page had no heading at all. */}
        <h1 className="mb-5 text-3xl font-semibold tracking-[-0.04em] text-slate-900 md:text-4xl dark:text-white">Agent dashboard</h1>
        {!user ? <p className="mb-4 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-3 text-sm text-amber-900 dark:text-amber-200">Sign in as an agent to see your listings and enquiries.</p> : null}
        {loadError ? <p role="alert" className="mb-4 rounded-2xl border border-rose-300/30 bg-rose-400/10 p-3 text-sm text-rose-900 dark:text-rose-200">{loadError}</p> : null}

        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-card border border-white/45 bg-white/40 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400 font-bold">{metric.label}</p>
              <p className="mt-4 text-3xl font-semibold tabular-nums text-slate-900 dark:text-white">{loaded ? metric.value : "–"}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-panel border border-white/45 bg-white/40 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6 dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Your listings</h2>
              </div>
              <Link
                href="/seller/listings/new"
                className="pill bg-slate-900 text-white dark:bg-emerald-700 dark:text-white dark:border-emerald-500/50 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] font-semibold shadow-md hover:opacity-95 transition-all"
              >
                + New listing
              </Link>
            </div>

            <div className="space-y-3">
              {!loaded ? <p role="status" className="p-1 text-sm text-slate-600 dark:text-slate-400">Loading…</p> : null}
              {loaded && listings.length === 0 ? <p className="rounded-control border border-dashed border-slate-300 dark:border-white/15 p-4 text-sm text-slate-600 dark:text-slate-400">No listings have been created for this account yet.</p> : null}
              {listings.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-control border border-slate-200 bg-[#f4f7f7] dark:bg-surface-ink/70 dark:border-white/10 p-3.5 transition-all">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 font-medium">{formatNumber(item.views)} views</p>
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
              ))}
            </div>
          </div>

          <div className="rounded-panel border border-white/45 bg-white/40 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6 dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                {/* Was "Hot leads": nothing ranked them. These are the latest enquiries. */}
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Recent enquiries</h2>
              </div>
              {/* No "View all leads" link: it went to /inquiries, which lists the
                  enquiries the signed-in person has SENT, so an agent always
                  landed on "You have not sent any requests yet". */}
            </div>

            <div className="space-y-3">
              {loaded && leads.length === 0 ? <p className="rounded-control border border-dashed border-slate-300 dark:border-white/15 p-4 text-sm text-slate-600 dark:text-slate-400">No enquiries have been received yet.</p> : null}
              {leads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between rounded-control border border-slate-200 bg-[#f4f7f7] dark:bg-surface-ink/70 dark:border-white/10 p-3.5 transition-all">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{lead.userEmail}</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 font-medium">{lead.propertyTitle} • {lead.kind}</p>
                  </div>

                  <div className="text-right">
                    {/* Labelled "Last contact", but the value is the enquiry's status. */}
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400 font-bold">Status</p>
                    <p className="mt-1 text-sm font-semibold capitalize text-emerald-800 dark:text-emerald-400">{lead.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
    </RoleGuard>
  );
}
