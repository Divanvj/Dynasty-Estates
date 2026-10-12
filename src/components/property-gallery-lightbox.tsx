"use client";

import { useEffect, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, SearchIcon, XMarkIcon } from "@/components/icons";

export default function PropertyGalleryLightbox({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (activeIndex === null) return;
      if (e.key === "Escape") setActiveIndex(null);
      if (e.key === "ArrowRight") {
        setActiveIndex((prev) => (prev !== null ? (prev + 1) % images.length : null));
      }
      if (e.key === "ArrowLeft") {
        setActiveIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : null));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, images.length]);

  return (
    <div>
      {/* Thumbnail Gallery Grid */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {images.map((image, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="group relative h-44 overflow-hidden rounded-[22px] border border-white/80 bg-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer dark:border-white/10"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundImage: `url(${image})` }}
            />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/25" />
            <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
              <SearchIcon className="h-3 w-3" />
              <span>Expand</span>
            </span>
          </button>
        ))}
      </div>

      {/* Full-Screen Lightbox Modal */}
      {activeIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Full-screen image gallery"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setActiveIndex(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-5xl overflow-hidden rounded-3xl border border-white/20 bg-slate-950 p-2 shadow-2xl dark:border-white/10 dark:bg-[#0c1a1c]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 text-white">
              <div>
                <p className="text-xs font-bold text-slate-200">{title}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-400">
                  Photo {activeIndex + 1} of {images.length}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveIndex(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white hover:bg-white/30 cursor-pointer dark:bg-[#060d0e]/80 dark:border dark:border-white/10 dark:hover:bg-[#102427] dark:hover:text-emerald-300"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Display Image */}
            <div className="relative flex h-[65vh] w-[80vw] max-w-4xl items-center justify-center overflow-hidden rounded-2xl bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[activeIndex]}
                alt={`${title} - Photo ${activeIndex + 1}`}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Navigation Buttons */}
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => setActiveIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : null))}
              className="absolute left-6 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white shadow-lg hover:bg-black cursor-pointer dark:bg-[#060d0e]/80 dark:border dark:border-white/10 dark:hover:bg-emerald-600 dark:hover:shadow-[0_0_12px_rgba(16,185,129,0.35)] transition-all"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => setActiveIndex((prev) => (prev !== null ? (prev + 1) % images.length : null))}
              className="absolute right-6 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white shadow-lg hover:bg-black cursor-pointer dark:bg-[#060d0e]/80 dark:border dark:border-white/10 dark:hover:bg-emerald-600 dark:hover:shadow-[0_0_12px_rgba(16,185,129,0.35)] transition-all"
            >
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

