import type { Metadata } from "next";
import PropertyGridCard from "@/components/property-grid-card";
import Link from "next/link";

import { getPropertyList, matchProvinceName, southAfricanCitiesByProvince } from "@/lib/property-data";
import { getListingsByLocation, enrichedListingToPropertyRecord } from "@/lib/server/property-service";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";
import { jsonLd } from "@/lib/json-ld";

// The catalogue changes without a deploy (listings published, sold, removed),
// so this page is rebuilt at most every 5 minutes. Without it the build-time
// copy was served until the next deploy (found in S1-5: deleted listings
// still showed on the live home page).
export const revalidate = 300;

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

  const title = `Properties & Luxury Homes For Sale in ${matchedProv}`;
  const description = `Explore premier properties, security estates, and luxury homes for sale across ${matchedProv}, South Africa. Verified listings with solar resilience and SARS transfer duty tools.`;
  const canonicalUrl = absoluteUrl(`/for-sale/${province.toLowerCase()}`);

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

export default async function ForSaleProvincePage({
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
    transactionType: "sale",
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
      { "@type": "ListItem", position: 2, name: "For Sale", item: absoluteUrl("/for-sale") },
      { "@type": "ListItem", position: 3, name: provName, item: absoluteUrl(`/for-sale/${provSlug}`) },
    ],
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-900 dark:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
      />
      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumbs Navigation */}
        <nav aria-label="Breadcrumbs" className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <Link href="/" className="hover:text-slate-950 transition-colors dark:text-white">
            Home
          </Link>
          <span>/</span>
          <Link href="/for-sale" className="hover:text-slate-950 transition-colors dark:text-white">
            For Sale
          </Link>
          <span>/</span>
          <span className="text-slate-950 font-bold dark:text-white">{provName}</span>
        </nav>

        {/* Location Hub Header */}
        <div className="rounded-3xl border border-white/80 bg-white/60 p-6 sm:p-8 backdrop-blur-xl shadow-[0_20px_45px_rgba(36,48,50,0.06)] mb-8 dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          {/* rose-700: see the note on /for-sale — #E11D48 is 3.91:1 here. */}
          <span className="rounded-full bg-rose-100 text-rose-700 text-xs font-extrabold uppercase tracking-widest px-3 py-1 dark:bg-rose-500/20 dark:text-rose-300 dark:border dark:border-rose-500/30">
            Provincial Property Hub
          </span>
          <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            Properties & Luxury Homes For Sale in {provName}
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-3xl leading-relaxed dark:text-slate-300">
            {/* "All listings feature Deeds Office history" was not true of any
                listing. SARS transfer duty is genuinely calculated, so it stays. */}
            Browse residential estates, freehold homes and off-plan developments across {provName}, with solar and energy-resilience details and SARS transfer duty estimates.
          </p>
        </div>

        {/* Listings Grid */}
        {properties.length > 0 ? (
          <div>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white mb-6">
              Featured Properties For Sale in {provName} ({properties.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((prop) => (
                <PropertyGridCard key={prop.id} property={prop} headingLevel="h3" />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/80 bg-white/60 p-12 text-center backdrop-blur-xl dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No active for-sale listings in {provName} today</h3>
            <p className="mt-1 text-xs text-slate-600 max-w-md mx-auto dark:text-slate-400">
              Browse our wider national catalogue in the meantime.
            </p>
            <Link
              href="/search?intent=buy"
              className="pill mt-4 gap-1.5 bg-slate-950 font-bold text-white dark:bg-emerald-700 dark:text-white"
            >
              Browse National Catalogue →
            </Link>
          </div>
        )}
        {/* Homes first (owner's mobile review, 20 Nov). The area directory and
            the related links used to sit above the listings, pushing the first
            home 700-1,600px down a phone screen. */}
        <div className="mt-10 space-y-6">
          {/* Cities Directory in this Province */}
          <section className="rounded-3xl border border-white/80 bg-white/50 p-6 backdrop-blur-xl dark:bg-surface-panel/70 dark:border-white/10">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-4">
              Browse {provName} by City & Metro
            </h2>
            <div className="flex flex-wrap gap-2">
              {(citiesWithListings.length > 0 ? citiesWithListings : knownCities.slice(0, 12)).map((city) => {
                const citySlug = city.toLowerCase().replace(/\s+/g, "-");
                return (
                  <Link
                    key={city}
                    href={`/for-sale/${provSlug}/${citySlug}`}
                    className="rounded-xl border border-white/80 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-800 shadow-xs hover:border-emerald-400 hover:bg-white transition-all dark:bg-surface-ink/60 dark:border-white/10 dark:text-slate-200 dark:hover:border-emerald-500/40 dark:hover:bg-surface-panel"
                  >
                    {city} For Sale →
                  </Link>
                );
              })}
            </div>
          </section>
          <nav aria-label="Related pages" className="rounded-3xl border border-white/80 bg-white/50 p-6 backdrop-blur-xl dark:bg-surface-panel/70 dark:border-white/10">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">Also see:</span>
              <Link
                href={`/to-rent/${provSlug}`}
                className="pill-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors dark:border dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300 dark:hover:bg-surface-panel dark:hover:border-emerald-500/40 dark:hover:text-white"
              >
                Rentals in {provName} →
              </Link>
              <Link
                href="/calculators/transfer-duty"
                className="pill-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors dark:border dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300 dark:hover:bg-surface-panel dark:hover:border-emerald-500/40 dark:hover:text-white"
              >
                SARS Transfer Duty Guide →
              </Link>
            </div>
          </nav>
        </div>
      </main>
    </div>
  );
}
