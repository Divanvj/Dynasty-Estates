"use client";

import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";

import RoleGuard from "@/components/role-guard";
import { auth } from "@/lib/firebase";
import { formatDateTime, formatNumber } from "@/lib/formatters";
import { ACTIVE_CATALOGUE_STATUSES, PUBLIC_LISTING_STATUSES } from "@/lib/types/domain";
import { getSellerListings, type SellerListing } from "@/lib/seller-listings";
import {
  getSellerInquiries,
  setSellerInquiryStatus,
  type SellerInquiry,
  type SellerInquiryStatus,
} from "@/lib/seller-inquiries";

// Three sample listings used to show here when nobody was signed in. Only the
// account's own stored listings are shown now.
//
// A four-step "Next steps" checklist (Upload media, Refine pricing, Set
// visibility, Review leads) also sat beside the list. Nothing in it was
// clickable or ever ticked off, so it was removed.

type LoadState = "loading" | "ready" | "error";

export default function SellerPortal() {
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<SellerListing[]>([]);
  // The counters used to read 0 while the query was still running, and a
  // failed query left them at 0 for good with nothing said.
  const [loadState, setLoadState] = useState<LoadState>(auth ? "loading" : "error");
  const [inquiries, setInquiries] = useState<SellerInquiry[]>([]);
  const [inquiryState, setInquiryState] = useState<LoadState>(auth ? "loading" : "error");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) return;

    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setListings([]);
        setLoadState("ready");
        setInquiries([]);
        setInquiryState("ready");
        return;
      }
      setLoadState("loading");
      setInquiryState("loading");
      // Loaded on its own so a failure here still shows the listings.
      getSellerInquiries(currentUser.uid)
        .then((items) => {
          setInquiries(items);
          setInquiryState("ready");
        })
        .catch((error) => {
          console.error("Could not load enquiries on the seller's listings:", error);
          setInquiryState("error");
        });
      try {
        setListings(await getSellerListings(currentUser.uid));
        setLoadState("ready");
      } catch (error) {
        console.error("Could not load the seller's listings:", error);
        setLoadState("error");
      }
    });
  }, []);

  /**
   * Derived from the seller's own listings, the way the agent dashboard does
   * it.
   *
   * These four cards used to be the constants `12`, `48`, `26%` and `8.4k`,
   * rendered above the seller's real listings. Someone with two homes on the
   * platform was told they had twelve, and the number never moved when they
   * published a third. "Leads this week" and "Avg. enquiry rate" had no source
   * at all — there is no per-seller enquiry query in this app — so rather than
   * keep inventing them they are gone, and the two facts the listings really
   * do carry take their place.
   */
  const activeListings = listings.filter((listing) =>
    (ACTIVE_CATALOGUE_STATUSES as readonly string[]).includes(listing.status),
  ).length;
  const draftListings = listings.filter((listing) => listing.status === "Draft").length;
  const totalViews = listings.reduce((sum, listing) => sum + listing.views, 0);

  const newInquiries = inquiries.filter((item) => item.status === "new").length;

  async function changeStatus(item: SellerInquiry, status: SellerInquiryStatus) {
    setSavingId(item.id);
    setStatusError(null);
    try {
      await setSellerInquiryStatus(item.id, status);
      setInquiries((current) => current.map((row) => (row.id === item.id ? { ...row, status } : row)));
    } catch (error) {
      console.error("Could not update the enquiry:", error);
      setStatusError("That change wasn't saved. Check your connection and try again.");
    } finally {
      setSavingId(null);
    }
  }

  const cards = [
    { label: "Active listings", value: `${activeListings}` },
    { label: "Drafts", value: `${draftListings}` },
    { label: "Property views", value: formatNumber(totalViews) },
  ];

  return (
    <RoleGuard
      allowedRoles={["Seller", "Agent", "Admin"]}
      allowAnySignedIn
      featureName="Seller Portal"
    >
      <main className="min-h-screen bg-[var(--background)] px-4 py-5 text-slate-900 md:px-6 lg:px-8 dark:text-white">
      <div className="mx-auto max-w-[1500px]">
        {/* No page bar: it held only Home / Search / Seller portal links, which
            SiteHeader (lg+) and MobileAppBar carry on every page. */}
        <section className="mb-6 rounded-panel border border-white/45 bg-[linear-gradient(135deg,rgba(255,255,255,0.6),rgba(220,238,244,0.72))] dark:bg-none dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)] p-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {/* Was the slogan "Sell smarter, faster, and with more
                  confidence." under a "Seller portal" eyebrow. */}
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-900 md:text-4xl dark:text-white">
                Seller portal
              </h1>
              {user ? (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Listings owned by {user.email}</p>
              ) : null}
            </div>

            <Link href="/seller/listings/new" className="pill-lg bg-slate-900 text-white dark:bg-emerald-700 dark:text-white dark:border-emerald-500/50 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:opacity-95 text-sm font-semibold shadow-lg transition-all self-start sm:self-auto">
              List a home
            </Link>
          </div>
        </section>

        <section aria-label="Totals" className="mb-6 grid gap-4 grid-cols-3">
          {cards.map((card) => (
            <div key={card.label} className="rounded-card border border-white/45 bg-white/40 p-4 sm:p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400 font-bold">{card.label}</p>
              <p className="mt-3 text-2xl sm:text-3xl font-semibold tabular-nums text-slate-900 dark:text-white">
                {loadState === "ready" ? card.value : "–"}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-panel border border-white/45 bg-white/40 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6 dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          {/* No "Manage" button: it opened the new-listing form, the same
              place as "List a home" above. There is no edit screen yet. */}
          <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-white">Your listings</h2>

          {loadState === "loading" && (
            <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading your listings…</p>
          )}

          {loadState === "error" && (
            <p role="alert" className="rounded-control border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200">
              Your listings couldn&rsquo;t be loaded. Check your connection and refresh the page.
            </p>
          )}

          {loadState === "ready" && listings.length === 0 && (
            <div className="rounded-control border border-dashed border-slate-300 p-6 text-center dark:border-white/15">
              <p className="font-semibold text-slate-900 dark:text-white">You haven&rsquo;t listed a home yet.</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Add photos, the price and the details, then publish.
              </p>
              <Link
                href="/seller/listings/new"
                className="pill mt-4 inline-flex bg-slate-900 font-semibold text-white hover:bg-slate-800 dark:bg-emerald-700 dark:hover:bg-emerald-800"
              >
                List a home
              </Link>
            </div>
          )}

          {loadState === "ready" && listings.length > 0 && (
            <ul className="space-y-3">
              {listings.map((item) => {
                // Only public listings have a page to open; a draft or one
                // waiting for review would 404.
                const isPublic = (PUBLIC_LISTING_STATUSES as readonly string[]).includes(item.status);
                return (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-slate-200 bg-[#f4f7f7] dark:bg-surface-ink/70 dark:border-white/10 p-3.5">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900 dark:text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 font-medium">
                        {item.price}
                        {item.views ? ` • ${formatNumber(item.views)} views` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs uppercase tracking-[0.14em] text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40 font-bold">
                        {item.status}
                      </span>
                      {isPublic && (
                        <Link
                          href={`/property/${item.id}`}
                          className="text-sm font-semibold text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-300"
                        >
                          View<span className="sr-only"> {item.title}</span>
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Enquiries on the owner's listings. Before this, a buyer's message
            on a private listing reached agents and admins but never the
            seller (no ownerId on the enquiry, and the rules did not let an
            owner read it). */}
        <section
          aria-labelledby="enquiries-heading"
          className="mt-6 rounded-panel border border-white/45 bg-white/40 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6 dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]"
        >
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="enquiries-heading" className="text-2xl font-semibold text-slate-900 dark:text-white">
              Enquiries
            </h2>
            {inquiryState === "ready" && newInquiries > 0 ? (
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{newInquiries} new</p>
            ) : null}
          </div>
          {/* Honest about the gap: nothing emails or texts the seller yet. */}
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            Messages and viewing requests from buyers. We don&rsquo;t send email or SMS alerts yet, so check back here.
          </p>

          {statusError ? (
            <p role="alert" className="mb-3 rounded-control border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200">
              {statusError}
            </p>
          ) : null}

          {inquiryState === "loading" && (
            <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading enquiries…</p>
          )}

          {inquiryState === "error" && (
            <p role="alert" className="rounded-control border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200">
              Your enquiries couldn&rsquo;t be loaded. Check your connection and refresh the page.
            </p>
          )}

          {inquiryState === "ready" && inquiries.length === 0 && (
            <p className="rounded-control border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 dark:border-white/15 dark:text-slate-300">
              No enquiries yet. When a buyer messages you or asks to view one of your homes, it shows here.
            </p>
          )}

          {inquiryState === "ready" && inquiries.length > 0 && (
            <ul className="space-y-3">
              {inquiries.map((item) => {
                const isNew = item.status === "new";
                return (
                  <li key={item.id} className="rounded-control border border-slate-200 bg-[#f4f7f7] p-3.5 dark:border-white/10 dark:bg-surface-ink/70">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {item.kind === "message" ? "Message" : "Viewing request"}
                          <span className="font-medium text-slate-600 dark:text-slate-300"> · {item.propertyTitle}</span>
                        </p>
                        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                          {item.contactName || "A buyer"}
                          {item.createdAt ? ` · ${formatDateTime(item.createdAt)}` : ""}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.14em] ${
                          isNew
                            ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-300"
                            : "border-slate-300 bg-white/60 text-slate-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-300"
                        }`}
                      >
                        {isNew ? "New" : "Contacted"}
                      </span>
                    </div>

                    {item.notes ? (
                      <p className="mt-2 whitespace-pre-line text-sm text-slate-800 dark:text-slate-200">{item.notes}</p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                      {item.contactEmail ? (
                        <a href={`mailto:${item.contactEmail}`} className="font-semibold text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-300">
                          {item.contactEmail}
                        </a>
                      ) : null}
                      {item.contactPhone ? (
                        <a href={`tel:${item.contactPhone.replace(/\s+/g, "")}`} className="font-semibold text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-300">
                          {item.contactPhone}
                        </a>
                      ) : null}
                      <button
                        type="button"
                        disabled={savingId === item.id}
                        onClick={() => changeStatus(item, isNew ? "contacted" : "new")}
                        className="pill ml-auto border border-slate-300 bg-white/80 font-semibold text-slate-800 transition-colors hover:bg-white disabled:opacity-60 dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-200 dark:hover:bg-white/10"
                      >
                        {savingId === item.id ? "Saving…" : isNew ? "Mark as contacted" : "Mark as new"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
    </RoleGuard>
  );
}
