"use client";

import { useEffect, useId, useRef, useState } from "react";

import PhotoRejectionDialog, { type RejectedPhoto } from "@/components/photo-rejection-dialog";
import { CameraIcon, XMarkIcon } from "@/components/icons";
import { duplicateIssue } from "@/lib/photo-analysis";
import {
  checkPhoto,
  findExistingDuplicate,
  isNearDuplicate,
  uploadListingPhoto,
  type ListingPhoto,
} from "@/lib/photo-intake";

export const MAX_LISTING_PHOTOS = 30;

type Pending = { key: string; name: string; previewUrl: string; stage: "checking" | "uploading" };

/**
 * Photo picker for the listing wizard. Every file goes through checkPhoto and
 * a duplicate lookup before it is uploaded; failures are collected and shown
 * together in PhotoRejectionDialog once the batch finishes.
 */
export default function ListingPhotoUploader({
  ownerId,
  authLoading = false,
  photos,
  onPhotosChange,
}: {
  ownerId: string | null;
  /** The session is still being restored; ownerId may not be known yet. */
  authLoading?: boolean;
  photos: ListingPhoto[];
  onPhotosChange: (update: (previous: ListingPhoto[]) => ListingPhoto[]) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [rejected, setRejected] = useState<RejectedPhoto[]>([]);
  const [acceptedInBatch, setAcceptedInBatch] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);

  // Hashes of photos already on the listing, read at check time. A ref, because
  // the batch loop outlives the render it started in.
  const hashesRef = useRef<string[]>([]);
  useEffect(() => {
    hashesRef.current = photos.map((photo) => photo.hash);
  }, [photos]);

  const busy = pending.length > 0 || authLoading;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0 || busy) return;
    if (!ownerId) {
      setUploadError("Please sign in before adding photos.");
      return;
    }
    setUploadError("");

    const room = MAX_LISTING_PHOTOS - photos.length;
    const files = Array.from(fileList);
    const batch = files.slice(0, Math.max(0, room));
    const overflow = files.slice(batch.length);

    const queue: Pending[] = batch.map((file) => ({
      key: crypto.randomUUID(),
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      stage: "checking",
    }));
    setPending(queue);

    const rejectedNow: RejectedPhoto[] = overflow.map((file) => ({
      key: crypto.randomUUID(),
      fileName: file.name,
      previewUrl: null,
      issues: [{
        code: "photo_limit",
        title: "Photo limit reached",
        detail: `A listing can have up to ${MAX_LISTING_PHOTOS} photos.`,
        fix: "Remove a weaker photo first, then add this one.",
      }],
    }));
    const seen = [...hashesRef.current];
    let accepted = 0;

    for (const [index, file] of batch.entries()) {
      const item = queue[index];
      const drop = () => setPending((current) => current.filter((entry) => entry.key !== item.key));
      const reject = (issues: RejectedPhoto["issues"]) => {
        rejectedNow.push({ key: item.key, fileName: file.name, previewUrl: item.previewUrl, issues });
        drop();
      };

      try {
        const result = await checkPhoto(file);
        if (!result.ok) {
          reject(result.issues);
          continue;
        }
        if (isNearDuplicate(result.hash, seen)) {
          reject([duplicateIssue("batch")]);
          continue;
        }
        const existing = await findExistingDuplicate(result.hash);
        if (existing) {
          reject([existing]);
          continue;
        }

        setPending((current) => current.map((entry) => (entry.key === item.key ? { ...entry, stage: "uploading" } : entry)));
        const photo = await uploadListingPhoto(ownerId, file, result);
        seen.push(photo.hash);
        accepted += 1;
        onPhotosChange((previous) => [...previous, photo]);
        URL.revokeObjectURL(item.previewUrl);
        drop();
      } catch (error) {
        // A storage or network failure is ours, not the photo's: report it
        // separately instead of blaming the file in the rejection dialog.
        setUploadError(error instanceof Error ? error.message : "The upload failed.");
        URL.revokeObjectURL(item.previewUrl);
        drop();
      }
    }

    setAcceptedInBatch(accepted);
    setRejected(rejectedNow);
    if (inputRef.current) inputRef.current.value = "";
  }

  function closeDialog() {
    for (const photo of rejected) if (photo.previewUrl) URL.revokeObjectURL(photo.previewUrl);
    setRejected([]);
  }

  function makeCover(id: string) {
    onPhotosChange((previous) => {
      const chosen = previous.find((photo) => photo.id === id);
      return chosen ? [chosen, ...previous.filter((photo) => photo.id !== id)] : previous;
    });
  }

  function remove(id: string) {
    onPhotosChange((previous) => previous.filter((photo) => photo.id !== id));
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFiles(event.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[24px] border-2 border-dashed px-6 py-8 text-center transition-colors ${
          dragging
            ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-500/10"
            : "border-slate-300/80 bg-white/40 hover:border-emerald-400 hover:bg-white/60 dark:border-white/15 dark:bg-[#060d0e]/60 dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40"
        } ${busy ? "pointer-events-none opacity-60" : ""}`}
      >
        <CameraIcon className="h-7 w-7 text-emerald-700 dark:text-emerald-400" />
        <span className="text-sm font-semibold text-slate-900 dark:text-white">
          {authLoading ? "Loading your account…" : busy ? "Checking photos…" : "Add photos"}
        </span>
        <span className="max-w-md text-xs text-slate-600 dark:text-slate-400">
          Drop files here or tap to choose. Every photo is checked for blur, screenshots, AI generation and duplicates
          before it is added. Up to {MAX_LISTING_PHOTOS} photos.
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          disabled={busy}
          onChange={(event) => void handleFiles(event.target.files)}
          className="sr-only"
        />
      </label>

      {uploadError && (
        <p role="alert" className="mt-3 rounded-2xl border border-amber-300 bg-amber-50/90 px-4 py-2.5 text-xs text-amber-950">
          {uploadError}
        </p>
      )}

      {(photos.length > 0 || pending.length > 0) && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo, index) => (
            <li key={photo.id} className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/70 bg-slate-100 shadow-sm dark:border-white/10 dark:bg-[#060d0e]/60">
              {/* eslint-disable-next-line @next/next/no-img-element -- Storage download URL, sized by the grid */}
              <img src={photo.url} alt={`Listing photo ${index + 1}`} className="h-full w-full object-cover" />
              {index === 0 ? (
                <span className="absolute left-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                  Cover
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => makeCover(photo.id)}
                  className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white opacity-100 backdrop-blur-sm transition-opacity hover:bg-black/75 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                >
                  Make cover
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(photo.id)}
                aria-label={`Remove photo ${index + 1}`}
                className="absolute right-2 top-2 rounded-full bg-black/55 p-1 text-white backdrop-blur-sm hover:bg-rose-600"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {pending.map((item) => (
            <li key={item.key} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/70 bg-slate-100 dark:border-white/10 dark:bg-[#060d0e]/60">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
              <img src={item.previewUrl} alt="" className="h-full w-full object-cover opacity-40" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-slate-800 shadow dark:bg-[#0c1a1c]/90 dark:border dark:border-white/10 dark:text-white">
                  {item.stage === "checking" ? "Checking…" : "Uploading…"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="sr-only" aria-live="polite">
        {pending.length > 0 ? `Checking ${pending.length} photos` : `${photos.length} photos added`}
      </p>

      <PhotoRejectionDialog rejected={rejected} acceptedCount={acceptedInBatch} onClose={closeDialog} />
    </div>
  );
}
