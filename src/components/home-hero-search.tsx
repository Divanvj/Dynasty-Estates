"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SparklesIcon } from "@/components/icons";
import ExpandableSearchPanel from "@/components/expandable-search-panel";

export default function HomeHeroSearch() {
  const router = useRouter();
  const [intent, setIntent] = useState<"rent" | "buy">("rent");

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
      {/* AI Concierge Teaser Banner */}
      <div className="mb-3 sm:mb-4 mx-auto max-w-3xl flex items-center justify-between gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/15 dark:bg-emerald-950/40 px-3 py-2 sm:px-4 sm:py-2.5 text-xs backdrop-blur-md">
        <div className="flex items-center gap-2 text-slate-800 dark:text-emerald-100 min-w-0">
          <SparklesIcon className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <p className="text-[11px] sm:text-xs truncate sm:whitespace-normal">
            <strong className="font-bold text-emerald-900 dark:text-emerald-300">AI Concierge:</strong>{" "}
            <span className="hidden sm:inline">
              Describe your dream home in natural language, e.g. <em>&ldquo;3-bed solar estate in Pretoria East with pool under R6M&rdquo;</em>
            </span>
            <span className="sm:hidden text-slate-700 dark:text-slate-300 font-medium">
              Search dream homes in natural language
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("dynasty:open-ai-search"));
            }
          }}
          className="inline-flex items-center gap-1 sm:gap-1.5 rounded-xl bg-gradient-to-r from-[#0b4d4e] to-[#07393a] text-emerald-100 border border-emerald-400/40 px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 text-[11px] sm:text-xs font-bold shadow-xs hover:from-[#0d595b] hover:to-[#094344] transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          <SparklesIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-300" />
          <span className="hidden min-[360px]:inline">Try AI</span>
          <span className="hidden sm:inline">Search</span>
          <span>→</span>
        </button>
      </div>

      {/* Unified Expandable Single Search Bar & Filter Dropdown */}
      <div className="relative z-50">
        <ExpandableSearchPanel
          defaultIntent="rent"
          placeholder="Search city or suburb..."
        />
      </div>

      {/* Popular Quick Lifestyle Tags */}
      <div className="mt-3.5 sm:mt-4 mx-auto max-w-3xl flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 px-1 sm:flex-wrap sm:justify-center">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-0.5 sm:mr-1 shrink-0">Popular in SA:</span>
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
            className="shrink-0 rounded-full border border-white/80 bg-white/75 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-200 px-2.5 sm:px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-white dark:hover:bg-[#0c1a1c] hover:border-emerald-400 dark:hover:border-emerald-500/40 hover:text-emerald-950 dark:hover:text-emerald-300 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
          >
            {item.label}
          </button>
        ))}

        <Link
          href="/map-search"
          className="shrink-0 text-[11px] font-bold text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300 hover:underline flex items-center gap-1 ml-1 whitespace-nowrap"
        >
          <span>Explore on Map</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
