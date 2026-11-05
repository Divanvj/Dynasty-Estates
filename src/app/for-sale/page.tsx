import type { Metadata } from "next";
import PropertyGridCard from "@/components/property-grid-card";
import Link from "next/link";

import SiteNavigation from "@/components/site-navigation";
import BrandLogo from "@/components/brand-logo";
import AccountActions from "@/components/account-actions";
import { getPropertyList, southAfricanProvinces } from "@/lib/property-data";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Properties & Luxury Homes For Sale in South Africa",
  description:
    "Explore luxury freehold homes, high-security golf estates, and modern apartments for sale across South Africa. Verified listings with solar power and Deeds Office price history.",
  alternates: {
    canonical: absoluteUrl("/for-sale"),
  },
  openGraph: {
    title: "Properties & Luxury Homes For Sale in South Africa | Dynasty Estates",
    description:
      "Explore luxury freehold homes, high-security golf estates, and modern apartments for sale across South Africa.",
    url: absoluteUrl("/for-sale"),
    siteName: "Dynasty Estates South Africa",
    type: "website",
  },
};

export default async function ForSaleNationalPage() {
  const allProperties = await getPropertyList();
  const saleProperties = allProperties.filter((p) => p.listingType !== "rent");

  const provincesWithCounts = southAfricanProvinces
    .filter((p) => p !== "All Provinces")
    .map((prov) => {
      const count = saleProperties.filter((p) => p.province === prov).length;
      const slug = prov.toLowerCase().replace(/\s+/g, "-");
      return { name: prov, slug, count };
    });

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "For Sale", item: absoluteUrl("/for-sale") },
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
      {/* Hidden below lg: brand, nav and account all live in MobileAppBar now. */}
      <header className="relative z-50 mx-auto hidden max-w-[1400px] px-4 pt-4 sm:px-6 lg:block lg:px-8">
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
          <span className="text-slate-950 font-bold dark:text-white">For Sale</span>
        </nav>

        {/* Hero Header */}
        <div className="rounded-3xl border border-white/80 bg-white/60 p-6 sm:p-8 backdrop-blur-xl shadow-[0_20px_45px_rgba(36,48,50,0.06)] mb-8 dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <span className="rounded-full bg-rose-100 text-[#E11D48] text-xs font-extrabold uppercase tracking-widest px-3 py-1 dark:bg-rose-500/20 dark:text-rose-300 dark:border dark:border-rose-500/30">
            National Property Hub
          </span>
          <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            Properties & Luxury Homes For Sale in South Africa
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-3xl leading-relaxed dark:text-slate-300">
            Explore verified residential opportunities across all 9 provinces. Compare SARS transfer duty liabilities, evaluate solar energy resilience, and connect with PPRA certified practitioners.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-white/10 text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400">Related Hubs:</span>
            <Link
              href="/to-rent"
              className="pill-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors dark:border dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300 dark:hover:bg-surface-panel dark:hover:border-emerald-500/40 dark:hover:text-white"
            >
              Browse National Rentals →
            </Link>
            <Link
              href="/calculators/transfer-duty"
              className="pill-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors dark:border dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300 dark:hover:bg-surface-panel dark:hover:border-emerald-500/40 dark:hover:text-white"
            >
              SARS Transfer Duty Calculator →
            </Link>
          </div>
        </div>

        {/* Provincial Grid */}
        <section className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
            Browse by Province
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {provincesWithCounts.map((prov) => (
              <Link
                key={prov.slug}
                href={`/for-sale/${prov.slug}`}
                className="group rounded-2xl border border-white/80 bg-white/70 p-4 backdrop-blur-md shadow-xs hover:border-emerald-400 hover:bg-white hover:shadow-md transition-all dark:bg-surface-panel/70 dark:border-white/10 dark:hover:border-emerald-500/40"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors dark:text-white">
                    {prov.name}
                  </p>
                  {/* "N active" was listing-lifecycle jargon on a page meant
                      for buyers: "active" is a status in the seller portal, not
                      a word anyone browsing provinces uses. */}
                  <span className="badge border border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300">
                    {prov.count} {prov.count === 1 ? "listing" : "listings"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Explore {prov.name} homes →
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Listings */}
        <div>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-6">
            Featured South African Mandates ({saleProperties.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {saleProperties.map((prop) => (
              <PropertyGridCard key={prop.id} property={prop} headingLevel="h3" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
