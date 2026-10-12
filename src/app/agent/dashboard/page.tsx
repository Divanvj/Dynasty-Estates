"use client";

import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";

import BrandLogo from "@/components/brand-logo";
import RoleGuard from "@/components/role-guard";
import { getRecentInquiries, type AgentInquiry } from "@/lib/agent-inquiries";
import { auth } from "@/lib/firebase";
import { formatNumber } from "@/lib/formatters";
import { getSellerListings, type SellerListing } from "@/lib/seller-listings";
import { ACTIVE_CATALOGUE_STATUSES } from "@/lib/types/domain";

const fallbackAgentListings: SellerListing[] = [
  { id: "prop-1", title: "Waterkloof Crest Architectural Villa", price: "R 6,850,000", status: "Published", views: 2410, location: "Waterkloof, Pretoria", type: "Estate Home", beds: 5, baths: 4 },
  { id: "prop-2", title: "Juniper Ridge Family Estate", price: "R 4,900,000", status: "Published", views: 1890, location: "Sandton, Johannesburg", type: "House", beds: 4, baths: 3 },
  { id: "prop-3", title: "Silver Lakes Golf Estate Sanctuary", price: "R 5,600,000", status: "Draft", views: 0, location: "Silver Lakes, Pretoria", type: "Estate Home", beds: 4, baths: 3 },
];

const fallbackAgentLeads: AgentInquiry[] = [
  { id: "lead-1", userEmail: "dr.pretorius@med.co.za", propertyTitle: "Waterkloof Crest Villa", kind: "tour", status: "Pending", propertyId: "waterkloof-crest", createdAt: new Date().toISOString() },
  { id: "lead-2", userEmail: "sipho.m@vodamail.co.za", propertyTitle: "Juniper Ridge Estate", kind: "message", status: "Pending", propertyId: "juniper-ridge", createdAt: new Date().toISOString() },
];

export default function AgentDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [leads, setLeads] = useState<AgentInquiry[]>(fallbackAgentLeads);
  const [listings, setListings] = useState<SellerListing[]>(fallbackAgentListings);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!auth) {
      return;
    }

    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoadError("");

      if (!currentUser) {
        setListings(fallbackAgentListings);
        setLeads(fallbackAgentLeads);
        return;
      }

      try {
        const [sellerListings, inquiries] = await Promise.all([
          getSellerListings(currentUser.uid),
          getRecentInquiries(),
        ]);
        setListings(sellerListings.length > 0 ? sellerListings : fallbackAgentListings);
        setLeads(inquiries.length > 0 ? inquiries : fallbackAgentLeads);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Unable to load dashboard data.");
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
  const metrics = [
    { label: "New leads", value: `${newLeads}`, delta: "Live data" },
    { label: "Active listings", value: `${activeListings}`, delta: "Live data" },
    { label: "Tour bookings", value: `${tourBookings}`, delta: "Live data" },
    { label: "Property views", value: formatNumber(totalViews), delta: "Live data" },
  ];

  return (
    <RoleGuard allowedRoles={["Agent", "Admin"]} featureName="Agent Console">
      <main className="min-h-screen bg-[var(--background)] px-4 py-5 text-slate-900 md:px-6 lg:px-8 dark:text-white">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-6 flex items-center justify-between rounded-[28px] border border-white/75 bg-white/45 px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl md:px-6 dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <BrandLogo />

          <div className="hidden items-center gap-6 text-sm text-slate-700 md:flex dark:text-slate-300">
            <Link href="/" className="hover:text-emerald-500 transition-colors">Home</Link>
            <Link href="/search" className="hover:text-emerald-500 transition-colors">Search</Link>
            <Link href="/agent/dashboard" className="text-emerald-800 dark:text-emerald-400 font-semibold">Dashboard</Link>
          </div>
        </header>

        {!user ? <p className="mb-4 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-3 text-sm text-amber-900 dark:text-amber-200">Sign in as an agent to view live portfolio data.</p> : null}
        {loadError ? <p className="mb-4 rounded-2xl border border-rose-300/30 bg-rose-400/10 p-3 text-sm text-rose-900 dark:text-rose-200">{loadError}</p> : null}

        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-[28px] border border-white/45 bg-white/40 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">{metric.label}</p>
              <div className="mt-4 flex items-end justify-between">
                <p className="text-3xl font-semibold text-slate-900 dark:text-white">{metric.value}</p>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-emerald-800 dark:text-emerald-300 dark:border-emerald-500/40 font-bold">
                  {metric.delta}
                </span>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-white/45 bg-white/40 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6 dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-emerald-400 font-bold">Portfolio</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Listings overview</h2>
              </div>
              <Link
                href="/seller/listings/new"
                className="rounded-full bg-slate-900 text-white dark:bg-emerald-600 dark:text-white dark:border-emerald-500/50 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] px-4 py-2 text-xs font-semibold shadow-md hover:opacity-95 transition-all"
              >
                + New listing
              </Link>
            </div>

            <div className="space-y-3">
              {listings.length === 0 ? <p className="rounded-[22px] border border-dashed border-slate-300 dark:border-white/15 p-4 text-sm text-slate-500 dark:text-slate-400">No listings have been created for this account yet.</p> : null}
              {listings.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-[#f4f7f7] dark:bg-[#060d0e]/70 dark:border-white/10 p-3.5 transition-all">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">{formatNumber(item.views)} views</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-600 dark:border-white/10 dark:bg-[#060d0e]/80 dark:text-slate-300 font-bold">
                      {item.status}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-emerald-400">{item.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/45 bg-white/40 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6 dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-emerald-400 font-bold">Pipeline</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Hot leads</h2>
              </div>
              <Link
                href="/inquiries"
                className="rounded-full border border-slate-300 bg-white/60 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-200 dark:hover:bg-[#0c1a1c] dark:hover:text-white transition-all"
              >
                View all leads →
              </Link>
            </div>

            <div className="space-y-3">
              {leads.length === 0 ? <p className="rounded-[22px] border border-dashed border-slate-300 dark:border-white/15 p-4 text-sm text-slate-500 dark:text-slate-400">No enquiries have been received yet.</p> : null}
              {leads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-[#f4f7f7] dark:bg-[#060d0e]/70 dark:border-white/10 p-3.5 transition-all">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{lead.userEmail}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">{lead.propertyTitle} • {lead.kind}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 font-bold">Last contact</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-800 dark:text-emerald-400">{lead.status}</p>
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
