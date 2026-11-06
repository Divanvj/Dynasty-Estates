"use client";

import { useState } from "react";
import { ShareIcon } from "@/components/icons";

export default function PropertyShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof window === "undefined") return;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: window.location.href,
        });
        return;
      } catch {
        // User cancelled or fallback
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore clipboard write failure
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => void handleShare()}
        title="Share property"
        aria-label="Share property"
        // `.pill` for the same reason as PrintButton beside it: geometry comes
        // from the class so the header row holds one height and one type size.
        className="pill border border-slate-300/80 bg-white/60 font-semibold text-slate-700 hover:bg-white hover:border-slate-400 transition-all cursor-pointer dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300 dark:hover:bg-surface-panel dark:hover:border-emerald-500/40 dark:hover:text-emerald-300"
      >
        <ShareIcon className="h-4 w-4 text-slate-700 dark:text-slate-300" />
        <span className="hidden sm:inline">Share</span>
      </button>
      {copied && (
        <span className="absolute right-0 top-10 z-20 whitespace-nowrap rounded-xl bg-slate-950 dark:bg-surface-panel border border-slate-800 dark:border-white/10 px-2.5 py-1 text-xs font-bold text-white dark:text-emerald-300 shadow-xl dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] animate-in fade-in duration-200">
          Link copied!
        </span>
      )}
    </div>
  );
}

