import type { Metadata } from "next";
import PropertyGridCard from "@/components/property-grid-card";
import Link from "next/link";

import SiteNavigation from "@/components/site-navigation";
import BrandLogo from "@/components/brand-logo";
import AccountActions from "@/components/account-actions";
import { getPropertyList, southAfricanProvinces } from "@/lib/property-data";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Properties & Apartments To Rent in South Africa",
  description:
    "Discover verified executive apartments, family homes, and security estate rentals across South Africa. Features transparent move-in schedules and digital tenant vetting.",
  alternates: {
    canonical: absoluteUrl("/to-rent"),
  },
  openGraph: {
    title: "Properties & Apartments To Rent in South Africa | Dynasty Estates",
    description:
      "Discover verified executive apartments, family homes, and security estate rentals across South Africa.",
    url: absoluteUrl("/to-rent"),
    siteName: "Dynasty Estates South Africa",
    type: "website",
  },
};

export default async function ToRentNationalPage() {
  const allProperties = await getPropertyList();
  const rentalProperties = allProperties.filter((p) => p.listingType === "rent");

  const provincesWithCounts = southAfricanProvinces
    .filter((p) => p !== "All Provinces")
    .map((prov) => {
      const count = rentalProperties.filter((p) => p.province === prov).length;
      const slug = prov.toLowerCase().replace(/\s+/g, "-");
      return { name: prov, slug, count };
    });

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "To Rent", item: absoluteUrl("/to-rent") },
    ],
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-900 dark:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* relative z-50: the bar below is a `backdrop-blur` stacking context, so
          at `auto` the page content that follows painted over the Sell / Tools
          dropdowns. See src/app/page.tsx for the full note. */}
      <header className="relative z-50 mx-auto max-w-[1400px] px-4 pt-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between rounded-card border border-white/70 bg-white/40 px-4 py-3 backdrop-blur-xl shadow-xs dark:border-white/10 dark:bg-[#0b1719]/70">
          <BrandLogo />
          <SiteNavigation />
          {/* Without this the header had no account control at all: no profile,
              no sign out, and — since the theme switch moved into this menu — no
              way to change theme on any of the browse routes. */}
          <AccountActions />
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumbs" className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <Link href="/" className="hover:text-slate-950 transition-colors dark:text-white">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-950 font-bold dark:text-white">To Rent</span>
        </nav>

        {/* Hero Header */}
        <div className="rounded-3xl border border-white/80 bg-white/60 p-6 sm:p-8 backdrop-blur-xl shadow-[0_20px_45px_rgba(36,48,50,0.06)] mb-8 dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <span className="rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase tracking-widest px-3 py-1 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/30">
            National Rental Hub
          </span>
          <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            Executive Properties & Apartments To Rent in South Africa
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-3xl leading-relaxed dark:text-slate-300">
            Browse verified luxury rentals across all 9 provinces. Transparent upfront fee schedules, 1-click digital tenancy applications with TPN vetting, and solar energy backup.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-white/10 text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400">Related Hubs:</span>
            <Link
              href="/for-sale"
              className="pill-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors dark:border dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300 dark:hover:bg-surface-panel dark:hover:border-emerald-500/40 dark:hover:text-white"
            >
              Browse Homes For Sale →
            </Link>
            <Link
              href="/calculators/bond-repayment"
              className="pill-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors dark:border dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300 dark:hover:bg-surface-panel dark:hover:border-emerald-500/40 dark:hover:text-white"
            >
              Bond Repayment Calculator →
            </Link>
          </div>
        </div>

        {/* Provincial Grid */}
        <section className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
            Browse Rentals by Province
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {provincesWithCounts.map((prov) => (
              <Link
                key={prov.slug}
                href={`/to-rent/${prov.slug}`}
                className="group rounded-2xl border border-white/80 bg-white/70 p-4 backdrop-blur-md shadow-xs hover:border-emerald-400 hover:bg-white hover:shadow-md transition-all dark:bg-surface-panel/70 dark:border-white/10 dark:hover:border-emerald-500/40"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors dark:text-white">
                    {prov.name}
                  </p>
                  {/* Matches /for-sale: "N active" is seller-portal jargon. */}
                  <span className="badge border border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300">
                    {prov.count} {prov.count === 1 ? "listing" : "listings"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Explore {prov.name} rentals →
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Rentals */}
        <div>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-6">
            Featured South African Rentals ({rentalProperties.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rentalProperties.map((prop) => (
              <PropertyGridCard key={prop.id} property={prop} headingLevel="h3" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
