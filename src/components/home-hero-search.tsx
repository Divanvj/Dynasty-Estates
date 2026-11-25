"use client";

import ExpandableSearchPanel from "@/components/expandable-search-panel";

export default function HomeHeroSearch() {
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

      {/* The one way to search from this page. "buy" (For Sale) is the
          default per the Improvement Notes: the platform leads with sales. */}
      <div className="relative z-50">
        <ExpandableSearchPanel
          defaultIntent="buy"
          placeholder="Suburb or city"
        />
      </div>

      {/* The "Popular in SA" chip row (Johannesburg, Cape Town, Pretoria
          East, Solar & Inverter, Security Estate) stood here. Removed by the
          owner with the photo hero (25 Nov 2026): the search bar is the one
          thing under the headline. The chips' only state was the For Sale /
          To Rent choice they sent along, so that listener went with them. */}
    </div>
  );
}
