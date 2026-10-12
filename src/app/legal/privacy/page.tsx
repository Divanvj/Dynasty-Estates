"use client";

import Link from "next/link";
import BrandLogo from "@/components/brand-logo";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-3 py-4 text-slate-900 md:px-8 dark:text-white">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between rounded-[26px] border border-white/75 bg-white/45 px-5 py-3.5 shadow-[0_12px_28px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-3">
            <BrandLogo markOnly />
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold dark:text-slate-400">Compliance & Trust</p>
              <h1 className="text-sm font-semibold tracking-wide text-slate-900 dark:text-white">POPIA & Privacy Policy</h1>
            </div>
          </div>
          <Link
            href="/"
            className="rounded-full border border-slate-300/80 bg-white/60 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-white transition-all dark:bg-[#060d0e]/60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
          >
            ← Back to Home
          </Link>
        </header>

        {/* Legal Document Container */}
        <article className="rounded-[32px] border border-white/80 bg-white/65 p-6 shadow-sm backdrop-blur-xl md:p-10 space-y-6 text-xs leading-relaxed text-slate-700 dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)] dark:text-slate-300">
          <div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-800 uppercase tracking-widest dark:bg-emerald-950/70 dark:text-emerald-300 dark:border dark:border-emerald-500/30 dark:shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              Statutory Compliance
            </span>
            <h2 className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">
              Protection of Personal Information Act (POPIA) Notice
            </h2>
            <p className="mt-1 text-slate-500 dark:text-slate-400">Effective Date: 1 September 2026 · Tricore Enterprises / Dynasty Estates</p>
          </div>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">1. Purpose and Operator Role</h3>
            <p>
              Dynasty Estates processes personal data in accordance with the Protection of Personal Information Act No. 4 of 2013 (POPIA) and the Property Practitioners Act No. 22 of 2019 (PPA). We act as a responsible party when collecting buyer, seller, and practitioner credentials.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">2. EXIF & Metadata Scrubbing on Property Media</h3>
            <p>
              In compliance with Section 14 (Security Measures on Integrity of Personal Information), all property photographs uploaded by private sellers or practitioners undergo automated server-side EXIF metadata stripping. Embedded GPS coordinates and camera hardware identifiers are completely removed prior to public CDN delivery.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">3. Lead & Inquiry Disclosures</h3>
            <p>
              When submitting viewing appointments or messages to verified practitioners, your contact details (Full name, telephone number, email address, and pre-qualification status) are transmitted exclusively to the designated mandate practitioner. Your information is never sold to third-party marketing brokers.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">4. Data Subject Rights & Deletion</h3>
            <p>
              You maintain the statutory right to request access to, rectification of, or erasure of your personal records and saved property searches. Contact our Information Officer at <strong className="text-slate-900 dark:text-white">privacy@dynastyestates.co.za</strong>.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}

