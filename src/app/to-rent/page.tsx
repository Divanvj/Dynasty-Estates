import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import SiteNavigation from "@/components/site-navigation";
import BrandLogo from "@/components/brand-logo";
import AccountActions from "@/components/account-actions";
import { BedIcon, BathIcon, CarIcon, LocationPinIcon } from "@/components/icons";
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
        <div className="flex items-center justify-between rounded-[24px] border border-white/70 bg-white/40 px-4 py-3 backdrop-blur-xl shadow-xs dark:border-white/10 dark:bg-[#0b1719]/70">
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
        <div className="rounded-3xl border border-white/80 bg-white/60 p-6 sm:p-8 backdrop-blur-xl shadow-[0_20px_45px_rgba(36,48,50,0.06)] mb-8 dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
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
              className="rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1 text-slate-700 transition-colors dark:border dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40 dark:hover:text-white"
            >
              Browse Homes For Sale →
            </Link>
            <Link
              href="/calculators/bond-repayment"
              className="rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1 text-slate-700 transition-colors dark:border dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40 dark:hover:text-white"
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
                className="group rounded-2xl border border-white/80 bg-white/70 p-4 backdrop-blur-md shadow-xs hover:border-emerald-400 hover:bg-white hover:shadow-md transition-all dark:bg-[#0c1a1c]/70 dark:border-white/10 dark:hover:border-emerald-500/40"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors dark:text-white">
                    {prov.name}
                  </p>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-[#060d0e]/60 dark:text-slate-300">
                    {prov.count} active
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
              <article
                key={prop.id}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/80 bg-white/70 shadow-md backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]"
              >
                {/*
                  Image Showcase.

                  Mobile sizing across this tile is tuned against the market:
                  it measured 455px on a 375px screen, where Private Property
                  sits at 393 and Property24 at 399, so a visitor here saw 1.8
                  listings per screen against their 2.0. The photograph, the
                  padding and the redundant footer button carry that difference.
                  This is the grid tile, not the horizontal card the home feed
                  and /search use — it keeps its own layout.
                */}
                <div className="relative h-52 md:h-60 w-full overflow-hidden">
                  <Image
                    src={prop.image}
                    alt={prop.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                    <span className="rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-white backdrop-blur-md">
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

                <div className="flex flex-1 flex-col p-4 md:p-5">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 dark:text-white">
                    {/* The card's one real link. `card-link` stretches it over
                        the whole card, and naming it with the title replaces
                        "View Rental Details" as the link text, which said
                        nothing about which property it led to. */}
                    <Link className="card-link" href={`/property/${prop.slug}`}>
                      {prop.title}
                    </Link>
                  </h3>
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

                  {/* A span, not a link: it led to the same listing as the
                      title, so as a link it was a second tab stop and a second
                      announcement for one destination. The card overlay covers
                      it, so clicking it still opens the listing.

                      Desktop only. It is already `aria-hidden` on a tile whose
                      whole surface opens the listing, so on a phone it was 56px
                      of every card restating what tapping anywhere already did.
                      Neither Property24 nor Private Property puts a button on a
                      feed tile. */}
                  <span
                    aria-hidden="true"
                    className="mt-4 hidden md:flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white shadow-sm group-hover:bg-slate-800 dark:bg-gradient-to-r dark:from-emerald-600 dark:to-emerald-700 dark:text-white dark:border dark:border-emerald-500/30 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all"
                  >
                    <span>View Rental Details</span>
                    <span>→</span>
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
