import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, where } from "firebase/firestore";

import { db, isFirebaseConfigured } from "./firebase";

export type TenantApplicationStatus =
  | "submitted"
  | "vetting"
  | "approved"
  | "declined"
  | "withdrawn";

export type TenantApplicationInput = {
  applicantId: string;
  applicantEmail: string | null;
  propertyId: string;
  propertyTitle: string;
  fullName: string;
  idNumber: string;
  email: string;
  phone: string;
  employer?: string;
  netIncome: string;
  occupationDate: string;
  leaseTerm: string;
  monthlyRentZAR: number;
  depositZAR: number;
  totalMoveInCostZAR: number;
  creditConsent: boolean;
};

export type TenantApplication = TenantApplicationInput & {
  id: string;
  reference: string;
  status: TenantApplicationStatus;
  createdAt?: string;
};

/**
 * A human-quotable reference derived from the document id, so the number the
 * applicant is shown can always be traced back to the stored record.
 */
export function applicationReference(docId: string): string {
  return `DY-TEN-${docId.slice(-6).toUpperCase()}`;
}

/**
 * Files a tenancy application.
 *
 * This throws rather than degrading when Firebase is absent: an application
 * that silently vanishes is worse than one that visibly fails, because the
 * applicant believes a legal process has started.
 *
 * Note the record holds identity-document and income data, so `firestore.rules`
 * restricts reads to the applicant and to agents/admins.
 */
export async function createTenantApplication(
  input: TenantApplicationInput,
): Promise<{ id: string; reference: string }> {
  if (!isFirebaseConfigured || !db) {
    throw new Error(
      "Applications cannot be submitted yet — this environment is not connected to Firebase. Please try again later.",
    );
  }

  if (!input.creditConsent) {
    throw new Error("Credit and reference checking consent is required to submit an application.");
  }

  const applied = await addDoc(collection(db, "applications"), {
    ...input,
    employer: input.employer ?? "",
    status: "submitted" satisfies TenantApplicationStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: applied.id, reference: applicationReference(applied.id) };
}

/** Applications filed by one user, newest first. */
export async function getApplicationsForUser(applicantId: string): Promise<TenantApplication[]> {
  if (!isFirebaseConfigured || !db) return [];

  const snapshot = await getDocs(
    query(collection(db, "applications"), where("applicantId", "==", applicantId), orderBy("createdAt", "desc")),
  );

  return snapshot.docs.map((item) => ({
    ...(item.data() as TenantApplicationInput),
    id: item.id,
    reference: applicationReference(item.id),
    status: (item.data().status as TenantApplicationStatus) ?? "submitted",
    createdAt: item.data().createdAt?.toDate?.().toISOString(),
  }));
}
