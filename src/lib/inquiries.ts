import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { db, isFirebaseConfigured } from "./firebase";

export type InquiryKind = "tour" | "viewing" | "message";

export async function createPropertyInquiry({
  userId,
  userEmail,
  propertyId,
  propertyTitle,
  kind,
  notes,
}: {
  userId: string;
  userEmail: string | null;
  propertyId: string;
  propertyTitle: string;
  kind: InquiryKind;
  notes?: string;
}) {
  // Demo mode: no Firebase, so there is nothing to persist to. The caller still
  // gets an id so the UI flow can be exercised.
  if (!isFirebaseConfigured || !db) {
    return `inq_${Date.now()}`;
  }

  // No catch here on purpose. A failed write used to return a synthetic id, which
  // made the button report "enquiry sent" for an enquiry that was never stored.
  // The error must reach the caller so the buyer is told the truth.
  const inquiry = await addDoc(collection(db, "inquiries"), {
    userId,
    userEmail,
    propertyId,
    propertyTitle,
    kind,
    notes: notes ?? "",
    status: "new",
    createdAt: serverTimestamp(),
  });

  return inquiry.id;
}
