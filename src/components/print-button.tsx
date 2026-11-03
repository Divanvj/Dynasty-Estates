"use client";

import { PrinterIcon } from "@/components/icons";

/**
 * Hands the page to the browser's print dialogue, which is also how a viewer
 * saves it as a PDF — there is no separate export path to maintain.
 *
 * What actually reaches the paper is decided by the print rules in
 * globals.css: `.no-print` strips the navigation, the action buttons and the
 * phone tab bar, and `.print-only` adds a document header in their place.
 * A page that adds this button therefore also has to mark its own chrome.
 */
export default function PrintButton({
  label = "Print / Export PDF",
  title = "Print or save this page as a PDF",
  className = "",
}: {
  label?: string;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      title={title}
      aria-label={title}
      // `.pill` rather than hand-rolled padding: this button sits in a row with
      // Share, Save and a back link, and the four of them were rendering at
      // 38px, 38px, 38px and 34px with two different type sizes. The class owns
      // the geometry so the row cannot drift again; colour stays here.
      className={`pill no-print border border-slate-300/80 bg-white/60 font-semibold text-slate-700 transition-all hover:border-slate-400 hover:bg-white cursor-pointer dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:bg-surface-panel dark:hover:text-emerald-300 ${className}`}
    >
      <PrinterIcon className="h-4 w-4 text-slate-700 dark:text-slate-300" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
