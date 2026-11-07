import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import AddToCollectionButton from "@/components/add-to-collection-button";
import OnShowBanner from "@/components/on-show-banner";
import ExpandableText from "@/components/expandable-text";
import PropertyHeroGallery from "@/components/property-hero-gallery";
import { featureLabel } from "@/lib/feature-labels";
import PropertyInquiryButton from "@/components/property-inquiry-button";
import PropertyMediaTabs from "@/components/property-media-tabs";
import PrintButton from "@/components/print-button";
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
  PhoneIcon,
  ReceiptIcon,
  ResidentialIcon,
  ShieldCheckIcon,
  SofaIcon,
  WhatsAppIcon,
} from "@/components/icons";
import { formatNumber } from "@/lib/formatters";
import { getListingContact } from "@/lib/listing-contact";
import { getAgentByIdOrSlug } from "@/lib/agents-data";
import { getPropertyBySlug } from "@/lib/property-data";
import { absoluteUrl } from "@/lib/site-url";

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
      title: "Property Details",
      description: "Property details are temporarily unavailable.",
      robots: { index: false, follow: true },
    };
  }

  if (!property) {
    return {
      title: "Property Not Found",
      description: "The requested property listing could not be found.",
    };
  }

  const isRental = property.listingType === "rent";
  const isConcluded = property.status === "Sold" || property.status === "Rented";
  const statusPrefix = isConcluded ? `[${property.status}] ` : "";
  const title = `${statusPrefix}${property.title} | ${isRental ? "To Rent" : "For Sale"} in ${property.suburb || property.city || "South Africa"}`;
  const description = `${property.beds} Bed, ${property.baths} Bath ${property.type} for ${isRental ? "rent" : "sale"} in ${property.location}. Asking ${property.price}. ${property.description.slice(0, 150)}...`;
  const canonicalUrl = absoluteUrl(`/property/${property.slug}`);
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

  const contact = getListingContact(property);
  const agentProfile = property.agentId ? getAgentByIdOrSlug(property.agentId) : null;

  // The body already pads --dyn-mobile-nav-h + safe-area for the tab bar, so
  // this only has to clear the action bar stacked above it. 63 + 76 = 139px
  // against the 120px the two bars now occupy, leaving a small gap. The
  // safe-area inset is not repeated here because the body already applies it.
  //
  // `lg:pb-6`, not `md:pb-6`: the action bar moved from `md:hidden` to
  // `lg:hidden` so it would stop vanishing in the 768–1023px band where the tab
  // bar still shows, and this clearance has to move with it. It did not, so
  // that band ended in 24px of padding under 120px of fixed chrome and the foot
  // of the practitioner card sat behind the action bar.
  return (
    <main className="min-h-screen bg-[var(--background)] px-3 py-4 text-slate-900 pb-[76px] lg:pb-6 md:px-6 lg:px-8 dark:text-white">
      <SeoStructuredData property={property} />
      {/* Feeds the homepage spotlight. Stored in the viewer's browser only. */}
      <RecordPropertyView propertyId={property.id} />
      <div className="mx-auto max-w-[1400px]">
        {/* Listing actions. This was a second site header with a hand-drawn
            "D" tile; brand, menu and account are now SiteHeader (lg+) and
            MobileAppBar, so only what the visitor does with this listing stays.
            Still `relative z-50`: the Share and Collection popovers open from
            here and must clear the hero below. */}
        <div className="no-print relative z-50 mb-6 flex items-center justify-between rounded-card border border-white/75 bg-white/40 px-3.5 py-2.5 backdrop-blur-xl shadow-[0_12px_30px_rgba(36,48,50,0.06)] md:px-6 md:py-3 dark:bg-[#0b1719]/70 dark:border-white/10 dark:shadow-[0_12px_30px_rgba(0,0,0,0.4)]">
          {/*
            One tier, one job: everything here is something the visitor does
            with this listing for themselves — go back, print it, share it,
            keep it. All five are `.pill`, so the row holds a single height and
            a single type size, and none of them is filled.

            It used to run 34 / 30 / 30 / 30 / 32px across two type sizes, and
            the tallest, widest control in it was the back link while the only
            solid fill — Book a Viewing — was shorter than the link beside it.

            `flex-wrap` with `gap-y-2`: the row was `nowrap`, so at the widths
            where five labelled pills do not fit it had nowhere to go. Wrapping
            is what the /ai-search and /map-search headers already do.
          */}
          <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-1.5 gap-y-2 sm:gap-2.5">
            {/* One back link, not two. There were separate desktop and mobile
                copies differing only in whether the label showed — which is
                what `hidden sm:inline` on the label does, with one control. */}
            <Link
              href="/search"
              aria-label="Back to search catalogue"
              className="pill mr-auto border border-slate-300/80 bg-white/60 font-semibold text-slate-700 hover:bg-white transition-all dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Search Catalogue</span>
            </Link>

            <PrintButton label="Print" title="Print this listing or save it as a PDF" />
            <PropertyShareButton title={property.title} />
            <SavePropertyButton propertyId={property.id} />
            {/* Moved up from the practitioner card, where it was the only
                control that did not contact the practitioner. It belongs with
                Save and Share — the other "keep this for me" actions. */}
            <AddToCollectionButton propertyId={property.id} propertyTitle={property.title} />

            {/* No Book a Viewing here. It opened the identical dialog to
                Schedule Private Viewing in the card below, which renders at
                every width, so on desktop the page offered one action twice
                under two names — and stored them under two different `kind`
                values, which is why /inquiries could not show half of them. */}
          </div>
        </div>

        {/* Stands in for the navigation bar on paper, which `.no-print` has
            removed by then. Rendered on the server, so unlike the comparison
            sheet there is no hydration mismatch to design around. */}
        <div className="print-only mb-5 border-b border-slate-300 pb-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-600">
            Dynasty Estates · {property.listingType === "rent" ? "To Rent" : "For Sale"}
          </p>
          <h2 className="text-lg font-bold">{property.title}</h2>
          <p className="text-xs text-slate-600">
            {property.location} · {property.price} · Printed{" "}
            {new Date().toLocaleDateString("en-ZA", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

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
                    <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] font-bold backdrop-blur-md border ${
                      property.listingType === "rent"
                        ? "border-amber-300/60 bg-amber-950/70 text-amber-200"
                        : "border-emerald-300/60 bg-emerald-950/70 text-emerald-200"
                    }`}>
                      {property.listingType === "rent" ? "To Rent" : "For Sale"}
                    </span>
                    {property.status === "Sold" && (
                      <span className="rounded-full border border-red-400 bg-red-950/90 px-3 py-1 text-xs uppercase tracking-widest font-extrabold text-red-200 backdrop-blur-md">
                        Sold by Dynasty Estates
                      </span>
                    )}
                    {property.status === "Rented" && (
                      <span className="rounded-full border border-purple-400 bg-purple-950/90 px-3 py-1 text-xs uppercase tracking-widest font-extrabold text-purple-200 backdrop-blur-md">
                        Let Agreed / Rented
                      </span>
                    )}
                    {property.onShow && (
                      <span className="rounded-full border border-rose-300/80 bg-rose-950/85 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-rose-200 backdrop-blur-md flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                        <span>On Show {property.onShow.date.split(",")[0]}</span>
                      </span>
                    )}
                    {/* Both of these are said again within a screen of here —
                        the transfer-duty exemption by the off-plan banner
                        directly below the hero, the category by the "Category"
                        row in the specs. At 375px they were what tipped this
                        row to three lines and 87px of the photograph. They
                        come back at `sm`, where the row fits on one line. */}
                    {property.developmentInfo?.noTransferDuty && (
                      <span className="hidden rounded-full border border-sky-300/80 bg-sky-950/85 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-sky-200 backdrop-blur-md sm:inline">
                        0% Transfer Duty
                      </span>
                    )}
                    <span className="hidden rounded-full bg-black/40 border border-white/30 px-3 py-1 text-xs uppercase tracking-[0.2em] font-bold text-white backdrop-blur-md sm:inline dark:border-white/10">
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

                {/*
                  Hidden below `lg`, because below `lg` the sticky bar at the
                  foot of this page carries the same label and the same price
                  and never leaves the screen. Two copies of the asking price
                  within one viewport is the duplication this page has been
                  taken apart for twice already, and this copy was the
                  expensive one: it cost the lower third of the photograph.

                  `lg`, not `md`, so it hands over exactly where the sticky bar
                  takes over — see the bar's own note.
                */}
                <div className="hidden text-left lg:block lg:text-right">
                  <span className="text-xs uppercase tracking-widest text-slate-300 block">
                    {property.listingType === "rent" ? "Monthly Rental" : "Asking Price"}
                  </span>
                  {/* nowrap: at 1280px "R 2,950,000" broke after the "R". */}
                  <span className="whitespace-nowrap tabular-nums text-2xl sm:text-3xl font-extrabold text-white md:text-4xl">{property.price}</span>
                </div>
              </div>
        </PropertyHeroGallery>

        {/* Sold / Concluded Listing Retention & Internal Navigation */}
        {(property.status === "Sold" || property.status === "Rented") && (
          <div className="mt-6 rounded-card border border-amber-300/80 bg-gradient-to-r from-amber-50/90 to-orange-50/80 p-5 shadow-sm backdrop-blur-xl dark:border-amber-500/20 dark:from-amber-950/30 dark:to-orange-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="rounded-full bg-amber-800 px-3 py-0.5 text-xs font-extrabold uppercase tracking-widest text-white">
                  Listing Concluded · Historical Record Retained
                </span>
                <h2 className="text-sm sm:text-base font-bold text-slate-950 mt-1.5 dark:text-white">
                  This mandate has been successfully {property.status.toLowerCase()}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Explore other active mandates and property market trends in {property.suburb || property.city || "this region"}.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {property.province && property.city && (
                  <Link
                    href={`/${property.listingType === "rent" ? "to-rent" : "for-sale"}/${property.province.toLowerCase().replace(/\s+/g, "-")}/${property.city.toLowerCase().replace(/\s+/g, "-")}`}
                    className="pill bg-slate-950 font-bold text-white shadow-xs hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors"
                  >
                    View Active {property.city} Listings →
                  </Link>
                )}
                <Link
                  href="/search"
                  className="pill border border-slate-300/80 bg-white/80 font-bold text-slate-800 shadow-xs hover:bg-white dark:bg-surface-panel dark:border-white/10 dark:text-slate-200 transition-colors"
                >
                  Catalogue Search →
                </Link>
              </div>
            </div>
          </div>
        )}

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
          <div className="mt-6 rounded-card border border-sky-200/90 bg-gradient-to-r from-sky-50 via-sky-50/70 to-emerald-50/40 p-4 sm:p-5 shadow-sm backdrop-blur-xl dark:border-sky-500/20 dark:from-sky-950/40 dark:via-sky-950/20 dark:to-emerald-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="rounded-full bg-sky-800 px-3 py-0.5 text-xs font-extrabold uppercase tracking-widest text-white shadow-xs">
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
                <span className="text-xs uppercase font-bold text-slate-600 block dark:text-slate-400">SARS Tax Exemption</span>
                <span className="text-xs font-extrabold text-sky-800 dark:text-sky-300">0% Transfer Duty (VAT Inclusive)</span>
              </div>
            </div>
          </div>
        )}

        {/* Details & Interactive Calculator Grid */}
        {/* grid-cols-1 below lg: the implicit `auto` track sizes to
            max-content and overflowed a 320px screen. See the same fix on the
            home page's market-pulse section. */}
        <section className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            {/* Overview & Key Specs */}
            <div className="rounded-panel border border-white/80 bg-white/55 p-6 shadow-[0_20px_45px_rgba(36,48,50,0.06)] backdrop-blur-xl md:p-8 dark:bg-surface-panel/75 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">Property Overview</h2>
              <ExpandableText
                text={property.description}
                className="leading-7 text-sm text-slate-700 dark:text-slate-300"
              />

              <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4 sm:gap-3">
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
                    /*
                      A bare two-column row on a phone, the stacked tile from
                      `sm` up where four of them fit across.

                      Measured at 375px, these eight facts filled 460px against
                      the 310px Property24 spends on the same card. The tile
                      chrome was most of it: a 32px icon plate and 10px of
                      padding left about 120px for the text, so "Erf / Land
                      Size", "Security Deposit" and "Rates & Taxes" each wrapped
                      their label, and every one of those rows paid for the
                      wrap twice over. On a phone the plate becomes a bare 16px
                      glyph and the label drops its uppercase tracking, which is
                      what buys the single line. Nothing is set below the
                      deliberate 14px floor and no fact is dropped.

                      The tile switch moved from `md` to `sm` so it lands with
                      `sm:grid-cols-4`. The old pairing gave 640–767px four
                      ~150px columns still in row layout — the one width where
                      the plate and the text genuinely could not share a line.
                    */
                    <div
                      key={item.label}
                      className="group flex items-start gap-2 text-left sm:flex-col sm:items-center sm:justify-center sm:gap-0 sm:rounded-control sm:border sm:border-white/80 sm:bg-white/70 sm:p-3.5 sm:text-center sm:transition-all sm:hover:bg-white/90 sm:dark:border-white/10 sm:dark:bg-surface-ink/60 sm:dark:hover:border-emerald-500/30 sm:dark:hover:bg-surface-panel"
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center text-slate-600 sm:mb-2 sm:h-8 sm:w-8 sm:rounded-xl sm:bg-slate-100 sm:text-slate-600 sm:transition-colors sm:group-hover:bg-emerald-50 sm:group-hover:text-emerald-700 dark:text-emerald-400 sm:dark:border sm:dark:border-emerald-500/20 sm:dark:bg-emerald-500/10 sm:dark:group-hover:bg-emerald-500/20">
                        <Icon className="h-4 w-4 shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-600 sm:uppercase sm:tracking-wider dark:text-slate-400">{item.label}</p>
                        <p className="text-xs font-extrabold text-slate-900 sm:mt-1 sm:text-base dark:text-white">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Verified Amenities Checklist */}
              <div className="mt-6 border-t border-slate-200/80 pt-5 sm:mt-8 sm:pt-6 dark:border-white/10">
                <h3 className="mb-3 text-xs font-bold uppercase text-slate-600 sm:tracking-wider dark:text-slate-400">
                  South African Features & Resilience
                </h3>
                {/*
                  Ticked lines on a phone, the emerald chip from `sm` up — the
                  same switch the specs above make, so the two blocks read as
                  one list rather than as two different treatments of the same
                  kind of fact. That is the merge: one column rhythm, one type
                  size, specs then features.

                  Ten chips measured 339px at 375px. Two columns of ~150px
                  against labels like "Inverter & battery" meant most of them
                  wrapped, and each wrap was then boxed in a border and 16px of
                  vertical padding. A tick and a line of text is one row.
                */}
                <div className="grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-3 sm:gap-2">
                  {property.features.map((feat) => (
                    <div
                      key={feat}
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-700 sm:gap-2 sm:rounded-xl sm:border sm:border-emerald-200 sm:bg-emerald-50/80 sm:px-3 sm:py-2 sm:text-emerald-950 dark:text-slate-300 sm:dark:border-emerald-500/30 sm:dark:bg-emerald-500/20 sm:dark:text-emerald-300"
                    >
                      <CheckIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="min-w-0">{featureLabel(feat)}</span>
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
            {/* Contact first (UX Phase 4). The practitioner card used to sit below
                the whole calculator, so on desktop the one thing that wins an
                enquiry was off-screen while a cost estimate took the column. */}
            {/* Agent / Practitioner Card */}
            <div className="rounded-panel border border-white/80 bg-white/55 p-6 shadow-[0_20px_45px_rgba(36,48,50,0.06)] backdrop-blur-xl dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-600 font-bold dark:text-slate-400">Listing agent</p>
              {/* Was hardcoded to one practitioner ("SG / Sherry Gallagher") on
                  every listing in the catalogue. Now resolved per listing. */}
              <div className="mt-4 flex items-center gap-3 rounded-control border border-white/80 bg-white/70 p-3.5 shadow-sm dark:bg-surface-ink/60 dark:border-white/10">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white dark:bg-emerald-600/30 dark:border dark:border-emerald-500/40 dark:text-emerald-300 dark:shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                  {(contact?.name ?? "Dynasty Estates")
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white">
                    {agentProfile ? (
                      <Link
                        href={`/agents/${agentProfile.slug}`}
                        className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        {contact?.name ?? agentProfile.name}
                      </Link>
                    ) : (
                      contact?.name ?? "Dynasty Estates"
                    )}
                  </p>
                  <p className="truncate text-xs text-slate-600 dark:text-slate-400">
                    {contact?.agencyName ?? agentProfile?.agency ?? "Property Practitioner"}
                  </p>
                </div>
              </div>

              {/*
                One main action (UX Phase 4): Book a viewing is the only filled
                control. WhatsApp was a second fill in brand green beside it, so
                the card had two buttons competing for the same glance; WhatsApp,
                Call and Message now sit beneath it as equal secondary buttons.

                WhatsApp and Call stay desktop-only (`lg`): below `lg` the
                sticky bar at the foot of the page carries them under the same
                `contact` condition and never leaves the screen.

                Every control is `pill-lg` (44px, the touch floor). Compare and
                Add to Collection live with Save and Share in the action row at
                the top, since they do not reach the practitioner.
              */}
              <div className="no-print mt-4 md:mt-6 flex flex-col gap-2.5">
                <PropertyInquiryButton
                  propertyId={property.id}
                  propertyTitle={property.title}
                  kind="viewing"
                  className="pill-lg w-full bg-slate-950 font-bold text-white shadow-md hover:bg-slate-800 transition-all cursor-pointer dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white dark:shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                >
                  Book a viewing
                </PropertyInquiryButton>

                <div className={`grid gap-2.5 ${contact ? "lg:grid-cols-3" : ""}`}>
                  {contact && (
                    <>
                      <a
                        href={contact.whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pill-lg hidden w-full border border-slate-300 bg-white/80 font-bold text-slate-800 transition-all hover:bg-white lg:inline-flex dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-200 dark:hover:bg-white/10"
                      >
                        {/* The brand green stays on the mark, where it identifies
                            WhatsApp at a glance without becoming a second CTA. */}
                        <WhatsAppIcon className="h-4 w-4 text-[#128C7E] dark:text-[#25D366]" />
                        WhatsApp
                      </a>
                      <a
                        href={contact.telHref}
                        className="pill-lg hidden w-full border border-slate-300 bg-white/80 font-bold text-slate-800 transition-all hover:bg-white lg:inline-flex dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-200 dark:hover:bg-white/10"
                      >
                        <PhoneIcon className="h-4 w-4" />
                        Call
                      </a>
                    </>
                  )}
                  <PropertyInquiryButton
                    propertyId={property.id}
                    propertyTitle={property.title}
                    kind="message"
                    className="pill-lg w-full border border-slate-300 bg-white/80 font-bold text-slate-800 hover:bg-white transition-all cursor-pointer dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-200 dark:hover:bg-white/10"
                  >
                    Message
                  </PropertyInquiryButton>
                </div>

                {property.listingType === "rent" ? (
                  <TenantApplicationButton
                    propertyId={property.id}
                    propertyTitle={property.title}
                    monthlyRentZAR={property.numericPrice}
                    depositZAR={property.depositRequired}
                  />
                ) : null}
              </div>
            </div>
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
              <div className="rounded-panel border border-white/80 bg-white/55 p-6 shadow-[0_20px_45px_rgba(36,48,50,0.06)] backdrop-blur-xl dark:bg-surface-panel/75 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
                <span className="text-xs uppercase tracking-[0.22em] text-emerald-800 dark:text-emerald-400 font-bold">
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

          </aside>
        </section>
      </div>

      {/* Mobile Sticky Booking Bar.
          Sits ON TOP of the tab bar, not underneath it. At bottom-0 it was
          overlapped by 59 of its 69 pixels, so the asking price and the enquiry
          CTA — the primary conversion action on this page — were hidden on every
          phone. The offset comes from --dyn-mobile-nav-h so the two stay in
          step. Unchanged at md and above, where this bar is hidden anyway. */}
      <div className="no-print fixed bottom-[calc(var(--dyn-mobile-nav-h)+env(safe-area-inset-bottom))] inset-x-0 z-40 px-3 py-1.5 bg-white/95 border-t border-slate-200/80 backdrop-blur-xl lg:hidden flex items-center justify-between gap-3 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] dark:bg-[#081012]/95 dark:border-white/10">
        {/*
          `lg:hidden`, not `md:hidden`. The tab bar this sits on is `lg:hidden`,
          so between 768 and 1023px the page reserved room for the tab bar and
          then showed no price bar above it — the one band of widths with the
          chrome and none of the content. The practitioner card's WhatsApp and
          Call pair moved to `lg` in the same change so the two never both
          appear.

          `py-1.5` rather than `p-3`: the 44px touch target on the right is the
          real floor, and 12px of padding around it made the bar 69px. Stacked
          on the 59px tab bar that was 128px of permanent chrome against
          Property24's 60px. Six pixels puts the bar at 56px and the buttons
          still set its height.
        */}
        <div className="min-w-0">
          <span className="text-xs uppercase tracking-wider text-slate-600 font-bold block dark:text-slate-400">
            {property.listingType === "rent" ? "Monthly Rental" : "Asking Price"}
          </span>
          <span className="block truncate text-base font-extrabold text-slate-950 dark:text-white">{property.price}</span>
        </div>
        {/* Contact first. A buyer on a phone wants to reach the agent, and in
            this market that means WhatsApp or a call rather than a form. The
            tenant-application button that used to sit here is a duplicate of the
            one in the practitioner card below, so the space goes to the two
            channels that did not exist at all. */}
        <div className="flex shrink-0 items-center gap-2">
          {contact && (
            <>
              <a
                href={contact.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`WhatsApp ${contact.name} about this property`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-slate-900 shadow-md transition-all hover:brightness-95"
              >
                <WhatsAppIcon className="h-5 w-5" />
              </a>
              <a
                href={contact.telHref}
                aria-label={`Call ${contact.name} on ${contact.phoneDisplay}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 shadow-sm transition-all hover:bg-slate-50 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                <PhoneIcon className="h-[18px] w-[18px]" />
              </a>
            </>
          )}
          {/* `kind="viewing"`, matching the card's button. This was "tour",
              which is the same dialog under a different stored value — and
              /inquiries filters its "Viewing Appointments" tab on one literal,
              so half the viewing requests landed where nothing looked for
              them. One action, one value. */}
          <PropertyInquiryButton
            propertyId={property.id}
            propertyTitle={property.title}
            kind="viewing"
            className="pill-lg bg-slate-950 font-bold text-white shadow-lg cursor-pointer hover:bg-slate-800 transition-all dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
          >
            <CalendarIcon className="h-4 w-4 text-emerald-400" />
            <span>Viewing</span>
          </PropertyInquiryButton>
        </div>
      </div>
    </main>
  );
}
