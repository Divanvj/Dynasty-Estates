import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";

import { db, isFirebaseConfigured } from "./firebase";
import { requestNotification } from "./notify-client";

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
  /**
   * The listing's owner (the letting agent or private landlord), so they can
   * read the application and are e-mailed about it. firestore.rules checks it
   * against the listing. Omitted when the listing has no owner (sample homes);
   * then only the applicant and admins see the application.
   */
  ownerId?: string;
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
 * restricts reads to the applicant, the listing's owner (and their agency
 * principal) and admins.
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

  const { ownerId, ...fields } = input;
  const applied = await addDoc(collection(db, "applications"), {
    ...fields,
    // Left off when there is no owner: Firestore refuses an undefined field.
    ...(ownerId ? { ownerId } : {}),
    employer: input.employer ?? "",
    status: "submitted" satisfies TenantApplicationStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // E-mail the letting agent or landlord. Only when there is one to tell.
  if (ownerId) requestNotification("/api/notify/application", { applicationId: applied.id });

  return { id: applied.id, reference: applicationReference(applied.id) };
}

/** Applications filed by one user, newest first. */
export async function getApplicationsForUser(applicantId: string): Promise<TenantApplication[]> {
  if (!isFirebaseConfigured || !db) return [];

  // Needs the composite index (applicantId ASC, createdAt DESC) from
  // firestore.indexes.json; without it every call is rejected outright.
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

function toApplication(id: string, data: Record<string, unknown>): TenantApplication {
  const created = data.createdAt as { toDate?: () => Date } | undefined;
  return {
    ...(data as TenantApplicationInput),
    id,
    reference: applicationReference(id),
    status: (data.status as TenantApplicationStatus) ?? "submitted",
    createdAt: created?.toDate?.().toISOString(),
  };
}

/**
 * Applications on the listings this account owns, newest first: the letting
 * agent's or private landlord's queue. Sorted here rather than in the query,
 * so it needs no composite index.
 */
export async function getApplicationsForOwner(ownerId: string): Promise<TenantApplication[]> {
  if (!isFirebaseConfigured || !db) return [];
  const snapshot = await getDocs(query(collection(db, "applications"), where("ownerId", "==", ownerId)));
  return snapshot.docs
    .map((item) => toApplication(item.id, item.data()))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

/** Where the listing's owner may move an application (firestore.rules allows only these). */
export const OWNER_APPLICATION_STATUSES = ["submitted", "vetting", "approved", "declined"] as const;
export type OwnerApplicationStatus = (typeof OWNER_APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABEL: Record<TenantApplicationStatus, string> = {
  submitted: "New",
  vetting: "Checking",
  approved: "Approved",
  declined: "Declined",
  withdrawn: "Withdrawn",
};

/** The listing's owner moves an application through review. Nothing else on it changes. */
export async function setApplicationStatus(applicationId: string, status: OwnerApplicationStatus): Promise<void> {
  if (!isFirebaseConfigured || !db) throw new Error("This environment is not connected to Firebase.");
  await updateDoc(doc(db, "applications", applicationId), { status, updatedAt: serverTimestamp() });
}
