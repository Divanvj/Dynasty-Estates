"use client";

import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";

import AccountActions from "@/components/account-actions";
import { auth } from "@/lib/firebase";
import { getUserInquiries, type UserInquiry } from "@/lib/user-inquiries";

const labels: Record<string, string> = {
  tour: "Private Tour Appointment",
  viewing: "Viewing Request",
  message: "Direct Practitioner Message",
};

const sampleInquiries: UserInquiry[] = [
  {
    id: "inq-1",
    propertyId: "waterkloof-crest",
    propertyTitle: "Waterkloof Crest Architectural Villa",
    kind: "tour",
    status: "Confirmed",
    createdAt: "2026-09-02T14:30:00Z",
  },
  {
    id: "inq-2",
    propertyId: "juniper-ridge",
    propertyTitle: "Juniper Ridge Family Estate",
    kind: "message",
    status: "In progress",
    createdAt: "2026-09-03T09:15:00Z",
  },
];

export default function InquiriesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [inquiries, setInquiries] = useState<UserInquiry[]>(sampleInquiries);
  const [loading, setLoading] = useState(true);
  const [filterKind, setFilterKind] = useState<string>("all");

  useEffect(() => {
    async function load(currentUser: User | null) {
      setLoading(true);
      try {
        if (currentUser) {
          const dbInquiries = await getUserInquiries(currentUser.uid);
          if (dbInquiries.length > 0) {
            setInquiries(dbInquiries);
            return;
          }
        }
        setInquiries(sampleInquiries);
      } catch {
        setInquiries(sampleInquiries);
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

  const filteredInquiries = inquiries.filter((inq) => {
    if (filterKind !== "all" && inq.kind !== filterKind) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-5 text-slate-900 md:px-6 lg:px-8 dark:text-white">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="relative z-50 mb-6 flex items-center justify-between rounded-[28px] border border-white/75 bg-white/45 px-5 py-3.5 shadow-[0_12px_28px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <BrandLogo />
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2.5 gap-y-2">
            <Link
              href="/saved"
              className="rounded-full border border-slate-300/80 bg-white/60 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-white transition-all dark:bg-[#060d0e]/60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
            >
              Saved Homes
            </Link>
            <Link
              href="/search"
              className="rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
            >
              Browse Catalogue
            </Link>
            <AccountActions />
          </div>
        </header>

        {/* Hero Section */}
        <section className="rounded-[32px] border border-white/80 bg-white/55 p-6 shadow-[0_20px_45px_rgba(36,48,50,0.08)] backdrop-blur-xl mb-6 dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] uppercase font-bold tracking-widest text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border dark:border-emerald-500/30 dark:shadow-[0_0_10px_rgba(16,185,129,0.2)]">
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
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
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
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                filterKind === tab.id
                  ? "bg-slate-950 text-white shadow-sm dark:bg-emerald-600 dark:text-white dark:border dark:border-emerald-500/50 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                  : "border border-slate-200 bg-white/60 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Inquiries List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div key={n} className="h-24 rounded-[26px] border border-white/60 bg-white/40 animate-pulse dark:bg-[#0c1a1c]/60 dark:border-white/10" />
            ))}
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/40 p-8 text-center dark:bg-[#0c1a1c]/60 dark:border-white/15 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">No requests under this category</p>
            <Link
              href="/search"
              className="mt-4 inline-block rounded-full bg-slate-950 px-5 py-2 text-xs font-bold text-white transition-all dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
            >
              Browse Properties →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInquiries.map((inquiry) => (
              <article
                key={inquiry.id}
                className="flex flex-col gap-4 rounded-[26px] border border-white/80 bg-white/60 p-5 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between transition-all hover:bg-white dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)] dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/30"
              >
                <div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-[#060d0e]/80 dark:text-slate-300 dark:border dark:border-white/10">
                    {labels[inquiry.kind] ?? inquiry.kind}
                  </span>
                  <h2 className="mt-1.5 text-base font-bold text-slate-950 dark:text-white">{inquiry.propertyTitle}</h2>
                  <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">
                    Logged: {inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleDateString() : "Recent"}
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
                  {inquiry.propertyId && (
                    <Link
                      href={`/property/${inquiry.propertyId}`}
                      className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-all dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                    >
                      View Home →
                    </Link>
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
