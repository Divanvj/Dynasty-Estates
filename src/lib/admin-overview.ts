import { collection, getCountFromServer, getDocs, query, Timestamp, where } from "firebase/firestore";

import { db, isFirebaseConfigured } from "./firebase";
import { ACTIVE_CATALOGUE_STATUSES } from "./types/domain";

/**
 * Figures for the /admin overview, read with the admin's own token (so
 * firestore.rules apply). Counts use aggregate queries, which bill one read
 * per 1,000 documents counted rather than one per document.
 */

function requireDb() {
  if (!isFirebaseConfigured || !db) throw new Error("Firebase is not configured.");
  return db;
}

export async function countLiveListings(): Promise<number> {
  const snap = await getCountFromServer(
    query(collection(requireDb(), "properties"), where("status", "in", [...ACTIVE_CATALOGUE_STATUSES])),
  );
  return snap.data().count;
}

export async function countEnquiriesSince(since: Date): Promise<number> {
  const snap = await getCountFromServer(
    query(collection(requireDb(), "inquiries"), where("createdAt", ">=", Timestamp.fromDate(since))),
  );
  return snap.data().count;
}

export type WaitingListing = { id: string; title: string; submittedAt: Date | null };

/**
 * Every listing waiting for review, oldest first. Read whole rather than
 * ordered in the query: an ascending sort would need a second composite index,
 * and the queue is small enough to sort here.
 */
export async function getWaitingForReview(): Promise<WaitingListing[]> {
  const snap = await getDocs(query(collection(requireDb(), "properties"), where("status", "==", "Submitted")));
  return snap.docs
    .map((d) => {
      const data = d.data();
      const at = data.createdAt?.toDate?.();
      return { id: d.id, title: String(data.title ?? "Untitled"), submittedAt: at instanceof Date ? at : null };
    })
    .sort((a, b) => (a.submittedAt?.getTime() ?? 0) - (b.submittedAt?.getTime() ?? 0));
}
