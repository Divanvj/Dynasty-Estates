"use client";

import { useEffect, useRef } from "react";

import type { PhotoIssue } from "@/lib/photo-analysis";
import { XMarkIcon } from "@/components/icons";

export type RejectedPhoto = {
  key: string;
  fileName: string;
  /** Object URL for the thumbnail; null when the file could not be decoded. */
  previewUrl: string | null;
  issues: PhotoIssue[];
};

export default function PhotoRejectionDialog({
  rejected,
  acceptedCount,
  onClose,
}: {
  rejected: RejectedPhoto[];
  acceptedCount: number;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const open = rejected.length > 0;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const heading =
    rejected.length === 1 ? "1 photo wasn't added" : `${rejected.length} photos weren't added`;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="photo-rejection-title"
      className="m-auto w-[min(640px,calc(100vw-32px))] max-h-[min(720px,calc(100dvh-32px))] overflow-hidden rounded-[28px] border border-white/70 bg-white p-0 text-slate-900 shadow-[0_30px_80px_rgba(15,23,42,0.35)] backdrop:bg-slate-950/55 backdrop:backdrop-blur-sm dark:border-white/10 dark:bg-[#0d1b1d] dark:text-white"
    >
      {open && (
        <div className="flex max-h-[inherit] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-slate-200/70 px-6 pb-4 pt-5 dark:border-white/10">
            <div>
              <h2 id="photo-rejection-title" className="text-lg font-semibold tracking-tight">
                {heading}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {acceptedCount > 0
                  ? `${acceptedCount} other ${acceptedCount === 1 ? "photo was" : "photos were"} added. `
                  : ""}
                Buyers on Dynasty Estates only see real, clear photos of the property.
              </p>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close"
              className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#060d0e] dark:hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </header>

          <ul className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
            {rejected.map((photo) => (
              <li
                key={photo.key}
                className="flex gap-4 rounded-2xl border border-rose-200/80 bg-rose-50/60 p-3 dark:border-rose-400/20 dark:bg-rose-500/5"
              >
                {photo.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a local object URL, not a remote image
                  <img
                    src={photo.previewUrl}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-xl object-cover sm:h-24 sm:w-24"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:h-24 sm:w-24 dark:bg-[#060d0e]/80 dark:border dark:border-white/10 dark:text-slate-400">
                    No preview
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400" title={photo.fileName}>
                    {photo.fileName}
                  </p>
                  {photo.issues.map((issue) => (
                    <div key={issue.code} className="mt-1.5">
                      <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">{issue.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">{issue.detail}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-900 dark:text-white">
                        <span className="font-semibold">Fix: </span>
                        {issue.fix}
                      </p>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>

          <footer className="flex justify-end border-t border-slate-200/70 px-6 py-4 dark:border-white/10">
            <button
              type="button"
              autoFocus
              onClick={() => dialogRef.current?.close()}
              className="rounded-full bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
            >
              Got it
            </button>
          </footer>
        </div>
      )}
    </dialog>
  );
}
