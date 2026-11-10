import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";

import { db, isFirebaseConfigured } from "./firebase";

/**
 * Enquiries on the signed-in owner's own listings, for the seller portal.
 *
 * Until this existed a private seller could not see a single enquiry: they
 * were stored with no record of whose listing they were for, and only agents,
 * admins and the sender could read them. Each enquiry now carries the
 * listing's `ownerId` (checked against the listing by firestore.rules).
 * Enquiries filed before that have no owner and stay invisible here.
 */

export const SELLER_INQUIRY_STATUSES = ["new", "contacted"] as const;
export type SellerInquiryStatus = (typeof SELLER_INQUIRY_STATUSES)[number];

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
};

function toDate(value: unknown): Date | null {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate() as Date;
  }
  return null;
}

export async function getSellerInquiries(ownerId: string): Promise<SellerInquiry[]> {
  if (!isFirebaseConfigured || !db) return [];

  // Sorted here rather than with orderBy, which would need a composite index.
  const snapshot = await getDocs(query(collection(db, "inquiries"), where("ownerId", "==", ownerId)));

  return snapshot.docs
    .map((item) => {
      const data = item.data();
      return {
        id: item.id,
        propertyId: String(data.propertyId ?? ""),
        propertyTitle: String(data.propertyTitle ?? "Your listing"),
        kind: String(data.kind ?? "message"),
        status: String(data.status ?? "new"),
        notes: String(data.notes ?? ""),
        contactName: String(data.contactName ?? ""),
        contactEmail: String(data.userEmail ?? ""),
        contactPhone: String(data.contactPhone ?? ""),
        createdAt: toDate(data.createdAt),
      };
    })
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}

/** The owner may change the status and nothing else (firestore.rules). */
export async function setSellerInquiryStatus(inquiryId: string, status: SellerInquiryStatus) {
  if (!isFirebaseConfigured || !db) throw new Error("Firebase is not configured.");
  await updateDoc(doc(db, "inquiries", inquiryId), { status });
}
