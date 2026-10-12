"use client";

import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";

import BrandLogo from "@/components/brand-logo";
import RoleGuard from "@/components/role-guard";
import { auth } from "@/lib/firebase";
import { getSellerListings, type SellerListing } from "@/lib/seller-listings";

const cards = [
  { label: "Active listings", value: "12" },
  { label: "Leads this week", value: "48" },
  { label: "Avg. enquiry rate", value: "26%" },
  { label: "Property views", value: "8.4k" },
];

const demoListings: SellerListing[] = [
  { id: "demo-houghton", title: "Houghton Family Villa", price: "R 9.8M", status: "Published", views: 1240, location: "Houghton, Johannesburg", type: "Villa", beds: 5, baths: 4 },
  { id: "demo-waterfall", title: "Waterfall Modern Estate", price: "R 5.4M", status: "Published", views: 820, location: "Midrand, Johannesburg", type: "Estate Home", beds: 4, baths: 3 },
  { id: "demo-claremont", title: "Claremont Terrace", price: "R 3.2M", status: "Draft", views: 0, location: "Claremont, Cape Town", type: "Townhouse", beds: 3, baths: 2 },
];

const steps = [
  "Upload media",
  "Refine pricing",
  "Set visibility",
  "Review leads",
];

export default function SellerPortal() {
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<SellerListing[]>(demoListings);

  useEffect(() => {
    if (!auth) return;

    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const sellerListings = await getSellerListings(currentUser.uid);
        setListings(sellerListings);
      } else {
        setListings(demoListings);
      }
    });
  }, []);

  return (
    <RoleGuard allowedRoles={["Seller", "Agent", "Admin"]} featureName="Seller Portal">
      <main className="min-h-screen bg-[var(--background)] px-4 py-5 text-slate-900 md:px-6 lg:px-8 dark:text-white">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-6 flex items-center justify-between rounded-[28px] border border-white/45 bg-white/35 px-4 py-3 backdrop-blur-xl shadow-[0_12px_30px_rgba(15,23,42,0.06)] md:px-6 dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <BrandLogo />

          <div className="hidden items-center gap-6 text-sm text-slate-700 md:flex dark:text-slate-300">
            <Link href="/" className="hover:text-emerald-500 transition-colors">Home</Link>
            <Link href="/search" className="hover:text-emerald-500 transition-colors">Search</Link>
            <Link href="/seller/portal" className="text-emerald-800 dark:text-emerald-400 font-semibold">Seller portal</Link>
          </div>
        </header>

        {user ? <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">Showing listings owned by {user.email}.</p> : null}

        <section className="mb-6 rounded-[32px] border border-white/45 bg-[linear-gradient(135deg,rgba(255,255,255,0.6),rgba(220,238,244,0.72))] dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)] p-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-emerald-400 font-bold">Seller portal</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-slate-900 md:text-5xl dark:text-white">
                Sell smarter, faster, and with more confidence.
              </h1>
            </div>

            <Link href="/seller/listings/new" className="rounded-full bg-slate-900 text-white dark:bg-emerald-600 dark:text-white dark:border-emerald-500/50 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:opacity-95 px-5 py-3 text-sm font-semibold shadow-lg transition-all">
              Publish listing
            </Link>
          </div>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-[28px] border border-white/45 bg-white/40 p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 font-bold">{card.label}</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">{card.value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-white/45 bg-white/40 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6 dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-emerald-400 font-bold">Portfolio</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Your listings</h2>
              </div>
              <Link href="/seller/listings/new" className="rounded-full border border-slate-300 bg-white/60 px-4 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-200 dark:hover:bg-[#0c1a1c] dark:hover:text-white font-semibold transition-all">Manage</Link>
            </div>

            <div className="space-y-3">
              {listings.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-[#f4f7f7] dark:bg-[#060d0e]/70 dark:border-white/10 p-3.5 transition-all">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 font-medium">{item.price}{item.views ? ` • ${item.views} views` : ""}</p>
                  </div>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40 font-bold">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/45 bg-white/40 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6 dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-emerald-400 font-bold">Checklist</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Next steps</h2>
              </div>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-[22px] border border-slate-200 bg-[#f4f7f7] dark:bg-[#060d0e]/70 dark:border-white/10 p-3.5 transition-all">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0f172a] dark:bg-emerald-600 dark:text-white dark:shadow-[0_0_10px_rgba(16,185,129,0.3)] text-xs font-bold text-white shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{step}</p>
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
