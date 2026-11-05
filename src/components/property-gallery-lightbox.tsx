"use client";

import { useEffect } from "react";
import { ArrowLeftIcon, ArrowRightIcon, XMarkIcon } from "@/components/icons";

type Props = {
  images: string[];
  title: string;
  /** The photograph on show. `null` closes the lightbox. */
  index: number | null;
  onClose: () => void;
  onIndexChange: (next: number) => void;
};

/**
 * The full-screen photograph viewer.
 *
 * This used to own a thumbnail grid as well, and that grid was the only way
 * into the viewer in the whole app — it lived in the detail page's "Photos"
 * media tab, which repeated a hero that already has a rail, a counter, arrows
 * and swipe, for galleries that run to two or three pictures. The tab is gone
 * and the viewer opens from the hero instead, so what is left here is the
 * viewer itself.
 *
 * Controlled rather than self-contained: the hero passes its own frame index
 * in, so opening the viewer shows the photograph you were already looking at
 * and closing it leaves the hero on the one you stopped at.
 */
export default function PropertyGalleryLightbox({
  images,
  title,
  index,
  onClose,
  onIndexChange,
}: Props) {
  const open = index !== null && images.length > 0;

  // Scroll lock, restoring whatever was there rather than blanking it — the
  // pattern expandable-search-panel.tsx and ui/sheet.tsx both use.
  //
  // Deliberately its own effect, keyed only on `open`. Folded in with the key
  // handler below it would re-run on every render of the caller, because the
  // callbacks a parent passes are usually fresh each time, and it would then
  // capture its own "previous" value and restore the lock instead of the page.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || index === null) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (index === null) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange((index + 1) % images.length);
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + images.length) % images.length);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, index, images.length, onClose, onIndexChange]);

  if (!open || index === null) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — full-screen photographs`}
      className="fixed inset-0 z-[9995] flex items-center justify-center bg-black/90 p-3 backdrop-blur-md sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[94dvh] w-full max-w-5xl overflow-hidden rounded-2xl border border-white/20 bg-slate-950 p-2 shadow-2xl sm:rounded-3xl dark:border-white/10 dark:bg-surface-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Toolbar */}
        <div className="flex items-center justify-between gap-3 px-2 py-2 text-white sm:px-4 sm:py-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-slate-200">{title}</p>
            <p className="text-xs text-slate-400 dark:text-slate-400">
              Photo {index + 1} of {images.length}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close photographs"
            className="tap-44 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white hover:bg-white/30 cursor-pointer dark:bg-surface-ink/80 dark:border dark:border-white/10 dark:hover:bg-[#102427] dark:hover:text-emerald-300"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Display Image */}
        <div className="relative flex h-[62dvh] w-full items-center justify-center overflow-hidden rounded-xl bg-black sm:rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[index]}
            alt={`${title} - Photo ${index + 1}`}
            className="max-h-full max-w-full object-contain"
          />
        </div>

        {/* Navigation. Only worth drawing when there is somewhere to go. */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => onIndexChange((index - 1 + images.length) % images.length)}
              className="tap-44 absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white shadow-lg hover:bg-black cursor-pointer sm:left-6 dark:bg-surface-ink/80 dark:border dark:border-white/10 dark:hover:bg-emerald-600 dark:hover:shadow-[0_0_12px_rgba(16,185,129,0.35)] transition-all"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => onIndexChange((index + 1) % images.length)}
              className="tap-44 absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white shadow-lg hover:bg-black cursor-pointer sm:right-6 dark:bg-surface-ink/80 dark:border dark:border-white/10 dark:hover:bg-emerald-600 dark:hover:shadow-[0_0_12px_rgba(16,185,129,0.35)] transition-all"
            >
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
