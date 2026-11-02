import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import SiteNavigation from "@/components/site-navigation";
import BrandLogo from "@/components/brand-logo";
import AccountActions from "@/components/account-actions";
import { BedIcon, BathIcon, CarIcon, LocationPinIcon } from "@/components/icons";
import { getPropertyList } from "@/lib/property-data";
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
  params: Promise<{ province: string; city: string }>;
}): Promise<Metadata> {
  const { province, city } = await params;
  const provName = capitalize(province);
  const cityName = capitalize(city);

  const title = `Properties & Apartments To Rent in ${cityName}, ${provName}`;
  const description = `Discover verified executive rentals and luxury apartments in ${cityName}, ${provName}. Features instant digital tenancy applications, move-in cost schedules, and high security.`;
  const canonicalUrl = absoluteUrl(`/to-rent/${province.toLowerCase()}/${city.toLowerCase()}`);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | Dynasty Estates`,
      description,
      url: canonicalUrl,
      siteName: "Dynasty Estates South Africa",
      type: "website",
    },
  };
}

export default async function ToRentLocationPage({
  params,
}: {
  params: Promise<{ province: string; city: string }>;
}) {
  const { province, city } = await params;
  const provName = capitalize(province);
  const cityName = capitalize(city);
  const provSlug = province.toLowerCase();
  const citySlug = city.toLowerCase();

  const allProperties = await getPropertyList();
  const enrichedListings = getListingsByLocation({
    province: provName,
    city: cityName,
    transactionType: "rent",
    properties: allProperties,
  });

  const properties = enrichedListings.map(enrichedListingToPropertyRecord);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "To Rent", item: absoluteUrl("/to-rent") },
      { "@type": "ListItem", position: 3, name: provName, item: absoluteUrl(`/to-rent/${provSlug}`) },
      { "@type": "ListItem", position: 4, name: cityName, item: absoluteUrl(`/to-rent/${provSlug}/${citySlug}`) },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Properties & Apartments To Rent in ${cityName}, ${provName}`,
    numberOfItems: properties.length,
    itemListElement: properties.map((prop, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: prop.title,
      url: absoluteUrl(`/property/${prop.slug}`),
    })),
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-900 dark:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
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
          <Link href={`/to-rent/${provSlug}`} className="hover:text-slate-950 transition-colors dark:text-white">
            {provName}
          </Link>
          <span>/</span>
          <span className="text-slate-950 font-bold dark:text-white">{cityName}</span>
        </nav>

        {/* Location Hub Header */}
        <div className="rounded-3xl border border-white/80 bg-white/60 p-6 sm:p-8 backdrop-blur-xl shadow-[0_20px_45px_rgba(36,48,50,0.06)] mb-8 dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <span className="rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase tracking-widest px-3 py-1 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/30">
            Verified Rental Hub
          </span>
          <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            Executive Properties & Apartments To Rent in {cityName}, {provName}
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-3xl leading-relaxed dark:text-slate-300">
            Browse premium rental homes in {cityName}. Benefit from transparent move-in fee schedules, 1-click digital tenancy applications with TPN vetting, and solar energy backup.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-white/10 text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400">Related Nodes:</span>
            <Link
              href={`/for-sale/${province.toLowerCase()}/${city.toLowerCase()}`}
              className="rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1 text-slate-700 transition-colors dark:border dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40 dark:hover:text-white"
            >
              Properties For Sale in {cityName} →
            </Link>
            <Link
              href="/calculators/bond-repayment"
              className="rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1 text-slate-700 transition-colors dark:border dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40 dark:hover:text-white"
            >
              Bond Repayment Calculator →
            </Link>
            <Link
              href="/insights"
              className="rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1 text-slate-700 transition-colors dark:border dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40 dark:hover:text-white"
            >
              Market Rental Trends →
            </Link>
          </div>
        </div>

        {/* Listings Grid */}
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((prop) => (
              <article
                key={prop.id}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/80 bg-white/70 shadow-md backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]"
              >
                {/* Image Showcase */}
                <div className="relative h-60 w-full overflow-hidden">
                  <Image
                    src={prop.image}
                    alt={prop.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                    <span className="rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-white backdrop-blur-md dark:bg-emerald-600 dark:shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                      To Rent
                    </span>
                    <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                      {prop.type}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-baseline justify-between text-white z-10">
                    <p className="text-xl font-extrabold tracking-tight">{prop.price}</p>
                    <span className="text-xs font-semibold text-slate-300">{prop.area}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 dark:text-white">
                    {/* The card's one real link; `card-link` stretches it over
                        the whole card. See globals.css. */}
                    <Link className="card-link" href={`/property/${prop.slug}`}>
                      {prop.title}
                    </Link>
                  </h2>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 line-clamp-1 dark:text-slate-400">
                    <LocationPinIcon className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-400" />
                    <span>{prop.location}</span>
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-white/10 pt-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1">
                      <BedIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
                      <span>{prop.beds} Beds</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BathIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
                      <span>{prop.baths} Baths</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CarIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
                      <span>{prop.parking} Garages</span>
                    </div>
                  </div>

                  {/* A span, not a link: same destination as the title, so as
                      a link it duplicated the tab stop. */}
                  <span
                    aria-hidden="true"
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white shadow-sm group-hover:bg-slate-800 dark:bg-gradient-to-r dark:from-emerald-600 dark:to-emerald-700 dark:text-white dark:border dark:border-emerald-500/30 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] dark:group-hover:from-emerald-500 dark:group-hover:to-emerald-600 transition-all"
                  >
                    <span>View Rental Details</span>
                    <span>→</span>
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/80 bg-white/60 p-12 text-center backdrop-blur-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No active rental listings in {cityName} today</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto dark:text-slate-400">
              Our leasing practitioners onboard new executive rentals weekly. Explore the national catalogue or contact an agent.
            </p>
            <Link
              href="/search?intent=rent"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-5 py-2 text-xs font-bold text-white dark:bg-emerald-600 dark:text-white dark:border dark:border-emerald-500/50 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
            >
              Browse All Rentals →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

