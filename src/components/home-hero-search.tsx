"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ExpandableSearchPanel from "@/components/expandable-search-panel";

export default function HomeHeroSearch() {
  const router = useRouter();
  // "buy" (For Sale) is the default per the Improvement Notes: the platform
  // leads with sales, so the hero should open there rather than on rentals.
  const [intent, setIntent] = useState<"rent" | "buy">("buy");

  useEffect(() => {
    function handleExternalIntent(e: Event) {
      const customEvent = e as CustomEvent<"rent" | "buy">;
      if (customEvent.detail === "rent" || customEvent.detail === "buy") {
        setIntent(customEvent.detail);
      }
    }
    window.addEventListener("dynasty:intent-change", handleExternalIntent);
    return () => window.removeEventListener("dynasty:intent-change", handleExternalIntent);
  }, []);

  function handleQuickTag(tag: string) {
    router.push(`/search?q=${encodeURIComponent(tag)}&intent=${intent}`);
  }

  return (
    <div className="mt-8 mx-auto w-full max-w-4xl">
      {/*
        The AI Search teaser banner stood here: a full bordered panel, emerald,
        with its own primary-weight CTA, directly above the search bar.

        It was removed because the hero offered three ways to start the same
        task — this banner, the search bar, and the chip row below — each
        presented as a peer. A visitor who has to choose between three entry
        points before typing anything has been given a decision instead of a
        search. AI Search keeps its place in the top navigation; it just stops
        competing with the field it sits on top of.
      */}

      {/* The one way to search from this page. */}
      <div className="relative z-50">
        <ExpandableSearchPanel
          defaultIntent="buy"
          placeholder="Search city or suburb..."
        />
      </div>

      {/* Popular Quick Lifestyle Tags */}
      <div className="mt-3.5 sm:mt-4 mx-auto max-w-3xl flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 px-1 sm:flex-wrap sm:justify-center">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mr-0.5 sm:mr-1 shrink-0">Popular in SA:</span>
        {[
          { label: "Johannesburg", tag: "Johannesburg" },
          { label: "Cape Town", tag: "Cape Town" },
          { label: "Pretoria East", tag: "Pretoria" },
          { label: "Solar & Inverter", tag: "solar" },
          { label: "Security Estate", tag: "security" },
        ].map((item) => (
          <button
            key={item.tag}
            type="button"
            onClick={() => handleQuickTag(item.tag)}
            className="pill-sm tap-44 relative border border-white/80 bg-white/75 dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-200 font-medium text-slate-700 hover:bg-white dark:hover:bg-surface-panel hover:border-emerald-400 dark:hover:border-emerald-500/40 hover:text-emerald-950 dark:hover:text-emerald-300 transition-all cursor-pointer shadow-2xs"
          >
            {item.label}
          </button>
        ))}

        {/* "Explore on Map →" was the third destination in this row and the
            fourth way out of the hero. Map Search already sits in the Tools
            menu on every page, so this was a duplicate competing for the one
            moment the visitor is deciding what to do. */}
      </div>
    </div>
  );
}
