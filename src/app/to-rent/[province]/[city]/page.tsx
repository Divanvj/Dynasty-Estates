import type { Metadata } from "next";
import Link from "next/link";

import SiteNavigation from "@/components/site-navigation";
import { BedIcon, BathIcon, CarIcon, LocationPinIcon } from "@/components/icons";
import { getListingsByLocation, enrichedListingToPropertyRecord } from "@/lib/server/property-service";

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

  const title = `Luxury Properties & Apartments To Rent in ${cityName}, ${provName} | Dynasty Estates`;
  const description = `Discover verified executive rentals and luxury apartments in ${cityName}, ${provName}. Features instant digital tenancy applications, move-in cost schedules, and high security.`;
  const canonicalUrl = `https://dynastyestates.co.za/to-rent/${province.toLowerCase()}/${city.toLowerCase()}`;

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

export default async function ToRentLocationPage({
  params,
}: {
  params: Promise<{ province: string; city: string }>;
}) {
  const { province, city } = await params;
  const provName = capitalize(province);
  const cityName = capitalize(city);

  const enrichedListings = getListingsByLocation({
    province: provName,
    city: cityName,
    transactionType: "rent",
  });

  const properties = enrichedListings.map(enrichedListingToPropertyRecord);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://dynastyestates.co.za" },
      { "@type": "ListItem", position: 2, name: "To Rent", item: "https://dynastyestates.co.za/search?intent=rent" },
      { "@type": "ListItem", position: 3, name: provName, item: `https://dynastyestates.co.za/to-rent/${province}` },
      { "@type": "ListItem", position: 4, name: cityName, item: `https://dynastyestates.co.za/to-rent/${province}/${city}` },
    ],
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-900 dark:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <SiteNavigation />

      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumbs Navigation */}
        <nav aria-label="Breadcrumbs" className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <Link href="/" className="hover:text-slate-950 transition-colors dark:text-white">
            Home
          </Link>
          <span>/</span>
          <Link href="/search?intent=rent" className="hover:text-slate-950 transition-colors dark:text-white">
            To Rent
          </Link>
          <span>/</span>
          <span className="text-slate-500 dark:text-slate-400">{provName}</span>
          <span>/</span>
          <span className="text-slate-950 font-bold dark:text-white">{cityName}</span>
        </nav>

        {/* Location Hub Header */}
        <div className="rounded-3xl border border-white/80 bg-white/60 p-6 sm:p-8 backdrop-blur-xl shadow-[0_20px_45px_rgba(36,48,50,0.06)] mb-8 dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/30">
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
              href="/calculators"
              className="rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1 text-slate-700 transition-colors dark:border dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40 dark:hover:text-white"
            >
              Rent vs. Buy Calculator →
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
                <div
                  className="relative h-60 w-full bg-cover bg-center overflow-hidden"
                  style={{ backgroundImage: `url(${prop.image})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="rounded-full bg-emerald-600/90 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white backdrop-blur-md dark:bg-emerald-600 dark:shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                      To Rent
                    </span>
                    <span className="rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                      {prop.type}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-baseline justify-between text-white">
                    <p className="text-xl font-extrabold tracking-tight">{prop.price}</p>
                    <span className="text-xs font-semibold text-slate-300">{prop.area}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 dark:text-white">
                    {prop.title}
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

                  <Link
                    href={`/property/${prop.slug}`}
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 dark:bg-gradient-to-r dark:from-emerald-600 dark:to-emerald-700 dark:text-white dark:border dark:border-emerald-500/30 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] dark:hover:from-emerald-500 dark:hover:to-emerald-600 transition-all"
                  >
                    <span>View Rental Details</span>
                    <span>→</span>
                  </Link>
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

