import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp } from "firebase/firestore";

import { db, isFirebaseConfigured } from "./firebase";

/**
 * Support & Guidance messages from the account menu. Stored in
 * `support_requests` (see firestore.rules) and read by admins on /admin.
 * Nothing is emailed: there is no outbound mail service or support inbox yet.
 */
export type SupportRequest = {
  id: string;
  userId: string;
  userEmail: string | null;
  message: string;
  status: string;
  createdAt?: string;
};

export async function createSupportRequest({
  userId,
  userEmail,
  message,
}: {
  userId: string;
  userEmail: string | null;
  message: string;
}): Promise<string> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Support requests cannot be saved: Firebase is not configured.");
  }
  // No catch: a denied write must reach the form so it does not claim success.
  const ref = await addDoc(collection(db, "support_requests"), {
    userId,
    userEmail,
    message,
    status: "new",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getSupportRequests(): Promise<SupportRequest[]> {
  if (!isFirebaseConfigured || !db) return [];
  const snapshot = await getDocs(
    query(collection(db, "support_requests"), orderBy("createdAt", "desc"), limit(50)),
  );
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId ?? "",
      userEmail: data.userEmail ?? null,
      message: data.message ?? "",
      status: data.status ?? "new",
      createdAt: data.createdAt?.toDate?.().toISOString(),
    };
  });
}
