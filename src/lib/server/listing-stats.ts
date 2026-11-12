import { FieldValue } from "firebase-admin/firestore";

import { EVENT_FIELD, sastDay, statsDocId, type ListingEvent } from "@/lib/listing-stats";
import { PUBLIC_LISTING_STATUSES } from "@/lib/types/domain";

import { adminDb } from "./firebase-admin";

/**
 * Server side of F1 (see lib/listing-stats.ts). The listing's owner is read
 * from the listing itself, never taken from the request, so nobody can pin
 * counts on someone else's account. Only public listings are counted: a draft
 * has no page to view.
 */

export type RecordResult = "counted" | "unknown-listing";

// Owner lookups are cached briefly per server instance: a busy listing would
// otherwise cost a read on every view.
const ownerCache = new Map<string, { ownerId: string | null; at: number }>();
const OWNER_TTL_MS = 5 * 60 * 1000;

async function ownerOf(listingId: string): Promise<string | null> {
  const hit = ownerCache.get(listingId);
  if (hit && Date.now() - hit.at < OWNER_TTL_MS) return hit.ownerId;
  const snap = await adminDb().doc(`properties/${listingId}`).get();
  const data = snap.data();
  const isPublic = (PUBLIC_LISTING_STATUSES as readonly string[]).includes(String(data?.status ?? ""));
  const ownerId = snap.exists && isPublic && typeof data?.ownerId === "string" && data.ownerId ? data.ownerId : null;
  if (ownerCache.size > 2000) ownerCache.clear();
  ownerCache.set(listingId, { ownerId, at: Date.now() });
  return ownerId;
}

export async function recordListingEvent(listingId: string, event: ListingEvent): Promise<RecordResult> {
  const ownerId = await ownerOf(listingId);
  if (!ownerId) return "unknown-listing";
  const date = sastDay();
  await adminDb()
    .doc(`listing_stats/${statsDocId(listingId, date)}`)
    .set(
      {
        listingId,
        ownerId,
        date,
        [EVENT_FIELD[event]]: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  return "counted";
}

/** Daily stats are kept this long (docs/dashboards/PLAN.md, open decision 3). */
export const STATS_RETENTION_MONTHS = 13;

/** The first SAST day that is kept: the same date STATS_RETENTION_MONTHS ago. */
export function retentionCutoff(now: number = Date.now()): string {
  const [y, m, d] = sastDay(now).split("-").map(Number);
  const cutoff = new Date(Date.UTC(y, m - 1 - STATS_RETENTION_MONTHS, d));
  return cutoff.toISOString().slice(0, 10);
}

/**
 * Deletes listing_stats days older than the cutoff, in pages, so one night
 * never runs long. Returns how many were deleted and whether any are left.
 */
export async function deleteOldStats(cutoff: string, maxDocs = 5000): Promise<{ deleted: number; more: boolean }> {
  let deleted = 0;
  while (deleted < maxDocs) {
    const page = await adminDb()
      .collection("listing_stats")
      .where("date", "<", cutoff)
      .limit(Math.min(400, maxDocs - deleted))
      .get();
    if (page.empty) return { deleted, more: false };
    const batch = adminDb().batch();
    page.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += page.size;
  }
  return { deleted, more: true };
}
