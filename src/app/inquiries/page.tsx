"use client";

import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";

import { auth } from "@/lib/firebase";
import { formatDate } from "@/lib/formatters";
import { getUserInquiries, type UserInquiry } from "@/lib/user-inquiries";

const labels: Record<string, string> = {
  tour: "Private Tour Appointment",
  viewing: "Viewing Request",
  message: "Direct Practitioner Message",
};

// The two sample enquiries that used to stand in here (one marked
// "Confirmed") were shown as the visitor's own whenever they had none, so
// the page claimed appointments nobody had made. It shows stored ones only.

/** An enquiry sent from /agents is about a practitioner, not a listing. */
function propertyHref(propertyId: string): string | null {
  if (!propertyId || propertyId.startsWith("agent:")) return null;
  return `/property/${propertyId}`;
}

export default function InquiriesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [inquiries, setInquiries] = useState<UserInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterKind, setFilterKind] = useState<string>("all");
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    async function load(currentUser: User | null) {
      setLoading(true);
      try {
        setLoadError(false);
        setInquiries(currentUser ? await getUserInquiries(currentUser.uid) : []);
      } catch {
        setInquiries([]);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }

    if (!auth) {
      void load(null);
      return;
    }

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      void load(currentUser);
    });
  }, []);

  /**
   * "tour" and "viewing" are the same request.
   *
   * `PropertyInquiryButton` branches only on `=== "message"`, so both literals
   * render the identical dialog — but this filter used strict equality against
   * a tab whose id is "tour", so every request sent from the listing card's
   * "Schedule Private Viewing" was stored as "viewing" and never appeared
   * under Viewing Appointments. New requests all write "viewing" now; this
   * accepts both so the ones already in Firestore show up too. The agent
   * dashboard has carried the same pair since it was written.
   */
  const filteredInquiries = inquiries.filter((inq) => {
    if (filterKind === "all") return true;
    if (filterKind === "tour") return inq.kind === "tour" || inq.kind === "viewing";
    return inq.kind === filterKind;
  });

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-5 text-slate-900 md:px-6 lg:px-8 dark:text-white">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="relative z-50 mb-6 flex items-center justify-between rounded-card border border-white/75 bg-white/45 px-5 py-3.5 shadow-[0_12px_28px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2.5 gap-y-2">
            <Link
              href="/saved"
              className="pill border border-slate-300/80 bg-white/60 font-semibold text-slate-700 hover:bg-white transition-all dark:bg-surface-ink/60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
            >
              Saved Homes
            </Link>
            <Link
              href="/search"
              className="pill bg-slate-950 font-bold text-white shadow-md hover:bg-slate-800 transition-all dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
            >
              Browse Catalogue
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <section className="rounded-panel border border-white/80 bg-white/55 p-6 shadow-[0_20px_45px_rgba(36,48,50,0.08)] backdrop-blur-xl mb-6 dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs uppercase font-bold tracking-widest text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border dark:border-emerald-500/30 dark:shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                Buyer Communication Hub
              </span>
              <h1 className="mt-2 text-3xl font-light tracking-tight text-slate-950 md:text-4xl dark:text-white">
                My Appointments &amp; Requests
              </h1>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Track status of viewing appointments, property brochures, and practitioner correspondences.
              </p>
            </div>

            {user ? (
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Signed in as <strong>{user.email}</strong>
              </span>
            ) : null}
          </div>
        </section>

        {/* Filter Pills */}
        <div className="mb-4 flex gap-2">
          {[
            { id: "all", label: "All Requests" },
            { id: "tour", label: "Viewing Appointments" },
            { id: "message", label: "Practitioner Messages" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterKind(tab.id)}
              className={`pill-sm font-semibold transition-all cursor-pointer ${ filterKind === tab.id ? "bg-slate-950 text-white shadow-sm dark:bg-emerald-600 dark:text-white dark:border dark:border-emerald-500/50 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]" : "border border-slate-200 bg-white/60 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300 dark:hover:bg-white/10" }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Inquiries List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div key={n} className="h-24 rounded-card border border-white/60 bg-white/40 animate-pulse dark:bg-surface-panel/60 dark:border-white/10" />
            ))}
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="rounded-card border border-dashed border-slate-300 bg-white/40 p-8 text-center dark:bg-surface-panel/60 dark:border-white/15 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">
              {loadError
                ? "Your requests could not be loaded. Please refresh to try again."
                : !user
                  ? "Sign in to see your viewing requests and messages."
                  : inquiries.length === 0
                    ? "You have not sent any requests yet."
                    : "No requests under this category"}
            </p>
            <Link
              href={!user && !loadError ? "/auth/login" : "/search"}
              className="pill-lg mt-4 bg-slate-950 font-bold text-white transition-all dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
            >
              {!user && !loadError ? "Sign in →" : "Browse Properties →"}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInquiries.map((inquiry) => (
              <article
                key={inquiry.id}
                // `group relative` so the whole row opens the property the
                // enquiry is about, and the button reacts to a hover anywhere
                // on it. Only applies when there is a property to open.
                className="group relative flex flex-col gap-4 rounded-card border border-white/80 bg-white/60 p-5 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between transition-all hover:bg-white dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)] dark:hover:bg-surface-panel dark:hover:border-emerald-500/30"
              >
                <div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-surface-ink/80 dark:text-slate-300 dark:border dark:border-white/10">
                    {labels[inquiry.kind] ?? inquiry.kind}
                  </span>
                  {/* Conditional, because the row's link is: an enquiry whose
                      property has gone has nothing to open, so it stays plain
                      text rather than becoming a link to nowhere. */}
                  <h2 className="mt-1.5 text-base font-bold text-slate-950 dark:text-white">
                    {propertyHref(inquiry.propertyId) ? (
                      <Link className="card-link" href={propertyHref(inquiry.propertyId)!}>
                        {inquiry.propertyTitle}
                      </Link>
                    ) : (
                      inquiry.propertyTitle
                    )}
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5 dark:text-slate-400">
                    Logged: {inquiry.createdAt ? formatDate(inquiry.createdAt) : "Recent"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      inquiry.status === "Confirmed"
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 dark:shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                        : "bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30"
                    }`}
                  >
                    ● {inquiry.status}
                  </span>
                  {propertyHref(inquiry.propertyId) && (
                    /* A span, not a link: same destination as the title above,
                       so as a link it duplicated the tab stop. */
                    <span
                      aria-hidden="true"
                      className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-sm group-hover:bg-slate-800 transition-all dark:bg-emerald-600 dark:group-hover:bg-emerald-500 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                    >
                      View Home →
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
