import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db, isFirebaseConfigured } from "./firebase";
import { type ListingLifecycleStatus } from "./types/domain";

/**
 * Approving a listing publishes it. It used to write "Approved", which is not in
 * the rules' public read list, so a moderator could approve a listing and it
 * would stay invisible to every visitor with nothing reporting a problem.
 * "Approved" remains in the vocabulary for a future two-step review flow.
 */
function statusForDecision(decision: ModerationDecision): ListingLifecycleStatus {
  switch (decision) {
    case "Approved":
      return "Published";
    case "Needs changes":
      return "Needs changes";
    case "Rejected":
      return "Archived";
  }
}
import {
  findDuplicatesInCatalog,
  type DuplicateMatchResult,
} from "./server/duplicate-detector";
import {
  decomposePropertyRecord,
  getEnrichedListings,
} from "./server/property-service";
import type { PropertyRecord } from "./property-data";

export type ModerationDecision = "Approved" | "Needs changes" | "Rejected";

export type ModerationItem = {
  id: string;
  propertyId: string;
  title: string;
  sellerEmail: string;
  price: string;
  location: string;
  qualityScore: number;
  status: ListingLifecycleStatus;
  submittedAt: string;
  fraudSignals?: string[];
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
    sellerEmail: "seller@bryanston.co.za",
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
    sellerEmail: "unverified@agentmail.co.za",
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
    const q = query(
      collection(db, "properties"),
      where("status", "==", "Submitted"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const snap = await getDocs(q);
    if (snap.empty) return fallbackModerationQueue;

    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        propertyId: data.propertyId ?? d.id,
        title: data.title ?? "Untitled",
        sellerEmail: data.ownerEmail ?? "Unknown",
        price: data.price ?? "On request",
        location: data.location ?? "",
        qualityScore: Number(data.qualityScore ?? 80),
        status: (data.status as ListingLifecycleStatus) ?? "Submitted",
        submittedAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        fraudSignals: Array.isArray(data.fraudSignals) ? data.fraudSignals : [],
      };
    });
  } catch (error) {
    // This query needs a composite index that does not exist yet, so it fails
    // every time. Returning the demo queue made the console look functional.
    console.error("Moderation queue query failed:", error);
    throw new Error("Unable to load the moderation queue.", { cause: error });
  }
}

export async function recordAuditLog({
  actorId,
  actorEmail,
  action,
  resource,
  details,
}: {
  actorId: string;
  actorEmail?: string;
  action: string;
  resource: string;
  details: string;
}): Promise<void> {
  const newLog: AuditLogEntry = {
    id: `log-${Date.now()}`,
    actorId,
    actorEmail,
    action,
    resource,
    details,
    timestamp: new Date().toISOString(),
  };

  fallbackAuditLogs.unshift(newLog);

  if (isFirebaseConfigured && db) {
    try {
      await addDoc(collection(db, "audit_logs"), {
        actorId,
        actorEmail: actorEmail ?? "system",
        action,
        resource,
        details,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      // `audit_logs` has no security rules, so this write is denied by default.
      // Swallowing it meant the audit trail existed only in an in-memory array
      // while the console reported "Audit log recorded".
      console.error("Failed to write audit log:", error);
      throw new Error("Could not record the audit log entry.", { cause: error });
    }
  }
}

export async function executeModerationDecision(
  listingId: string,
  decision: ModerationDecision,
  feedback: string,
  moderatorId: string,
  moderatorEmail: string
): Promise<void> {
  const targetStatus = statusForDecision(decision);

  const item = fallbackModerationQueue.find((i) => i.id === listingId);
  if (item) {
    item.status = targetStatus;
  }

  await recordAuditLog({
    actorId: moderatorId,
    actorEmail: moderatorEmail,
    action: `moderation.${decision.toLowerCase().replace(" ", "_")}`,
    resource: `properties/${listingId}`,
    details: `Decision: ${decision}. Feedback: ${feedback || "None"}`,
  });

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, "properties", listingId), {
        status: targetStatus,
        moderationFeedback: feedback,
        moderatedBy: moderatorId,
        moderatedAt: serverTimestamp(),
        // Stamped on the transition to Published so structured data can emit a
        // real datePosted instead of a hardcoded one, and so a listing's history
        // has a first-published date to work from.
        ...(targetStatus === "Published" ? { publishedAt: serverTimestamp() } : {}),
      });
    } catch (error) {
      // The admin console reported "Listing successfully marked as Approved"
      // regardless of what happened here. The decision has to fail loudly, or a
      // moderator believes they have published something they have not.
      console.error("Failed to apply moderation decision:", error);
      throw new Error(`Could not apply the "${decision}" decision to this listing.`, { cause: error });
    }
  }
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  if (!isFirebaseConfigured || !db) {
    return fallbackAuditLogs;
  }

  try {
    const q = query(collection(db, "audit_logs"), orderBy("createdAt", "desc"), limit(25));
    const snap = await getDocs(q);
    if (snap.empty) return fallbackAuditLogs;

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
export function checkListingForDuplicates(candidateRecord: PropertyRecord): DuplicateMatchResult[] {
  const { property: candidateProperty } = decomposePropertyRecord(candidateRecord);
  const enrichedCatalog = getEnrichedListings();
  const physicalCatalog = enrichedCatalog.map((item) => item.property);
  return findDuplicatesInCatalog(candidateProperty, physicalCatalog);
}

