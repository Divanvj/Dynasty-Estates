import { getStorage } from "firebase-admin/storage";

import { adminApp, adminDb, AdminUnavailableError, PROJECT_ID } from "./firebase-admin";

/**
 * Nightly clean-up of listing files nothing points at any more (run from
 * /api/cron/nightly):
 *
 *   - listing photos and floor plans in Cloud Storage that no listing's
 *     gallery, image or floorPlanUrl refers to: uploaded in a wizard that was
 *     never submitted, removed from a listing in an edit that couldn't delete
 *     them, or left by a deleted listing;
 *   - photo_fingerprints whose photo is no longer on its listing, so the
 *     duplicate check stops turning down a photo that was taken off.
 *
 * A file is only deleted once it is GRACE_DAYS old: a new listing's wizard
 * keeps its uploaded photos in the browser's autosave until it is submitted,
 * and those files have no listing yet.
 */

export const GRACE_DAYS = 30;
/** Per run, so one night can't spend long on a big backlog; the rest waits for tomorrow. */
const MAX_DELETES = 400;
const PREFIXES = ["listing-photos/", "floor-plans/"];

function bucketName(): string {
  return process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${PROJECT_ID}.firebasestorage.app`;
}

/** "https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<path>?alt=…" → "<path>". */
export function storagePathFromUrl(url: unknown): string {
  if (typeof url !== "string") return "";
  const encoded = url.split("/o/")[1]?.split("?")[0];
  return encoded ? decodeURIComponent(encoded) : "";
}

export type StorageCleanup = {
  scanned: number;
  referenced: number;
  deleted: number;
  /** Unreferenced but younger than GRACE_DAYS. */
  waiting: number;
  fingerprintsDeleted: number;
  more: boolean;
};

/** `dryRun` counts what would go without deleting anything (the console's check). */
export async function cleanUpListingFiles(options: { now?: number; dryRun?: boolean } = {}): Promise<StorageCleanup> {
  const now = options.now ?? Date.now();
  if (!adminApp()) throw new AdminUnavailableError();
  const db = adminDb();
  const cutoff = now - GRACE_DAYS * 86_400_000;

  // Every path a listing refers to, and each listing's photo ids.
  const referenced = new Set<string>();
  const photoIdsByListing = new Map<string, Set<string>>();
  const listings = await db.collection("properties").select("gallery", "image", "floorPlanUrl").get();
  for (const listing of listings.docs) {
    const data = listing.data();
    const urls = [...(Array.isArray(data.gallery) ? data.gallery : []), data.image, data.floorPlanUrl];
    const ids = new Set<string>();
    for (const url of urls) {
      const path = storagePathFromUrl(url);
      if (!path) continue;
      referenced.add(path);
      const file = path.split("/").pop() ?? "";
      ids.add(file.replace(/\.[a-z]+$/, ""));
    }
    photoIdsByListing.set(listing.id, ids);
  }

  let deleted = 0;
  let waiting = 0;
  let scanned = 0;
  let more = false;
  const bucket = getStorage(adminApp()!).bucket(bucketName());
  for (const prefix of PREFIXES) {
    const [files] = await bucket.getFiles({ prefix, autoPaginate: true });
    for (const file of files) {
      scanned += 1;
      if (referenced.has(file.name)) continue;
      const created = Date.parse(String(file.metadata.timeCreated ?? ""));
      if (!Number.isFinite(created) || created > cutoff) {
        waiting += 1;
        continue;
      }
      if (deleted >= MAX_DELETES) {
        more = true;
        continue;
      }
      if (!options.dryRun) await file.delete({ ignoreNotFound: true });
      deleted += 1;
    }
  }

  // Fingerprints are written with the listing (one batch), so any whose photo
  // is not on that listing now was taken off it, or the listing is gone.
  let fingerprintsDeleted = 0;
  const fingerprints = await db.collection("photo_fingerprints").select("listingId").get();
  const writer = db.bulkWriter();
  for (const fp of fingerprints.docs) {
    const listingId = String(fp.data().listingId ?? "");
    if (photoIdsByListing.get(listingId)?.has(fp.id)) continue;
    if (fingerprintsDeleted >= MAX_DELETES) {
      more = true;
      break;
    }
    if (!options.dryRun) void writer.delete(fp.ref);
    fingerprintsDeleted += 1;
  }
  await writer.close();

  return { scanned, referenced: referenced.size, deleted, waiting, fingerprintsDeleted, more };
}
