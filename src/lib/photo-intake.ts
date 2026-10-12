import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
  type WriteBatch,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { db, isFirebaseConfigured, storage } from "./firebase";
import {
  ANALYSIS_LONG_SIDE,
  DUPLICATE_MAX_DISTANCE,
  MAX_UPLOAD_BYTES,
  analysePhoto,
  duplicateIssue,
  hammingDistance,
  hashBands,
  sniffFormat,
  type AiImageDetector,
  type PhotoIssue,
  type PhotoMetrics,
} from "./photo-analysis";

/** A photo that passed every check and is stored. */
export type ListingPhoto = {
  id: string;
  url: string;
  storagePath: string;
  hash: string;
  width: number;
  height: number;
  /** Kept on the listing so a moderator can see why it was accepted. */
  checks: Pick<PhotoMetrics, "sharpness" | "screenshotScore" | "cameraMake" | "cameraModel">;
};

export type PhotoCheckResult =
  | { ok: true; hash: string; width: number; height: number; metrics: PhotoMetrics }
  | { ok: false; issues: PhotoIssue[] };

/**
 * Model-based AI detectors run after the metadata check. None is configured;
 * see AiImageDetector in photo-analysis.ts for how to add one.
 */
const aiDetectors: AiImageDetector[] = [];

const FINGERPRINTS = "photo_fingerprints";
const UPLOAD_LONG_SIDE = 2560;
const UPLOAD_QUALITY = 0.86;

async function decode(file: File): Promise<ImageBitmap | null> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return null;
  }
}

function draw(bitmap: ImageBitmap, longSide: number): HTMLCanvasElement {
  const scale = Math.min(1, longSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("This browser cannot process images.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  // PNGs with transparency would otherwise encode to JPEG with black behind.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Runs every per-file check. Duplicates are checked separately, below. */
export async function checkPhoto(file: File): Promise<PhotoCheckResult> {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const format = sniffFormat(head);
  if (format === "unknown" || format === "gif") {
    return {
      ok: false,
      issues: [{
        code: "unsupported_type",
        title: "Not a photo file",
        detail: "Listing photos must be JPEG, PNG, WebP or HEIC images.",
        fix: "Choose the photo file itself rather than a document, video or animation.",
      }],
    };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      issues: [{
        code: "too_large",
        title: "File too large",
        detail: `This file is ${Math.round(file.size / 1024 / 1024)} MB. The limit is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`,
        fix: "Export the photo at a smaller size, around 4000 pixels wide.",
      }],
    };
  }

  const bitmap = await decode(file);
  if (!bitmap) {
    return {
      ok: false,
      issues: [{
        code: "unreadable",
        title: format === "heic" ? "iPhone HEIC photo can't be opened here" : "Photo can't be opened",
        detail:
          format === "heic"
            ? "This browser can't read Apple's HEIC format."
            : "The file is damaged or in a format this browser can't read.",
        fix:
          format === "heic"
            ? "Upload from Safari, or on your iPhone set Settings → Camera → Formats → Most Compatible, or share the photo as JPEG."
            : "Re-export the photo as a JPEG and try again.",
      }],
    };
  }

  try {
    const canvas = draw(bitmap, ANALYSIS_LONG_SIDE);
    const image = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
    const result = analysePhoto({
      fileName: file.name,
      bytes: new Uint8Array(await file.arrayBuffer()),
      width: bitmap.width,
      height: bitmap.height,
      pixels: { width: image.width, height: image.height, data: image.data },
    });

    const issues = [...result.issues];
    if (!issues.some((issue) => issue.code === "ai_generated" || issue.code === "ai_edited")) {
      for (const detector of aiDetectors) {
        const reason = await detector.detect(file);
        if (reason) {
          issues.push({
            code: "ai_generated",
            title: "AI-generated image",
            detail: reason,
            fix: "Upload a real photograph of the property.",
          });
          break;
        }
      }
    }

    return issues.length > 0
      ? { ok: false, issues }
      : { ok: true, hash: result.hash, width: bitmap.width, height: bitmap.height, metrics: result.metrics };
  } finally {
    bitmap.close();
  }
}

/** True when the hash is within DUPLICATE_MAX_DISTANCE of any hash given. */
export function isNearDuplicate(hash: string, others: Iterable<string>): boolean {
  for (const other of others) {
    if (hammingDistance(hash, other) <= DUPLICATE_MAX_DISTANCE) return true;
  }
  return false;
}

/**
 * Looks the photo up among every photo already submitted on a real listing.
 * Uses the hash bands so the query is indexed, not a collection scan. The demo
 * catalogue is never in this collection, so its shared stock photos are not
 * duplicates of anything.
 */
export async function findExistingDuplicate(hash: string): Promise<PhotoIssue | null> {
  if (!isFirebaseConfigured || !db) return null;
  let snapshot;
  try {
    snapshot = await getDocs(
      query(collection(db, FINGERPRINTS), where("bands", "array-contains-any", hashBands(hash)), limit(50))
    );
  } catch (error) {
    // Fail closed: a photo that could not be checked is not let through.
    throw new Error("Couldn't check your photos against other listings. Check your connection and try again.", { cause: error });
  }
  const matches = snapshot.docs.map((item) => String(item.data().hash ?? ""));
  return isNearDuplicate(hash, matches) ? duplicateIssue("existing") : null;
}

/**
 * Re-encodes to JPEG at a sensible size before upload. This also strips EXIF,
 * which matters: a phone photo's GPS tag would otherwise publish the seller's
 * exact home coordinates alongside the listing.
 */
async function toUploadBlob(file: File): Promise<Blob> {
  const bitmap = await decode(file);
  if (!bitmap) throw new Error("The photo could not be read for upload.");
  try {
    const canvas = draw(bitmap, UPLOAD_LONG_SIDE);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", UPLOAD_QUALITY));
    if (!blob) throw new Error("The photo could not be prepared for upload.");
    return blob;
  } finally {
    bitmap.close();
  }
}

export async function uploadListingPhoto(
  ownerId: string,
  file: File,
  checked: Extract<PhotoCheckResult, { ok: true }>
): Promise<ListingPhoto> {
  if (!isFirebaseConfigured || !storage) {
    throw new Error("Photo storage is not configured.");
  }
  const id = crypto.randomUUID();
  const storagePath = `listing-photos/${ownerId}/${id}.jpg`;
  const blob = await toUploadBlob(file);
  const target = ref(storage, storagePath);
  try {
    await uploadBytes(target, blob, { contentType: "image/jpeg" });
  } catch (error) {
    const code = (error as { code?: string }).code ?? "";
    const status = (error as { status_?: number }).status_;
    if (status === 404 || code === "storage/bucket-not-found" || code === "storage/project-not-found") {
      throw new Error("Photo storage isn't set up on this site yet, so photos can't be saved. This is our problem, not your photo's.", { cause: error });
    }
    if (code === "storage/unauthorized" || code === "storage/unauthenticated") {
      throw new Error("You need to be signed in to upload photos.", { cause: error });
    }
    throw new Error("The upload failed. Check your connection and try again.", { cause: error });
  }
  return {
    id,
    url: await getDownloadURL(target),
    storagePath,
    hash: checked.hash,
    width: checked.width,
    height: checked.height,
    checks: {
      sharpness: checked.metrics.sharpness,
      screenshotScore: checked.metrics.screenshotScore,
      ...(checked.metrics.cameraMake ? { cameraMake: checked.metrics.cameraMake } : {}),
      ...(checked.metrics.cameraModel ? { cameraModel: checked.metrics.cameraModel } : {}),
    },
  };
}

/**
 * Registers a saved listing's photos so later uploads elsewhere are caught as
 * duplicates. Added to the caller's batch so the listing and its fingerprints
 * commit together. Done when the listing is saved rather than at upload, so a
 * seller who abandons the wizard is not later blocked by their own photos.
 */
export function addPhotoFingerprints(
  batch: WriteBatch,
  listingId: string,
  ownerId: string,
  photos: ListingPhoto[]
): void {
  if (!db) return;
  for (const photo of photos) {
    batch.set(doc(db, FINGERPRINTS, photo.id), {
      hash: photo.hash,
      bands: hashBands(photo.hash),
      ownerId,
      listingId,
      createdAt: serverTimestamp(),
    });
  }
}
