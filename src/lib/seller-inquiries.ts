import { collection, deleteField, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";

import { db, isFirebaseConfigured } from "./firebase";

/**
 * Enquiries on the signed-in owner's own listings, for the seller portal and
 * the agent dashboard (both through components/enquiry-inbox.tsx). An agent
 * is an owner like any other here: they see enquiries on listings they filed.
 *
 * Until this existed a private seller could not see a single enquiry: they
 * were stored with no record of whose listing they were for, and only agents,
 * admins and the sender could read them. Each enquiry now carries the
 * listing's `ownerId` (checked against the listing by firestore.rules).
 * Enquiries filed before that have no owner and stay invisible here.
 */

export const SELLER_INQUIRY_STATUSES = ["new", "contacted"] as const;
export type SellerInquiryStatus = (typeof SELLER_INQUIRY_STATUSES)[number];

/**
 * An agent works an enquiry through stages (Phase D, F2). Private sellers keep
 * New / Contacted; firestore.rules allow the later stages only to agents and
 * admins. "Won" and "Lost" close the enquiry.
 */
export const INQUIRY_STAGES = ["new", "contacted", "viewing", "offer", "won", "lost"] as const;
export type InquiryStage = (typeof INQUIRY_STAGES)[number];

export const STAGE_LABEL: Record<InquiryStage, string> = {
  new: "New",
  contacted: "Contacted",
  viewing: "Viewing booked",
  offer: "Offer made",
  won: "Won",
  lost: "Lost",
};

export function asStage(status: string): InquiryStage {
  return (INQUIRY_STAGES as readonly string[]).includes(status) ? (status as InquiryStage) : "new";
}

/**
 * Median time from an enquiry arriving to its first reply, over enquiries that
 * arrived in the last `days` days and have a recorded reply. Null when none
 * do (older enquiries have no reply time, so they are left out, not guessed).
 */
export function medianReplyMs(
  items: Pick<SellerInquiry, "createdAt" | "firstRespondedAt">[],
  now: number,
  days = 30,
): { ms: number; count: number } | null {
  const since = now - days * 24 * 60 * 60 * 1000;
  const waits = items
    .filter((item) => item.createdAt && item.firstRespondedAt && item.createdAt.getTime() >= since)
    .map((item) => Math.max(0, item.firstRespondedAt!.getTime() - item.createdAt!.getTime()))
    .sort((a, b) => a - b);
  if (waits.length === 0) return null;
  const mid = Math.floor(waits.length / 2);
  const ms = waits.length % 2 ? waits[mid] : (waits[mid - 1] + waits[mid]) / 2;
  return { ms, count: waits.length };
}

/** Stages that mean the buyer got at least as far as a viewing / an offer. */
export const REACHED_VIEWING: readonly InquiryStage[] = ["viewing", "offer", "won"];
export const REACHED_OFFER: readonly InquiryStage[] = ["offer", "won"];

export type SellerInquiry = {
  id: string;
  propertyId: string;
  propertyTitle: string;
  kind: string;
  status: string;
  notes: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  createdAt: Date | null;
  /** When the owner first moved it out of New. Set once; older enquiries have none. */
  firstRespondedAt: Date | null;
  updatedAt: Date | null;
  /** The listing's owner (the agent or seller who filed it). */
  ownerId: string;
  /** Agent an agency principal assigned it to (Phase G); null = the listing's own agent. */
  assignedTo: string | null;
};

function toDate(value: unknown): Date | null {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate() as Date;
  }
  return null;
}

function fromDoc(id: string, data: Record<string, unknown>): SellerInquiry {
  return {
    id,
    propertyId: String(data.propertyId ?? ""),
    propertyTitle: String(data.propertyTitle ?? "Your listing"),
    kind: String(data.kind ?? "message"),
    status: String(data.status ?? "new"),
    notes: String(data.notes ?? ""),
    contactName: String(data.contactName ?? ""),
    contactEmail: String(data.userEmail ?? ""),
    contactPhone: String(data.contactPhone ?? ""),
    createdAt: toDate(data.createdAt),
    firstRespondedAt: toDate(data.firstRespondedAt),
    updatedAt: toDate(data.updatedAt),
    ownerId: String(data.ownerId ?? ""),
    assignedTo: typeof data.assignedTo === "string" && data.assignedTo ? data.assignedTo : null,
  };
}

const newestFirst = (a: SellerInquiry, b: SellerInquiry) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);

/**
 * Enquiries on listings owned by `ownerId`. The owner reads their own; an
 * agency principal reads a member's (firestore.rules, Phase G).
 */
export async function getSellerInquiries(ownerId: string): Promise<SellerInquiry[]> {
  if (!isFirebaseConfigured || !db) return [];
  const snapshot = await getDocs(query(collection(db, "inquiries"), where("ownerId", "==", ownerId)));
  return snapshot.docs.map((item) => fromDoc(item.id, item.data())).sort(newestFirst);
}

/** Enquiries an agency principal assigned to this agent (Phase G). */
export async function getAssignedInquiries(uid: string): Promise<SellerInquiry[]> {
  if (!isFirebaseConfigured || !db) return [];
  const snapshot = await getDocs(query(collection(db, "inquiries"), where("assignedTo", "==", uid)));
  return snapshot.docs.map((item) => fromDoc(item.id, item.data())).sort(newestFirst);
}

/**
 * The agent's working inbox: their own listings' enquiries, minus any a
 * principal handed to someone else, plus any handed to them.
 */
export async function getInboxInquiries(uid: string): Promise<SellerInquiry[]> {
  const [own, assigned] = await Promise.all([getSellerInquiries(uid), getAssignedInquiries(uid)]);
  const mine = own.filter((item) => !item.assignedTo || item.assignedTo === uid);
  const seen = new Set(mine.map((item) => item.id));
  return [...mine, ...assigned.filter((item) => !seen.has(item.id))].sort(newestFirst);
}

/**
 * Hands an enquiry to an agent of the agency, or back to the listing's own
 * agent (`null`). Principals only; nothing else on the enquiry changes.
 */
export async function assignInquiry(id: string, assignee: string | null): Promise<void> {
  if (!isFirebaseConfigured || !db) throw new Error("Firebase is not configured.");
  await updateDoc(doc(db, "inquiries", id), {
    assignedTo: assignee ?? deleteField(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * The owner may change the stage, the first-reply time (once) and updatedAt,
 * nothing else (firestore.rules). The first time an enquiry leaves New, the
 * server clock records the reply time; moving it back to New and out again
 * keeps the first one. Returns the fields as saved, for the local list (the
 * local times are the browser's clock, close enough until the next load).
 */
export async function setInquiryStage(
  item: Pick<SellerInquiry, "id" | "status" | "firstRespondedAt">,
  stage: InquiryStage,
): Promise<{ status: InquiryStage; firstRespondedAt: Date | null; updatedAt: Date }> {
  if (!isFirebaseConfigured || !db) throw new Error("Firebase is not configured.");
  // Only when it is leaving New: an older enquiry already marked Contacted
  // has no reply time, and stamping "now" on it would invent one.
  const firstReply = item.status === "new" && stage !== "new" && !item.firstRespondedAt;
  await updateDoc(doc(db, "inquiries", item.id), {
    status: stage,
    updatedAt: serverTimestamp(),
    ...(firstReply ? { firstRespondedAt: serverTimestamp() } : {}),
  });
  const now = new Date();
  return { status: stage, firstRespondedAt: firstReply ? now : item.firstRespondedAt, updatedAt: now };
}
