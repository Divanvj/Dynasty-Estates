"use client";

import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

import { db, isFirebaseConfigured } from "./firebase";
import type { DayStats } from "./listing-stats";

/**
 * Reads the signed-in owner's listing statistics (F1). Both queries filter on
 * ownerId, which is what firestore.rules require for a list query, and each
 * has its composite index in firestore.indexes.json.
 */

function toDay(data: Record<string, unknown>): DayStats {
  return {
    date: String(data.date ?? ""),
    listingId: String(data.listingId ?? ""),
    views: Number(data.views ?? 0),
    saves: Number(data.saves ?? 0),
    contactClicks: Number(data.contactClicks ?? 0),
  };
}

/** Every listing of this owner, from `sinceDay` ("YYYY-MM-DD") on. */
export async function getOwnerStats(ownerId: string, sinceDay: string): Promise<DayStats[]> {
  if (!isFirebaseConfigured || !db) return [];
  const snap = await getDocs(
    query(collection(db, "listing_stats"), where("ownerId", "==", ownerId), where("date", ">=", sinceDay)),
  );
  return snap.docs.map((d) => toDay(d.data()));
}

/** One listing of this owner, from `sinceDay` on. */
export async function getListingStats(ownerId: string, listingId: string, sinceDay: string): Promise<DayStats[]> {
  if (!isFirebaseConfigured || !db) return [];
  const snap = await getDocs(
    query(
      collection(db, "listing_stats"),
      where("ownerId", "==", ownerId),
      where("listingId", "==", listingId),
      where("date", ">=", sinceDay),
    ),
  );
  return snap.docs.map((d) => toDay(d.data()));
}

/** Loads owner stats once the uid is known; `null` rows = still loading. */
export function useOwnerStats(uid: string | null | undefined, sinceDay: string) {
  const [loaded, setLoaded] = useState<{ key: string; rows: DayStats[]; failed: boolean } | null>(null);
  const key = `${uid}|${sinceDay}`;
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    getOwnerStats(uid, sinceDay)
      .then((rows) => !cancelled && setLoaded({ key: `${uid}|${sinceDay}`, rows, failed: false }))
      .catch((error) => {
        console.error("Could not load listing statistics:", error);
        if (!cancelled) setLoaded({ key: `${uid}|${sinceDay}`, rows: [], failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [uid, sinceDay]);
  const current = loaded?.key === key ? loaded : null;
  return {
    // A failed load is "no data", never zero views.
    rows: uid === null ? [] : current && !current.failed ? current.rows : null,
    failed: Boolean(current?.failed),
  };
}

/** Views per listing id across the given rows. */
export function viewsByListing(rows: DayStats[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const row of rows) out.set(row.listingId, (out.get(row.listingId) ?? 0) + row.views);
  return out;
}
