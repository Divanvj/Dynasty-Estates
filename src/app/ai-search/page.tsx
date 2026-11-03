"use client";

import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { useEffect, useMemo, useState } from "react";
import AccountActions from "@/components/account-actions";
import PropertyGridCard from "@/components/property-grid-card";
import {
  BedIcon,
  CheckIcon,
  HomeIcon,
  InfoCircleIcon,
  LocationPinIcon,
  SparklesIcon,
  TagIcon,
  ZapIcon,
} from "@/components/icons";
import { formatNumber } from "@/lib/formatters";
import { getPropertyList, type PropertyRecord } from "@/lib/property-data";

import {
  generateGroundedRecommendations,
  parseNaturalLanguageQuery,
  type ParsedSearchIntent,
} from "@/lib/ai-concierge";

/**
 * Example queries, shortened.
 *
 * They were full sentences wrapped in typographic quotes, which wrapped to two
 * rows of chips above the fold and read as four paragraphs rather than four
 * buttons. Each still carries a location, a constraint and an amenity, so the
 * parser extracts the same shape of intent from them as before.
 */
const promptSuggestions = [
  "4-bed house in Pretoria with solar under R7M",
  "Ocean view villa in Camps Bay",
  "Secure estate home in Sandton with a garden",
  "Penthouse in Umhlanga under R8M",
];

export default function AISearchPage() {
  // Empty, with the placeholder carrying the instruction. It used to open with
  // a full example query already typed into the field, so the first thing
  // anyone had to do was select all and delete before they could ask for
  // anything of their own.
  const [queryText, setQueryText] = useState("");
  // null until a search has actually run. Every "has the visitor searched yet"
  // decision on this page keys off this rather than off the recommendation
  // count, because a search that matches nothing is still a search.
  const [activeIntent, setActiveIntent] = useState<ParsedSearchIntent | null>(null);

  /**
   * The same catalogue every other surface searches.
   *
   * This page used to rank `fallbackProperties` directly — the built-in demo
   * set — so AI Search was the one place in the product that did not answer
   * from the real listings. A seller could publish a home, find it on /search,
   * and never see it here.
   */
  const [catalogue, setCatalogue] = useState<PropertyRecord[]>([]);
  const [catalogueState, setCatalogueState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const list = await getPropertyList();
        if (!cancelled) {
          setCatalogue(list);
          setCatalogueState("ready");
        }
      } catch (error) {
        console.error("AI Search could not load the catalogue:", error);
        if (!cancelled) setCatalogueState("failed");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Derived, not stored: a search submitted before the catalogue lands still
  // produces its results the moment it does.
  const recommendations = useMemo(
    () => (activeIntent ? generateGroundedRecommendations(activeIntent, catalogue) : []),
    [activeIntent, catalogue]
  );

  function handleSearchWith(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setQueryText(trimmed);
    setActiveIntent(parseNaturalLanguageQuery(trimmed));
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSearchWith(queryText);
  }

  /**
   * Only the constraints the parser actually found.
   *
   * The bar used to render Location, Max Price and Beds unconditionally, so a
   * query that mentioned none of them still produced three chips reading "Any
   * South African Metro", "No ceiling" and "Any" — three chips to say nothing
   * was extracted.
   */
  const constraints: { key: string; Icon: typeof LocationPinIcon; label: string; strong?: boolean }[] =
    activeIntent
      ? [
          activeIntent.targetLocation
            ? { key: "loc", Icon: LocationPinIcon, label: activeIntent.targetLocation }
            : null,
          activeIntent.maxPriceZAR
            ? { key: "price", Icon: TagIcon, label: `Up to R ${formatNumber(activeIntent.maxPriceZAR)}` }
            : null,
          activeIntent.minBedrooms
            ? { key: "beds", Icon: BedIcon, label: `${activeIntent.minBedrooms}+ beds` }
            : null,
          activeIntent.propertyType
            ? { key: "type", Icon: HomeIcon, label: activeIntent.propertyType }
            : null,
          ...activeIntent.requiredAmenities.map((amenity) => ({
            key: `amenity-${amenity}`,
            Icon: ZapIcon,
            label: amenity.replace(/_/g, " "),
            strong: true,
          })),
        ].filter((c): c is { key: string; Icon: typeof LocationPinIcon; label: string; strong?: boolean } =>
          Boolean(c)
        )
      : [];

  return (
    <main className="min-h-screen bg-[var(--background)] px-3 py-4 text-slate-900 md:px-8 dark:text-white">
      <div className="mx-auto max-w-6xl">
        {/* Navigation Header */}
        <header className="relative z-50 mb-6 flex items-center justify-between rounded-card border border-white/75 bg-white/45 px-3.5 sm:px-5 py-3 shadow-[0_12px_28px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <BrandLogo markOnly />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-emerald-800 font-bold dark:text-emerald-400">Grounded AI</span>
                <span className="badge bg-emerald-500/20 text-emerald-800 dark:border dark:border-emerald-500/30 dark:bg-emerald-950/70 dark:text-emerald-300">
                  BETA
                </span>
              </div>
              <h1 className="text-xs sm:text-sm font-semibold tracking-wide text-slate-900 dark:text-white">
                <span className="hidden sm:inline">Dynasty </span>AI Search
              </h1>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 gap-y-2 sm:gap-2.5">
            {/* Compare lives here rather than on every card. The tiles below
                each carried their own "Compare →" link to this same page, so a
                full page of results offered the identical link twenty times. */}
            <Link
              href="/compare"
              className="pill hidden sm:inline-flex border border-slate-300/80 bg-white/60 font-semibold text-slate-700 hover:bg-white transition-all dark:bg-surface-ink/60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
            >
              Compare
            </Link>
            <Link
              href="/search"
              className="pill border border-slate-300/80 bg-white/60 font-semibold text-slate-700 hover:bg-white transition-all dark:bg-surface-ink/60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
            >
              <span className="hidden sm:inline">Standard Search</span>
              <span className="sm:hidden">Catalogue</span>
            </Link>
            <AccountActions />
          </div>
        </header>

        {/* AI Query Console.

            Stripped back. It opened with an eyebrow ("Conversational
            Discovery"), a headline, a paragraph explaining grounded AI, a
            pre-filled field whose placeholder said the same thing again, four
            sentence-long example chips and a constraints panel — six blocks of
            chrome before a single listing. The headline and the placeholder say
            it; the rest is gone. */}
        <section className="rounded-panel border border-white/80 bg-white/55 p-5 sm:p-6 shadow-[0_20px_45px_rgba(36,48,50,0.1)] backdrop-blur-xl dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <h2 className="text-xl sm:text-2xl font-light text-slate-950 dark:text-white">
            Tell us what you are looking for, in plain language.
          </h2>

          <form onSubmit={handleFormSubmit} className="mt-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <SparklesIcon className="absolute left-4 top-3.5 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <input
                  type="text"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="Describe your ideal home, budget, suburb, and must-have amenities..."
                  aria-label="Describe the home you are looking for"
                  className="w-full rounded-2xl border border-slate-300/80 bg-white/90 py-3.5 pl-11 pr-4 text-xs font-semibold text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-white/10 dark:bg-surface-ink/70 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-emerald-400"
                />
              </div>
              <button
                type="submit"
                disabled={!queryText.trim()}
                className="rounded-2xl bg-slate-950 px-6 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-slate-800 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-slate-950 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:disabled:hover:bg-emerald-600 dark:shadow-[0_0_20px_rgba(16,185,129,0.35)]"
              >
                Search with AI →
              </button>
            </div>
          </form>

          {/* Quick Suggestions */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Try:</span>
            {promptSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSearchWith(suggestion)}
                className="pill-sm border border-slate-200 bg-white/70 font-medium text-slate-700 hover:bg-white hover:border-emerald-400 transition-all cursor-pointer dark:bg-surface-ink/60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-emerald-400"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* What the parser took from the query. Only rendered once something
              has been extracted, so the panel is evidence rather than
              decoration. */}
          {constraints.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-200/80 pt-4 dark:border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Reading this as
              </span>
              {constraints.map(({ key, Icon, label, strong }) => (
                <span
                  key={key}
                  className={`badge ${
                    strong
                      ? "bg-emerald-700 text-white dark:bg-emerald-600"
                      : "border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-surface-ink/80 dark:text-emerald-300"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${strong ? "text-emerald-200" : "text-emerald-600 dark:text-emerald-400"}`} />
                  <span>{label}</span>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Results */}
        {activeIntent === null ? (
          <section className="mt-8 rounded-panel border border-dashed border-slate-300/80 bg-white/40 p-10 text-center dark:border-white/10 dark:bg-surface-panel/40">
            <SparklesIcon className="mx-auto h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
              Your matches will appear here
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
              Describe the home above, or start from one of the examples.
            </p>
          </section>
        ) : (
          <section className="mt-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-bold text-slate-950 dark:text-white">Matching homes</h3>
              {/* Same badge and the same word as the count on /search and
                  /map-search. It read "20 Verified Homes Ranked by MatchScore". */}
              {catalogueState === "ready" && (
                <span className="badge border border-emerald-200 bg-emerald-100/90 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {recommendations.length} {recommendations.length === 1 ? "match" : "matches"}
                </span>
              )}
            </div>

            {catalogueState === "loading" ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-96 animate-pulse rounded-panel border border-white/60 bg-white/40 dark:border-white/10 dark:bg-surface-panel/60"
                  />
                ))}
              </div>
            ) : catalogueState === "failed" ? (
              /* An empty grid is indistinguishable from "nothing matched", so a
                 catalogue that did not load has to say which one this is. */
              <div
                role="alert"
                className="rounded-panel border border-rose-300/80 bg-rose-50/80 p-10 text-center dark:border-rose-500/30 dark:bg-rose-500/10"
              >
                <p className="text-sm font-bold text-rose-900 dark:text-rose-200">
                  We couldn&rsquo;t load the listings
                </p>
                <p className="mx-auto mt-1 max-w-sm text-xs text-rose-800 dark:text-rose-300">
                  This is a problem on our side, not with your search. Try again shortly.
                </p>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="rounded-panel border border-white/80 bg-white/55 p-10 text-center backdrop-blur-xl dark:border-white/10 dark:bg-surface-panel/75">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Nothing in the catalogue fits that yet
                </p>
                <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                  Try widening the budget or dropping one of the must-haves.
                </p>
              </div>
            ) : (
              /* The same tile as /for-sale and /to-rent, with the match score
                 and the reasoning passed in. This page used to hand-write its
                 own card, which had drifted into a different photo height,
                 badge shape, spec row and button wording from every other grid
                 in the product. */
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {recommendations.map(({ property, matchScore, matchReasons, unmetCriteria }, index) => (
                  <PropertyGridCard
                    key={property.id}
                    property={property}
                    headingLevel="h4"
                    priority={index < 3}
                    overlayBadge={
                      <span className="badge bg-emerald-600 text-white shadow-lg">
                        {matchScore}% match
                      </span>
                    }
                  >
                    <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50 p-2.5 text-xs dark:border-white/10 dark:bg-surface-ink/60">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Why this fits
                      </p>
                      <ul className="mt-1 space-y-1">
                        {matchReasons.map((reason) => (
                          <li key={reason} className="flex items-center gap-1.5 font-medium text-emerald-800 dark:text-emerald-300">
                            <CheckIcon className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span>{reason}</span>
                          </li>
                        ))}
                        {unmetCriteria.map((unmet) => (
                          <li key={unmet} className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                            <InfoCircleIcon className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
                            <span>{unmet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </PropertyGridCard>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
