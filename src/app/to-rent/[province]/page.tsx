import type { Metadata } from "next";
import PropertyGridCard from "@/components/property-grid-card";
import Link from "next/link";

import SiteNavigation from "@/components/site-navigation";
import BrandLogo from "@/components/brand-logo";
import AccountActions from "@/components/account-actions";
import { getPropertyList, matchProvinceName, southAfricanCitiesByProvince } from "@/lib/property-data";
import { getListingsByLocation, enrichedListingToPropertyRecord } from "@/lib/server/property-service";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";

function capitalize(str: string): string {
  return str
    .split(/[-_ ]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ province: string }>;
}): Promise<Metadata> {
  const { province } = await params;
  const matchedProv = matchProvinceName(province) || capitalize(province);

  const title = `Properties & Apartments To Rent in ${matchedProv}`;
  const description = `Discover verified executive rentals and luxury apartments across ${matchedProv}, South Africa. Includes move-in schedules and digital tenancy applications.`;
  const canonicalUrl = absoluteUrl(`/to-rent/${province.toLowerCase()}`);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Dynasty Estates South Africa",
      type: "website",
    },
  };
}

export default async function ToRentProvincePage({
  params,
}: {
  params: Promise<{ province: string }>;
}) {
  const { province } = await params;
  const provName = matchProvinceName(province) || capitalize(province);
  const provSlug = province.toLowerCase();

  const allProperties = await getPropertyList();
  const enrichedListings = getListingsByLocation({
    province: provName,
    transactionType: "rent",
    properties: allProperties,
  });

  const properties = enrichedListings.map(enrichedListingToPropertyRecord);
  const knownCities = southAfricanCitiesByProvince[provName] ?? [];

  const citiesWithListings = Array.from(
    new Set(
      properties
        .map((p) => p.city)
        .filter((c): c is string => Boolean(c))
    )
  ).sort();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "To Rent", item: absoluteUrl("/to-rent") },
      { "@type": "ListItem", position: 3, name: provName, item: absoluteUrl(`/to-rent/${provSlug}`) },
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
        <div className="flex items-center justify-between rounded-[24px] border border-white/70 bg-white/40 px-4 py-3 backdrop-blur-xl shadow-xs dark:border-white/10 dark:bg-[#0b1719]/70">
          <BrandLogo />
          <SiteNavigation />
          {/* See the note in src/app/for-sale/page.tsx — these browse routes had
              no account control at all. */}
          <AccountActions />
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumbs Navigation */}
        <nav aria-label="Breadcrumbs" className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <Link href="/" className="hover:text-slate-950 transition-colors dark:text-white">
            Home
          </Link>
          <span>/</span>
          <Link href="/to-rent" className="hover:text-slate-950 transition-colors dark:text-white">
            To Rent
          </Link>
          <span>/</span>
          <span className="text-slate-950 font-bold dark:text-white">{provName}</span>
        </nav>

        {/* Location Hub Header */}
        <div className="rounded-3xl border border-white/80 bg-white/60 p-6 sm:p-8 backdrop-blur-xl shadow-[0_20px_45px_rgba(36,48,50,0.06)] mb-8 dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <span className="rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase tracking-widest px-3 py-1 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/30">
            Provincial Rental Hub
          </span>
          <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            Executive Properties & Apartments To Rent in {provName}
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-3xl leading-relaxed dark:text-slate-300">
            Browse verified luxury rentals across {provName}. Transparent move-in schedules, 1-click digital tenancy applications with TPN vetting, and solar energy backup.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-white/10 text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400">Related Nodes:</span>
            <Link
              href={`/for-sale/${provSlug}`}
              className="rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1 text-slate-700 transition-colors dark:border dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40 dark:hover:text-white"
            >
              Properties For Sale in {provName} →
            </Link>
            <Link
              href="/calculators/bond-repayment"
              className="rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1 text-slate-700 transition-colors dark:border dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40 dark:hover:text-white"
            >
              Bond Repayments →
            </Link>
          </div>
        </div>

        {/* Cities Directory in this Province */}
        <section className="mb-10 rounded-3xl border border-white/80 bg-white/50 p-6 backdrop-blur-xl dark:bg-[#0c1a1c]/70 dark:border-white/10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
            Browse {provName} Rentals by City & Metro
          </h2>
          <div className="flex flex-wrap gap-2">
            {(citiesWithListings.length > 0 ? citiesWithListings : knownCities.slice(0, 12)).map((city) => {
              const citySlug = city.toLowerCase().replace(/\s+/g, "-");
              return (
                <Link
                  key={city}
                  href={`/to-rent/${provSlug}/${citySlug}`}
                  className="rounded-xl border border-white/80 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-800 shadow-xs hover:border-emerald-400 hover:bg-white transition-all dark:bg-[#060d0e]/60 dark:border-white/10 dark:text-slate-200 dark:hover:border-emerald-500/40 dark:hover:bg-[#0c1a1c]"
                >
                  {city} Rentals →
                </Link>
              );
            })}
          </div>
        </section>

        {/* Listings Grid */}
        {properties.length > 0 ? (
          <div>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-6">
              Featured Properties To Rent in {provName} ({properties.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((prop) => (
                <PropertyGridCard key={prop.id} property={prop} headingLevel="h3" />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/80 bg-white/60 p-12 text-center backdrop-blur-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No active rental listings in {provName} today</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto dark:text-slate-400">
              Explore our wider national catalogue or register for rental alerts in {provName}.
            </p>
            <Link
              href="/search?intent=rent"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-5 py-2 text-xs font-bold text-white dark:bg-emerald-600 dark:text-white"
            >
              Browse National Rentals →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
