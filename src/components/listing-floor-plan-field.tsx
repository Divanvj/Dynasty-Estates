"use client";

import { useId, useState } from "react";

import { FLOOR_PLAN_TYPES, uploadFloorPlan, type ListingFloorPlan } from "@/lib/photo-intake";

interface Props {
  ownerId: string | null;
  authLoading: boolean;
  floorPlan?: ListingFloorPlan;
  onChange: (floorPlan: ListingFloorPlan | undefined) => void;
}

/**
 * Optional floor plan for a listing. When attached, the listing page shows a
 * Floor Plan tab with it; when not, that tab is simply absent — the page no
 * longer substitutes a stock image.
 */
export default function ListingFloorPlanField({ ownerId, authLoading, floorPlan, onChange }: Props) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!ownerId) {
      setError("Sign in before attaching a floor plan.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      onChange(await uploadFloorPlan(ownerId, file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "The upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300"
      >
        Floor plan <span className="normal-case tracking-normal font-normal text-slate-600 dark:text-slate-400">(optional · JPG, PNG, WebP or PDF, under 10 MB)</span>
      </label>

      {floorPlan ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm dark:border-white/10 dark:bg-surface-ink/60">
          <a
            href={floorPlan.url}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 truncate font-semibold text-emerald-800 hover:underline dark:text-emerald-400"
          >
            {floorPlan.name}
          </a>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
          >
            Remove
          </button>
        </div>
      ) : (
        <input
          id={inputId}
          type="file"
          accept={Object.keys(FLOOR_PLAN_TYPES).join(",")}
          disabled={uploading || authLoading}
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
          className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-[#0b4d4e] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#07393a] disabled:opacity-60 dark:text-slate-200"
        />
      )}

      <p aria-live="polite" className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
        {uploading ? "Uploading floor plan…" : error ? <span className="text-[var(--danger)]">{error}</span> : "Buyers see it on the listing's Floor Plan tab."}
      </p>
    </div>
  );
}
