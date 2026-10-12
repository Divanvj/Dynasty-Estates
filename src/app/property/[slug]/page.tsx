import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import OnShowBanner from "@/components/on-show-banner";
import PropertyHeroGallery from "@/components/property-hero-gallery";
import PropertyInquiryButton from "@/components/property-inquiry-button";
import PropertyMediaTabs from "@/components/property-media-tabs";
import PropertyShareButton from "@/components/property-share-button";
import RecordPropertyView from "@/components/record-property-view";
import SavePropertyButton from "@/components/save-property-button";
import SeoStructuredData from "@/components/seo-structured-data";
import TenantApplicationButton from "@/components/tenant-application-button";
import TrueCostCalculator from "@/components/true-cost-calculator";
import {
  AreaIcon,
  ArrowLeftIcon,
  BathIcon,
  BedIcon,
  BuildingLibraryIcon,
  CalendarIcon,
  CarIcon,
  CheckIcon,
  LandPlotIcon,
  LocationPinIcon,
  ReceiptIcon,
  ResidentialIcon,
  ShieldCheckIcon,
  SofaIcon,
} from "@/components/icons";
import { formatNumber } from "@/lib/formatters";
import { getPropertyBySlug } from "@/lib/property-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  // generateMetadata runs outside the route's error boundary, so an exception
  // here is an unrecoverable 500 no matter what error.tsx says. A failed
  // catalogue read must therefore degrade to generic metadata and let the page
  // itself surface the problem through the boundary.
  let property: Awaited<ReturnType<typeof getPropertyBySlug>> = null;
  try {
    property = await getPropertyBySlug(slug);
  } catch (error) {
    console.error(`Could not load metadata for property "${slug}":`, error);
    return {
      title: "Property | Dynasty Estates",
      description: "Property details are temporarily unavailable.",
      robots: { index: false, follow: true },
    };
  }

  if (!property) {
    return {
      title: "Property Not Found | Dynasty Estates",
      description: "The requested property listing could not be found.",
    };
  }

  const isRental = property.listingType === "rent";
  const title = `${property.title} | ${isRental ? "To Rent" : "For Sale"} in ${property.suburb || property.city || "South Africa"}`;
  const description = `${property.beds} Bed, ${property.baths} Bath ${property.type} for ${isRental ? "rent" : "sale"} in ${property.location}. Asking ${property.price}. ${property.description.slice(0, 150)}...`;
  const canonicalUrl = `https://dynastyestates.co.za/property/${property.slug}`;
  const primaryImage = property.gallery && property.gallery.length > 0 ? property.gallery[0] : property.image;

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
      images: [
        {
          url: primaryImage,
          width: 1200,
          height: 630,
          alt: property.title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [primaryImage],
    },
  };
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);

  if (!property) {
    notFound();
  }

  // The body already pads 68px + safe-area for the tab bar, so this only has to
  // clear the action bar stacked above it (69px). 68 + 76 = 144px against the
  // 128px the two bars occupy, leaving a small gap. The safe-area inset is not
  // repeated here because the body already applies it. `md:pb-6` keeps the
  // desktop value exactly as it was.
  return (
    <main className="min-h-screen bg-[var(--background)] px-3 py-4 text-slate-900 pb-[76px] md:pb-6 md:px-6 lg:px-8 dark:text-white">
      <SeoStructuredData property={property} />
      {/* Feeds the homepage spotlight. Stored in the viewer's browser only. */}
      <RecordPropertyView propertyId={property.id} />
      <div className="mx-auto max-w-[1400px]">
        {/* Navigation Header */}
        <header className="relative z-50 mb-6 flex items-center justify-between rounded-[24px] border border-white/75 bg-white/40 px-3.5 py-2.5 backdrop-blur-xl shadow-[0_12px_30px_rgba(36,48,50,0.06)] md:px-6 md:py-3 dark:bg-[#0b1719]/70 dark:border-white/10 dark:shadow-[0_12px_30px_rgba(0,0,0,0.4)]">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white shadow-md">
              D
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Dynasty</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-300">Estates</p>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Desktop Back button */}
            <Link
              href="/search"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-300/80 bg-white/60 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-white transition-all dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              <span>Search Catalogue</span>
            </Link>

            {/* Mobile Back button */}
            <Link
              href="/search"
              className="sm:hidden flex items-center justify-center h-8 w-8 rounded-full border border-slate-300/80 bg-white/60 text-slate-700 hover:bg-white transition-all dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-200 dark:hover:bg-white/10"
              aria-label="Back to search catalogue"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>

            <PropertyShareButton title={property.title} />
            <SavePropertyButton propertyId={property.id} />

            {/* Desktop Booking CTA */}
            <div className="hidden md:block">
              <PropertyInquiryButton
                propertyId={property.id}
                propertyTitle={property.title}
                kind="tour"
                className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-slate-800 cursor-pointer transition-all dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
              >
                Book a Viewing
              </PropertyInquiryButton>
            </div>
          </div>
        </header>

        {/* Photographs lead. The on-show and off-plan banners used to sit above
            the hero and pushed it below the fold; they are supporting context
            and now follow it. */}

        {/* Hero Media Showcase — crossfading slideshow with a thumbnail rail. */}
        <PropertyHeroGallery
          title={property.title}
          images={property.gallery?.length ? property.gallery : [property.image]}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold backdrop-blur-md border ${
                      property.listingType === "rent"
                        ? "border-amber-300/60 bg-amber-950/70 text-amber-200"
                        : "border-emerald-300/60 bg-emerald-950/70 text-emerald-200"
                    }`}>
                      {property.listingType === "rent" ? "To Rent" : "For Sale"}
                    </span>
                    {property.onShow && (
                      <span className="rounded-full border border-rose-300/80 bg-rose-950/85 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-rose-200 backdrop-blur-md flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                        <span>On Show {property.onShow.date.split(",")[0]}</span>
                      </span>
                    )}
                    {property.developmentInfo?.noTransferDuty && (
                      <span className="rounded-full border border-sky-300/80 bg-sky-950/85 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-sky-200 backdrop-blur-md">
                        0% Transfer Duty
                      </span>
                    )}
                    <span className="rounded-full bg-black/40 border border-white/30 px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold text-white backdrop-blur-md dark:border-white/10">
                      {property.category}
                    </span>
                  </div>
                  <h1 className="mt-1 text-2xl font-light tracking-[-0.04em] text-white sm:text-4xl md:text-5xl lg:text-6xl">
                    {property.title}
                  </h1>
                  <div className="flex items-center gap-1.5 text-xs text-slate-200 mt-1 md:text-sm">
                    <LocationPinIcon className="h-4 w-4 text-emerald-300 shrink-0" />
                    <span>{property.location}</span>
                  </div>
                </div>

                <div className="text-left md:text-right">
                  <span className="text-[10px] uppercase tracking-widest text-slate-300 block">
                    {property.listingType === "rent" ? "Monthly Rental" : "Asking Price"}
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-white md:text-4xl">{property.price}</span>
                </div>
              </div>
        </PropertyHeroGallery>

        {/* On Show Weekend Viewing Showcase */}
        {property.onShow && (
          <div className="mt-6">
            <OnShowBanner
              propertyTitle={property.title}
              location={property.location}
              onShow={property.onShow}
            />
          </div>
        )}

        {/* Developer Off-Plan Release Banner */}
        {property.isDevelopment && property.developmentInfo && (
          <div className="mt-6 rounded-[26px] border border-sky-200/90 bg-gradient-to-r from-sky-50 via-sky-50/70 to-emerald-50/40 p-4 sm:p-5 shadow-sm backdrop-blur-xl dark:border-sky-500/20 dark:from-sky-950/40 dark:via-sky-950/20 dark:to-emerald-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="rounded-full bg-sky-800 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-xs">
                  Official Off-Plan Development Release
                </span>
                <h2 className="text-sm sm:text-base font-bold text-slate-950 mt-1.5 dark:text-white">
                  {property.developmentInfo.developerName} · {property.developmentInfo.phase}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Target Completion: <strong className="text-slate-800 dark:text-slate-300">{property.developmentInfo.estimatedCompletion}</strong> ·{" "}
                  {property.developmentInfo.unitsAvailable} Units Available Directly from Developer
                </p>
              </div>
              <div className="rounded-2xl border border-sky-300 bg-white/95 px-4 py-2 text-center shadow-xs shrink-0 self-start sm:self-auto dark:bg-sky-950/60 dark:border-sky-500/30">
                <span className="text-[10px] uppercase font-bold text-slate-500 block dark:text-slate-400">SARS Tax Exemption</span>
                <span className="text-xs font-extrabold text-sky-800 dark:text-sky-300">0% Transfer Duty (VAT Inclusive)</span>
              </div>
            </div>
          </div>
        )}

        {/* Details & Interactive Calculator Grid */}
        <section className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            {/* Overview & Key Specs */}
            <div className="rounded-[30px] border border-white/80 bg-white/55 p-6 shadow-[0_20px_45px_rgba(36,48,50,0.06)] backdrop-blur-xl md:p-8 dark:bg-[#0c1a1c]/75 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">Property Overview</h2>
              <p className="mt-4 leading-7 text-sm text-slate-700 dark:text-slate-300">{property.description}</p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Bedrooms", value: `${property.beds} Beds`, icon: BedIcon },
                  { label: "Bathrooms", value: `${property.baths} Baths`, icon: BathIcon },
                  { label: "Floor Area", value: property.area, icon: AreaIcon },
                  { label: "Garages", value: `${property.parking} Spaces`, icon: CarIcon },
                  ...(property.erfSize
                    ? [{ label: "Erf / Land Size", value: property.erfSize, icon: LandPlotIcon }]
                    : []),
                  ...(property.listingType === "rent"
                    ? [
                        { label: "Lease Term", value: property.leaseTerm ?? "12 Months", icon: CalendarIcon },
                        { label: "Furnished", value: property.furnishedStatus ?? "Unfurnished", icon: SofaIcon },
                        {
                          label: "Security Deposit",
                          value: property.depositRequired
                            ? `R ${formatNumber(property.depositRequired)}`
                            : "1.5 Months",
                          icon: ShieldCheckIcon,
                        },
                        { label: "Category", value: "Rental Residence", icon: ResidentialIcon },
                      ]
                    : [
                        ...(property.ratesAndTaxes
                          ? [{ label: "Rates & Taxes", value: `R ${formatNumber(property.ratesAndTaxes)}/m`, icon: ReceiptIcon }]
                          : []),
                        ...(property.levies
                          ? [{ label: "Monthly Levies", value: `R ${formatNumber(property.levies)}/m`, icon: BuildingLibraryIcon }]
                          : []),
                        { label: "Category", value: property.category || property.type || "Luxury Residence", icon: ResidentialIcon },
                      ]),
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="group flex flex-col items-center justify-center rounded-[20px] border border-white/80 bg-white/70 p-3.5 text-center transition-all hover:bg-white/90 dark:bg-[#060d0e]/60 dark:border-white/10 dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/30"
                    >
                      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border dark:border-emerald-500/20 dark:group-hover:bg-emerald-500/20">
                        <Icon className="h-4 w-4 shrink-0" />
                      </div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold dark:text-slate-400">{item.label}</p>
                      <p className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">{item.value}</p>
                    </div>
                  );
                })}
              </div>

              {/* Verified Amenities Checklist */}
              <div className="mt-8 border-t border-slate-200/80 dark:border-white/10 pt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 dark:text-slate-400">
                  Verified South African Features & Resilience
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {property.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs font-medium text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300">
                      <CheckIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{feat.replace("_", " ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Media Tabs: High-Res Photos, Architectural Floor Plan & 3D Virtual Tour */}
            <PropertyMediaTabs
              title={property.title}
              gallery={property.gallery}
              floorPlanImage={property.floorPlanImage}
              virtualTourUrl={property.virtualTourUrl}
              area={property.area}
              erfSize={property.erfSize}
              location={property.location}
            />
          </div>

          {/* Sidebar: True Cost Calculator & Agent Contact */}
          <aside className="space-y-6">
            {/* Interactive True Cost Calculator */}
            <TrueCostCalculator
              listingType={property.listingType ?? "sale"}
              askingPriceZAR={property.numericPrice || (property.listingType === "rent" ? 35000 : 4850000)}
              monthlyLevy={property.levies || 2400}
              monthlyRates={property.ratesAndTaxes || 1950}
              leaseTerm={property.leaseTerm}
              depositRequiredZAR={property.depositRequired}
              furnishedStatus={property.furnishedStatus}
            />

            {/* Move-In Cost Schedule for Rentals */}
            {property.listingType === "rent" && (
              <div className="rounded-[30px] border border-white/80 bg-white/55 p-6 shadow-[0_20px_45px_rgba(36,48,50,0.06)] backdrop-blur-xl dark:bg-[#0c1a1c]/75 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
                <span className="text-[10px] uppercase tracking-[0.22em] text-emerald-800 dark:text-emerald-400 font-bold">
                  Move-In Capital Transparency
                </span>
                <h3 className="mt-1 text-sm font-bold text-slate-950 dark:text-white">Estimated Move-In Schedule</h3>
                <div className="mt-4 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>First Month Rental:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">R {formatNumber(property.numericPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Refundable Damage Deposit:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      R {formatNumber(property.depositRequired || Math.round(property.numericPrice * 1.5))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lease Prep & TPN Vetting Fee:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">R 1,500</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Key & Access Remote Deposit:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">R 750</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/80 dark:border-white/10 pt-2 font-bold text-slate-950 text-sm dark:text-white">
                    <span>Total Move-In Due:</span>
                    <span className="text-emerald-800 dark:text-emerald-400">
                      R {formatNumber(
                        property.numericPrice +
                        (property.depositRequired || Math.round(property.numericPrice * 1.5)) +
                        2250
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Agent / Practitioner Card */}
            <div className="rounded-[30px] border border-white/80 bg-white/55 p-6 shadow-[0_20px_45px_rgba(36,48,50,0.06)] backdrop-blur-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-bold dark:text-slate-400">Mandate Property Practitioner</p>
              <div className="mt-4 flex items-center gap-3 rounded-[22px] border border-white/80 bg-white/70 p-3.5 shadow-sm dark:bg-[#060d0e]/60 dark:border-white/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white dark:bg-emerald-600/30 dark:border dark:border-emerald-500/40 dark:text-emerald-300 dark:shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                  SG
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Sherry Gallagher</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Senior Property Practitioner · PPRA Verified</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                {property.listingType === "rent" ? (
                  <TenantApplicationButton
                    propertyId={property.id}
                    propertyTitle={property.title}
                    monthlyRentZAR={property.numericPrice}
                    depositZAR={property.depositRequired}
                  />
                ) : null}

                <PropertyInquiryButton
                  propertyId={property.id}
                  propertyTitle={property.title}
                  kind="viewing"
                  className="rounded-full bg-slate-950 px-4 py-3 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all cursor-pointer text-center dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white dark:shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                >
                  Schedule Private Viewing
                </PropertyInquiryButton>
                <PropertyInquiryButton
                  propertyId={property.id}
                  propertyTitle={property.title}
                  kind="message"
                  className="rounded-full border border-slate-300 bg-white/80 px-4 py-3 text-xs font-bold text-slate-800 hover:bg-white transition-all cursor-pointer text-center dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  Message Practitioner
                </PropertyInquiryButton>
              </div>

              <div className="mt-6 border-t border-slate-200/60 dark:border-white/10 pt-4 flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <Link href="/compare" className="hover:text-slate-950 underline dark:text-white dark:hover:text-emerald-400">
                  Compare with other homes →
                </Link>
                <Link href="/collections" className="hover:text-slate-950 underline dark:text-white dark:hover:text-emerald-400">
                  Add to Collection →
                </Link>
              </div>
            </div>
          </aside>
        </section>
      </div>

      {/* Mobile Sticky Booking Bar.
          Sits ON TOP of the tab bar, not underneath it. At bottom-0 it was
          overlapped by 59 of its 69 pixels, so the asking price and the enquiry
          CTA — the primary conversion action on this page — were hidden on every
          phone. The offset comes from --dyn-mobile-nav-h so the two stay in
          step. Unchanged at md and above, where this bar is hidden anyway. */}
      <div className="fixed bottom-[calc(var(--dyn-mobile-nav-h)+env(safe-area-inset-bottom))] inset-x-0 z-40 p-3 bg-white/95 border-t border-slate-200/80 backdrop-blur-xl md:hidden flex items-center justify-between shadow-[0_-8px_24px_rgba(15,23,42,0.12)] dark:bg-[#081012]/95 dark:border-white/10">
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block dark:text-slate-400">
            {property.listingType === "rent" ? "Monthly Rental" : "Asking Price"}
          </span>
          <span className="text-base font-extrabold text-slate-950 dark:text-white">{property.price}</span>
        </div>
        <div className="flex items-center gap-2">
          {property.listingType === "rent" && (
            <TenantApplicationButton
              propertyId={property.id}
              propertyTitle={property.title}
              monthlyRentZAR={property.numericPrice}
              depositZAR={property.depositRequired}
              className="rounded-full bg-emerald-800 px-3.5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 cursor-pointer"
            />
          )}
          <PropertyInquiryButton
            propertyId={property.id}
            propertyTitle={property.title}
            kind="tour"
            className="flex items-center gap-1.5 rounded-full bg-slate-950 px-4 py-2.5 text-xs font-bold text-white shadow-lg cursor-pointer hover:bg-slate-800 transition-all dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
          >
            <CalendarIcon className="h-4 w-4 text-emerald-400" />
            <span>Viewing</span>
          </PropertyInquiryButton>
        </div>
      </div>
    </main>
  );
}
