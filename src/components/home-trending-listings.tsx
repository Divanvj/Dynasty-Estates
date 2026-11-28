"use client";

import Link from "next/link";
import { useState } from "react";

import SavePropertyButton from "@/components/save-property-button";
import PropertyListCard from "@/components/property-list-card";
import PropertyCompactTable from "@/components/property-compact-table";
import CustomSelect from "@/components/custom-select";
import ViewSwitch, { type ViewMode } from "@/components/view-switch";
import PropertySplitMapView from "@/components/property-split-map-view";
import {
  AreaIcon,
  BathIcon,
  BedIcon,
  LocationPinIcon,
} from "@/components/icons";
import { featureLabel } from "@/lib/feature-labels";
import { getDisplayTag, type PropertyRecord } from "@/lib/property-data";
import { DEFAULT_SEARCH_INTENT, type SearchIntent, rememberIntent, useRememberedIntent } from "@/lib/search-intent";
import { LG_QUERY, useMediaQuery } from "@/lib/use-media-query";

const ALL_TYPES = "All";
/** The order types are offered in; any other type follows alphabetically. */
const TYPE_ORDER = ["House", "Villa", "Estate Home", "Apartment", "Penthouse", "Townhouse"];
const typeRank = (type: string) => (TYPE_ORDER.indexOf(type) + 1 || TYPE_ORDER.length + 1);

export default function HomeTrendingListings({ properties }: { properties: PropertyRecord[] }) {
  // The visitor's For Sale / To Rent choice for the session, shared with the
  // hero search and the catalogue (lib/search-intent.ts); For Sale until
  // they choose. One store, so the hero and this feed can't disagree.
  const intent = useRememberedIntent() ?? DEFAULT_SEARCH_INTENT;
  const [chosenType, setChosenType] = useState(ALL_TYPES);
  // List by default everywhere (owner, 25 Nov), undoing U3's desktop Grid
  // default; Grid is one click away on desktop. The home page is taller at
  // 1280 as a result (about 1,400px), which the owner accepted.
  const [selectedView, setViewMode] = useState<ViewMode>("list");

  /**
   * Phones get List and Map; Grid and Table are desktop-only, matching
   * /search.
   *
   * Coerced as well as hidden in the markup. This mode is local state with no
   * URL or storage behind it, so a phone cannot arrive in Grid — but a desktop
   * window narrowed past `lg`, or a tablet rotated, carries the choice with it
   * into a layout whose control is no longer on screen.
   */
  const isDesktop = useMediaQuery(LG_QUERY, true);
  const viewMode: ViewMode = isDesktop || selectedView === "map" ? selectedView : "list";

  function handleIntentChange(newIntent: SearchIntent) {
    rememberIntent(newIntent);
  }

  // Strict separation: Zero mixing of buy and rent!
  const onThisSide = properties.filter((p) => (p.listingType === "rent") === (intent === "rent"));

  // Only types that have a home on this side (owner, 28 Nov), so a choice can
  // never lead to an empty section. A type chosen on the other side that has
  // none here reads as All, and comes back when the visitor switches back.
  const availableTypes = [...new Set<string>(onThisSide.map((p) => p.type))].sort(
    (a, b) => typeRank(a) - typeRank(b) || a.localeCompare(b),
  );
  const activeFilter = availableTypes.includes(chosenType) ? chosenType : ALL_TYPES;
  const filtered = activeFilter === ALL_TYPES ? onThisSide : onThisSide.filter((p) => p.type === activeFilter);

  /*
    Six homes, then a way into the full search. The home page used to render
    the entire catalogue here as long cards with full descriptions (~6,500px of
    page at 1280). Map and Table keep every match: they are overviews.
    No total count on the link — counts belong on results, not the home page.
  */
  const FEATURED_COUNT = 6;
  const featured = filtered.slice(0, FEATURED_COUNT);
  const seeAllHref = `/search?intent=${intent}${activeFilter !== ALL_TYPES ? `&type=${encodeURIComponent(activeFilter)}` : ""}`;

  /*
    Full-bleed below `md`. This panel is a bordered, padded, blurred box whose
    only contents are bordered, padded, blurred cards — a frame around frames.
    On a 375px screen it cost 34px, and with `main`'s own gutter that left the
    cards 317px of 375: about 15% of the display spent on nested chrome.

    The panel still earns its keep on desktop, where it groups the feed against
    a wide background. On a phone the viewport edge already does that job.

    Note: this has to sit outside the `return (`. A braced JSX comment is an
    expression container, valid only inside JSX — placed before the root element
    it parses as an object literal, and the element after it then fails.
  */
  return (
    <section id="listings" className="mx-auto mt-8 max-w-[1440px] rounded-panel border border-white/45 bg-white/35 dark:border-white/10 dark:bg-surface-panel/65 p-4 shadow-[0_20px_45px_rgba(15,23,42,0.06)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)] backdrop-blur-xl md:p-6 max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:p-0 max-md:shadow-none max-md:backdrop-blur-none dark:max-md:bg-transparent">
      <div className="border-b border-slate-200/60 dark:border-white/10 pb-4">
        {/* `flex-wrap`, and the separator dot hides once it wraps. The
            eyebrow is `tracking-[0.22em]` uppercase, so at 320px it and the
            169px toggle needed 20px more than the row had and pushed the
            document into a horizontal scroll. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {/* Direct Rent vs Buy Switcher */}
          <div className="inline-flex rounded-full border border-slate-200/90 bg-white/80 dark:border-white/10 dark:bg-surface-ink/60 p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => handleIntentChange("buy")}
              className={`pill-sm font-bold transition-all cursor-pointer ${ intent === "buy" ? "bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-700 dark:to-emerald-800 text-white shadow-sm dark:shadow-[0_0_12px_rgba(16,185,129,0.3)]" : "text-slate-600 dark:text-slate-300 hover:text-emerald-950 dark:hover:text-white" }`}
            >
              For Sale
            </button>
            <button
              type="button"
              onClick={() => handleIntentChange("rent")}
              className={`pill-sm font-bold transition-all cursor-pointer ${ intent === "rent" ? "bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-700 dark:to-emerald-800 text-white shadow-sm dark:shadow-[0_0_12px_rgba(16,185,129,0.3)]" : "text-slate-600 dark:text-slate-300 hover:text-emerald-950 dark:hover:text-white" }`}
            >
              To Rent
            </button>
          </div>
        </div>
        {/* One row from `sm`: heading left, view switch and type dropdown right
            and level with it (owner, 28 Nov; the seven type pills squeezed the
            heading onto two lines and wrapped themselves). On a phone the
            controls are one row under the heading. View first, then dropdown,
            the order /search uses. */}
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white sm:whitespace-nowrap md:text-3xl">
            {intent === "rent" ? "Homes to rent" : "Homes for sale"}
          </h2>

          <div className="flex min-w-0 items-center gap-2 lg:gap-3">
            <ViewSwitch value={viewMode} onChange={setViewMode} />
            {availableTypes.length > 0 && (
              <CustomSelect
                value={activeFilter}
                onChange={setChosenType}
                options={[{ value: ALL_TYPES, label: "All property types" }, ...availableTypes]}
                ariaLabel={`Property type: ${activeFilter === ALL_TYPES ? "all" : activeFilter}`}
                active={activeFilter !== ALL_TYPES}
                align="right"
                // Seven short rows at most: show them all, no inner scrollbar.
                menuClassName="[&>div]:max-h-none"
                className="min-w-0 flex-1 sm:h-11 sm:w-[12.5rem] sm:flex-none"
              />
            )}
          </div>
        </div>
      </div>

      {/* Dynamic View Presentation based on viewMode toolbar selection */}
      {filtered.length > 0 && (
        <>
          {/* 1. Grid View (Photo-first Cards) */}
          {/* The server renders as if on a desktop (useMediaQuery's default), so
              in Grid the list is also rendered below lg: a phone shows its list
              from the first paint instead of flashing the grid until hydration. */}
          {viewMode === "grid" && (
            <div className="mt-6 space-y-4 lg:hidden">
              {featured.map((card) => (
                <PropertyListCard key={card.id} property={card} />
              ))}
            </div>
          )}
          {viewMode === "grid" && (
            <div className="mt-6 hidden gap-5 lg:grid lg:grid-cols-3">
              {featured.map((card) => (
                <article
                  key={card.id}
                  className="group overflow-hidden rounded-card border border-white/70 bg-white/55 dark:border-white/10 dark:bg-surface-panel/75 shadow-[0_16px_35px_rgba(15,23,42,0.06)] dark:shadow-[0_16px_35px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-60 overflow-hidden bg-slate-200 dark:bg-surface-ink">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url(${card.image})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute right-3 top-3">
                      <SavePropertyButton propertyId={card.id} />
                    </div>
                    {/* The chip used to read "To Rent" or "For Sale", which is
                        the toggle directly above this grid read back to the
                        visitor. getDisplayTag keeps whatever the listing
                        actually has to say ("New Listing", "Price Reduced") and
                        drops the tag when it is only the transaction again. */}
                    <div className="absolute left-3 top-3 flex items-center gap-1.5">
                      {getDisplayTag(card) && (
                        <span className="badge border border-white/30 bg-black/50 text-white backdrop-blur-sm dark:border-white/10">
                          {getDisplayTag(card)}
                        </span>
                      )}
                      {card.furnishedStatus && (
                        <span className="badge border border-white/30 bg-black/50 font-medium text-white/90 backdrop-blur-sm dark:border-white/10">
                          {card.furnishedStatus}
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-3 text-white">
                      <p className="text-xl font-bold">{card.price}</p>
                      {card.leaseTerm && (
                        <p className="text-xs text-white/80 font-medium">Lease: {card.leaseTerm}</p>
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-slate-950 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors">
                          {card.title}
                        </h3>
                        <p className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          <LocationPinIcon className="h-3.5 w-3.5 text-slate-600 shrink-0 dark:text-slate-400" />
                          <span>{card.location}</span>
                        </p>
                      </div>
                      <span className="badge border border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-surface-ink/80 dark:text-slate-200">
                        {card.type}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-200/60 dark:border-white/10 pt-3 text-xs text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        <BedIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                        <span>{card.beds} Beds</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <BathIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                        <span>{card.baths} Baths</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <AreaIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                        <span>{card.area}</span>
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {card.features?.slice(0, 2).map((f) => (
                          <span key={f} className="rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                            {featureLabel(f)}
                          </span>
                        ))}
                      </div>
                      <Link
                        href={`/property/${card.slug || card.id}`}
                        className="pill bg-gradient-to-r from-[#0b4d4e] to-[#07393a] hover:from-[#0d595b] hover:to-[#094344] dark:from-emerald-700 dark:to-emerald-800 dark:hover:from-emerald-800 dark:hover:to-emerald-900 font-bold text-white shadow-sm dark:shadow-[0_0_12px_rgba(16,185,129,0.35)] border border-emerald-400/30 dark:border-emerald-400/50 transition-all"
                      >
                        {card.listingType === "rent" ? "View Rental →" : "View Home →"}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* 2. List View (Detailed Horizontal Cards) */}
          {viewMode === "list" && (
            <div className="mt-6 space-y-4">
              {featured.map((card) => (
                <PropertyListCard key={card.id} property={card} />
              ))}
            </div>
          )}

          {/* 3. Split Map View (Google Maps & Street View) */}
          {viewMode === "map" && (
            <div className="mt-6">
              <PropertySplitMapView properties={filtered} />
            </div>
          )}

          {/* 4. Compact Table View (Investor & Yield Matrix) */}
          {viewMode === "compact" && (
            <div className="mt-6">
              <PropertyCompactTable properties={filtered} />
            </div>
          )}
          {(viewMode === "grid" || viewMode === "list") && filtered.length > FEATURED_COUNT && (
            <div className="mt-6 flex justify-center">
              <Link
                href={seeAllHref}
                className="pill-lg border border-emerald-400/30 bg-[var(--brand)] px-6 font-bold text-white shadow-sm transition-colors hover:bg-[var(--brand-hover)] dark:bg-emerald-700 dark:hover:bg-emerald-800"
              >
                {intent === "rent" ? "See all homes to rent" : "See all homes for sale"} →
              </Link>
            </div>
          )}
        </>
      )}

      {filtered.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 p-8 text-center text-xs text-slate-600 dark:text-slate-400">
          No {intent === "rent" ? "homes to rent" : "homes for sale"} at the moment.
        </div>
      )}
    </section>
  );
}

