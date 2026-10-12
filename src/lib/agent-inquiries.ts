import { collection, getDocs, limit, query } from "firebase/firestore";

import { db, isFirebaseConfigured } from "./firebase";

export type AgentInquiry = {
  id: string;
  userEmail: string;
  propertyTitle: string;
  kind: string;
  status: string;
  propertyId?: string;
  createdAt?: string;
};

export async function getRecentInquiries(): Promise<AgentInquiry[]> {
  if (!isFirebaseConfigured || !db) {
    return [];
  }

  const snapshot = await getDocs(query(collection(db, "inquiries"), limit(20)));
  return snapshot.docs.map((inquiry) => ({
    id: inquiry.id,
    userEmail: inquiry.data().userEmail ?? "Unknown contact",
    propertyTitle: inquiry.data().propertyTitle ?? "Property enquiry",
    kind: inquiry.data().kind ?? "message",
    status: inquiry.data().status ?? "new",
  }));
}
