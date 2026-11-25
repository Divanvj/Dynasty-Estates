import type { User } from "firebase/auth";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { db, isFirebaseConfigured } from "./firebase";
import { statusForDecision, type ModerationDecision } from "./moderation-decisions";
import { type ListingLifecycleStatus } from "./types/domain";

import {
  findDuplicatesInCatalog,
  type DuplicateMatchResult,
} from "./server/duplicate-detector";
import {
  decomposePropertyRecord,
  getEnrichedListings,
} from "./server/property-service";
import type { PropertyRecord } from "./property-data";

export type { ModerationDecision } from "./moderation-decisions";

export type ModerationItem = {
  id: string;
  propertyId: string;
  title: string;
  /**
   * The listing's owner. Their e-mail address is no longer on the listing
   * (audit item 1.5); an admin gets it through /api/admin/listing-seller.
   */
  ownerId: string | null;
  price: string;
  location: string;
  qualityScore: number;
  status: ListingLifecycleStatus;
  submittedAt: string;
  fraudSignals?: string[];
  /** Cover photo URL, when the listing has one. */
  image?: string;
};

export type AuditLogEntry = {
  id: string;
  actorId: string;
  actorEmail?: string;
  action: string;
  resource: string;
  details: string;
  timestamp: string;
};

const fallbackModerationQueue: ModerationItem[] = [
  {
    id: "mod-1",
    propertyId: "prop-bryanston-1",
    title: "Bryanston Contemporary Villa with Solar",
    ownerId: null,
    price: "R 7,500,000",
    location: "Bryanston, Johannesburg, Gauteng",
    qualityScore: 92,
    status: "Submitted",
    submittedAt: "2026-09-03T18:30:00Z",
    fraudSignals: [],
  },
  {
    id: "mod-2",
    propertyId: "prop-campsbay-2",
    title: "Camps Bay Luxury Ocean View Villa",
    ownerId: null,
    price: "R 24,000,000",
    location: "Camps Bay, Cape Town, Western Cape",
    qualityScore: 86,
    status: "Submitted",
    submittedAt: "2026-09-03T19:15:00Z",
    fraudSignals: ["Near-duplicate hero image detected", "Agent PPRA FFC pending verification"],
  },
];

const fallbackAuditLogs: AuditLogEntry[] = [
  {
    id: "log-1",
    actorId: "admin-1",
    actorEmail: "compliance@dynastyestates.co.za",
    action: "listing.approve",
    resource: "properties/juniper-ridge",
    details: "Listing verified and approved for public publication.",
    timestamp: "2026-09-02T14:20:00Z",
  },
  {
    id: "log-2",
    actorId: "system",
    action: "fraud.flag_raised",
    resource: "properties/prop-campsbay-2",
    details: "Perceptual hash match (similarity 98%) with existing archived listing.",
    timestamp: "2026-09-03T19:15:05Z",
  },
];

export async function getPendingModerationQueue(): Promise<ModerationItem[]> {
  if (!isFirebaseConfigured || !db) {
    return fallbackModerationQueue;
  }

  try {
    // Equality on status plus a descending sort needs the composite index
    // (status ASC, createdAt DESC) declared in firestore.indexes.json. Changing
    // either the filter field or the sort means a new index: deploy it with
    // `npm run firebase:deploy:indexes` before the change ships, or this query
    // starts failing on every call.
    const q = query(
      collection(db, "properties"),
      where("status", "==", "Submitted"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const snap = await getDocs(q);
    // An empty queue is an empty queue. It used to return the demo items here,
    // so a signed-in moderator saw made-up submissions (with fraud flags) and
    // could "approve" a listing that does not exist.
    if (snap.empty) return [];

    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        propertyId: data.propertyId ?? d.id,
        title: data.title ?? "Untitled",
        ownerId: typeof data.ownerId === "string" && data.ownerId ? data.ownerId : null,
        price: data.price ?? "On request",
        location: data.location ?? "",
        qualityScore: Number(data.qualityScore ?? 80),
        status: (data.status as ListingLifecycleStatus) ?? "Submitted",
        submittedAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        fraudSignals: Array.isArray(data.fraudSignals) ? data.fraudSignals : [],
        image: typeof data.image === "string" && data.image.startsWith("http") ? data.image : undefined,
      };
    });
  } catch (error) {
    // Returning the demo queue here made the console look functional while the
    // query was failing on every call, so the failure has to surface.
    console.error("Moderation queue query failed:", error);
    throw new Error("Unable to load the moderation queue.", { cause: error });
  }
}

/**
 * Applies a moderator's decision through /api/admin/moderation, which checks
 * the caller is an admin or moderator, changes the listing's status and files
 * the audit entry in one transaction (item 1.3). The browser used to do both
 * itself, as two separate writes any agent was allowed to make.
 */
export async function executeModerationDecision(
  user: User,
  listingId: string,
  decision: ModerationDecision,
  feedback: string,
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    // Demo mode: no Firebase, so only the sample queue changes.
    const item = fallbackModerationQueue.find((i) => i.id === listingId);
    if (item) item.status = statusForDecision(decision);
    return;
  }

  const token = await user.getIdToken();
  const response = await fetch("/api/admin/moderation", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ listingId, decision, feedback }),
  });
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) {
    // The decision has to fail loudly, or a moderator believes they have
    // published something they have not.
    throw new Error(body?.error ?? `Could not apply the "${decision}" decision to this listing.`);
  }
}

export async function getAuditLogs(max = 25): Promise<AuditLogEntry[]> {
  if (!isFirebaseConfigured || !db) {
    return fallbackAuditLogs;
  }

  try {
    const q = query(collection(db, "audit_logs"), orderBy("createdAt", "desc"), limit(max));
    const snap = await getDocs(q);
    // Same as the queue: no stored entries means none, not the demo trail.
    if (snap.empty) return [];

    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        actorId: data.actorId ?? "",
        actorEmail: data.actorEmail,
        action: data.action ?? "unknown",
        resource: data.resource ?? "",
        details: data.details ?? "",
        timestamp: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error("Audit log query failed:", error);
    throw new Error("Unable to load the audit trail.", { cause: error });
  }
}

/**
 * Runs duplicate-property detection across the catalog for an incoming property record
 */
export function checkListingForDuplicates(candidateRecord: PropertyRecord, catalogue: PropertyRecord[]): DuplicateMatchResult[] {
  const { property: candidateProperty } = decomposePropertyRecord(candidateRecord);
  const enrichedCatalog = getEnrichedListings(catalogue);
  const physicalCatalog = enrichedCatalog.map((item) => item.property);
  return findDuplicatesInCatalog(candidateProperty, physicalCatalog);
}

