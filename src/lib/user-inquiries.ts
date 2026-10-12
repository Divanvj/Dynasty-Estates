import { collection, getDocs, query, where } from "firebase/firestore";

import { db, isFirebaseConfigured } from "./firebase";

export type UserInquiry = {
  id: string;
  propertyId: string;
  propertyTitle: string;
  kind: string;
  status: string;
  createdAt?: string;
};

export async function getUserInquiries(userId: string): Promise<UserInquiry[]> {
  if (!isFirebaseConfigured || !db) {
    return [];
  }

  const snapshot = await getDocs(
    query(collection(db, "inquiries"), where("userId", "==", userId)),
  );

  return snapshot.docs.map((inquiry) => ({
    id: inquiry.id,
    propertyId: inquiry.data().propertyId ?? "",
    propertyTitle: inquiry.data().propertyTitle ?? "Property request",
    kind: inquiry.data().kind ?? "message",
    status: inquiry.data().status ?? "new",
  }));
}
