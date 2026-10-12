"use client";

import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { useState } from "react";
import AccountActions from "@/components/account-actions";
import PropertyCardPhotos from "@/components/property-card-photos";
import {
  AreaIcon,
  BathIcon,
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

import {
  generateGroundedRecommendations,
  parseNaturalLanguageQuery,
  type GroundedRecommendation,
  type ParsedSearchIntent,
} from "@/lib/ai-concierge";

const promptSuggestions = [
  "Modern 4-bedroom house in Pretoria with solar and pool under R7M",
  "Luxury ocean view villa in Camps Bay with inverter backup",
  "Secure estate home in Sandton with garden and double garage",
  "Penthouse apartment in Umhlanga near beach under R8M",
];

export default function AISearchPage() {
  const [queryText, setQueryText] = useState("Modern 4-bedroom house in Pretoria with solar and pool under R7M");
  const [activeIntent, setActiveIntent] = useState<ParsedSearchIntent>(() =>
    parseNaturalLanguageQuery("Modern 4-bedroom house in Pretoria with solar and pool under R7M")
  );
  const [recommendations, setRecommendations] = useState<GroundedRecommendation[]>(() =>
    generateGroundedRecommendations(activeIntent)
  );

  function handleSearchWith(text: string) {
    setQueryText(text);
    const intent = parseNaturalLanguageQuery(text);
    setActiveIntent(intent);
    setRecommendations(generateGroundedRecommendations(intent));
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSearchWith(queryText);
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-3 py-4 text-slate-900 md:px-8 dark:text-white">
      <div className="mx-auto max-w-6xl">
        {/* Navigation Header */}
        <header className="relative z-50 mb-6 flex items-center justify-between rounded-[26px] border border-white/75 bg-white/45 px-3.5 sm:px-5 py-3 shadow-[0_12px_28px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <BrandLogo markOnly />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-emerald-800 font-bold dark:text-emerald-400">Grounded AI</span>
                <span className="rounded-full bg-emerald-500/20 text-emerald-800 px-2 py-0.5 text-[9px] font-bold dark:bg-emerald-950/70 dark:text-emerald-300 dark:border dark:border-emerald-500/30">
                  BETA
                </span>
              </div>
              <h1 className="text-xs sm:text-sm font-semibold tracking-wide text-slate-900 dark:text-white">
                <span className="hidden sm:inline">Dynasty </span>AI Concierge
              </h1>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 gap-y-2 sm:gap-2.5">
            <Link
              href="/search"
              className="rounded-full border border-slate-300/80 bg-white/60 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 hover:bg-white transition-all whitespace-nowrap shrink-0 dark:bg-[#060d0e]/60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
            >
              <span className="hidden sm:inline">Standard Search</span>
              <span className="sm:hidden">Catalogue</span>
            </Link>
            <AccountActions />
          </div>
        </header>

        {/* AI Query Console */}
        <section className="rounded-[32px] border border-white/80 bg-white/55 p-6 shadow-[0_20px_45px_rgba(36,48,50,0.1)] backdrop-blur-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500 font-bold dark:text-slate-400">
            Conversational Discovery
          </p>
          <h2 className="mt-1 text-2xl font-light text-slate-950 dark:text-white">
            Tell us what you are looking for in plain language.
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            Our grounded AI parses location, price ceilings, bedroom counts, and South African resilience amenities without hallucinations.
          </p>

          <form onSubmit={handleFormSubmit} className="mt-5">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <SparklesIcon className="absolute left-4 top-3.5 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <input
                  type="text"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="Describe your ideal home, budget, suburb, and must-have amenities..."
                  className="w-full rounded-2xl border border-slate-300/80 bg-white/90 py-3.5 pl-11 pr-4 text-xs font-semibold text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-white/10 dark:bg-[#060d0e]/70 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-emerald-400"
                />
              </div>
              <button
                type="submit"
                className="rounded-2xl bg-slate-950 px-6 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-slate-800 transition-all cursor-pointer dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_20px_rgba(16,185,129,0.35)]"
              >
                Ask Concierge →
              </button>
            </div>
          </form>

          {/* Quick Suggestions */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Try asking:</span>
            {promptSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSearchWith(suggestion)}
                className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-white hover:border-emerald-400 transition-all cursor-pointer dark:bg-[#060d0e]/60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-emerald-400"
              >
                &ldquo;{suggestion}&rdquo;
              </button>
            ))}
          </div>

          {/* Parsed Semantic Constraints Bar */}
          <div className="mt-6 rounded-2xl border border-emerald-300/60 bg-emerald-50/80 p-4 dark:border-emerald-500/25 dark:bg-emerald-950/25 dark:shadow-[0_4px_20px_rgba(16,185,129,0.06)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-400">
              Extracted Intent Constraints:
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 font-semibold text-emerald-900 shadow-sm dark:bg-[#060d0e]/80 dark:text-emerald-300 dark:border dark:border-emerald-500/30 dark:shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                <LocationPinIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0 dark:text-emerald-400" />
                <span>Location: {activeIntent.targetLocation ?? "Any South African Metro"}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 font-semibold text-emerald-900 shadow-sm dark:bg-[#060d0e]/80 dark:text-emerald-300 dark:border dark:border-emerald-500/30 dark:shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                <TagIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0 dark:text-emerald-400" />
                <span>Max Price: {activeIntent.maxPriceZAR ? `R ${formatNumber(activeIntent.maxPriceZAR)}` : "No ceiling"}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 font-semibold text-emerald-900 shadow-sm dark:bg-[#060d0e]/80 dark:text-emerald-300 dark:border dark:border-emerald-500/30 dark:shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                <BedIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0 dark:text-emerald-400" />
                <span>Beds: {activeIntent.minBedrooms ? `${activeIntent.minBedrooms}+` : "Any"}</span>
              </span>
              {activeIntent.propertyType && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 font-semibold text-emerald-900 shadow-sm dark:bg-[#060d0e]/80 dark:text-emerald-300 dark:border dark:border-emerald-500/30 dark:shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                  <HomeIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0 dark:text-emerald-400" />
                  <span>Type: {activeIntent.propertyType}</span>
                </span>
              )}
              {activeIntent.requiredAmenities.map((amenity) => (
                <span key={amenity} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-2.5 py-1 font-bold text-white shadow-sm dark:bg-emerald-600 dark:shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                  <ZapIcon className="h-3.5 w-3.5 text-emerald-200 shrink-0" />
                  <span>{amenity.replace("_", " ")}</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Grounded Recommendations Grid */}
        <section className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-950 dark:text-white">Grounded Recommendations</h3>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {recommendations.length} Verified Homes Ranked by MatchScore
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map(({ property, matchScore, matchReasons, unmetCriteria }) => (
              <article
                key={property.id}
                className="group overflow-hidden rounded-[30px] border border-white/80 bg-white/60 shadow-[0_16px_36px_rgba(36,48,50,0.08)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl dark:bg-[#0c1a1c]/75 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]"
              >
                {/* Photo & MatchScore Pill */}
                <div className="relative h-56 overflow-hidden bg-slate-200">
                  <PropertyCardPhotos
                    images={property.gallery?.length ? property.gallery : [property.image]}
                    title={property.title}
                    frameClassName="transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  <div className="absolute top-3 right-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-extrabold text-white shadow-lg">
                    {matchScore}% Match
                  </div>

                  <div className="absolute bottom-3 left-3 text-white">
                    <p className="text-xl font-extrabold">{property.price}</p>
                  </div>
                </div>

                <div className="p-5">
                  <h4 className="text-base font-bold text-slate-950 group-hover:text-emerald-800 transition-colors dark:text-white dark:group-hover:text-emerald-400">
                    {property.title}
                  </h4>
                  <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5 dark:text-slate-400">
                    <LocationPinIcon className="h-3.5 w-3.5 text-slate-400 shrink-0 dark:text-slate-400" />
                    <span>{property.location}</span>
                  </p>

                  {/* AI Explanation / Reasoning */}
                  <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50 p-2.5 text-[11px] text-slate-700 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300">
                    <p className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-1 dark:text-slate-400">
                      Why this fits:
                    </p>
                    <ul className="space-y-1">
                      {matchReasons.map((reason, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 text-emerald-800 font-medium dark:text-emerald-300">
                          <CheckIcon className="h-3 w-3 text-emerald-600 shrink-0 dark:text-emerald-400" />
                          <span>{reason}</span>
                        </li>
                      ))}
                      {unmetCriteria.map((unmet, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                          <InfoCircleIcon className="h-3 w-3 text-amber-600 shrink-0 dark:text-amber-400" />
                          <span>{unmet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-200/70 pt-3 text-xs text-slate-600 font-medium dark:border-white/10 dark:text-slate-300">
                    <span className="flex items-center gap-1">
                      <BedIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
                      <span>{property.beds} Beds</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <BathIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
                      <span>{property.baths} Baths</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <AreaIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
                      <span>{property.area}</span>
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <Link
                      href={`/compare`}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-emerald-400"
                    >
                      Compare →
                    </Link>
                    <Link
                      href={`/property/${property.slug || property.id}`}
                      className="rounded-full bg-slate-950 px-4 py-1.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                    >
                      View Home →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

