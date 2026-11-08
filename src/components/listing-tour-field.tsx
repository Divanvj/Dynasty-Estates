"use client";

import { useId } from "react";

import { parseTourUrl, tourTabLabel } from "@/lib/virtual-tour";

interface Props {
  value?: string;
  onChange: (value: string) => void;
}

/**
 * Optional tour link for a listing. When set, the listing page shows a tour
 * tab with it (embedded for Matterport, YouTube and Vimeo; a link for other
 * hosts). When empty, the listing simply has no tour tab.
 */
export default function ListingTourField({ value = "", onChange }: Props) {
  const id = useId();
  const hintId = useId();
  const trimmed = value.trim();
  const tour = parseTourUrl(trimmed);
  const invalid = trimmed.length > 0 && !tour;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300"
      >
        Virtual tour link{" "}
        <span className="normal-case tracking-normal font-normal text-slate-600 dark:text-slate-400">
          (optional · Matterport, YouTube or Vimeo)
        </span>
      </label>
      <input
        id={id}
        type="url"
        inputMode="url"
        maxLength={300}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://my.matterport.com/show/?m=…"
        aria-invalid={invalid || undefined}
        aria-describedby={hintId}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-white/10 dark:bg-surface-ink dark:text-white"
      />
      <p id={hintId} className={`mt-1.5 text-xs ${invalid ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-400"}`}>
        {invalid
          ? "Paste the full link, starting with https://."
          : tour
            ? tour.embedUrl
              ? `Shows as a "${tourTabLabel(tour.kind)}" tab on the listing.`
              : "Shows on the listing as a link to the tour."
            : "Leave empty if there is no tour. The listing then has no tour tab."}
      </p>
    </div>
  );
}
