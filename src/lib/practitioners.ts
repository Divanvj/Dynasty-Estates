import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";

import { db, isFirebaseConfigured } from "./firebase";
import { PRACTITIONER_STATUSES, type Practitioner, type PractitionerInput, type PractitionerStatus } from "./practitioner-compliance";

export * from "./practitioner-compliance";

/**
 * Practitioner compliance (docs/dashboards/PLAN.md, F3, Phase F).
 *
 * One document per account at `practitioners/{uid}`, filed by the practitioner
 * and decided by an admin. It is its own collection, not a map on
 * `users/{uid}`, because the account owner may write anything on their user
 * document; here firestore.rules lets the owner write only their own details,
 * and only as a fresh "pending" application. The decision fields (verifiedAt,
 * verifiedBy, decisionNote) and the move to "verified" or "rejected" are made
 * by /api/admin/practitioners with the Admin SDK, which also grants the agent
 * role and files an audit-trail entry.
 *
 * Dates are calendar days ("YYYY-MM-DD"), read in South African time.
 */

function toDate(value: unknown): Date | null {
  const maybe = value as { toDate?: () => Date } | null;
  return maybe?.toDate ? maybe.toDate() : null;
}

function fromData(uid: string, data: Record<string, unknown>): Practitioner {
  const status = PRACTITIONER_STATUSES.includes(data.status as PractitionerStatus) ? (data.status as PractitionerStatus) : "pending";
  return {
    uid,
    fullName: String(data.fullName ?? ""),
    email: typeof data.email === "string" ? data.email : null,
    phone: String(data.phone ?? ""),
    ffcNumber: String(data.ffcNumber ?? ""),
    ffcExpiry: String(data.ffcExpiry ?? ""),
    agencyName: String(data.agencyName ?? ""),
    status,
    submittedAt: toDate(data.submittedAt),
    verifiedAt: toDate(data.verifiedAt),
    decisionNote: String(data.decisionNote ?? ""),
  };
}

export async function getPractitioner(uid: string): Promise<Practitioner | null> {
  if (!isFirebaseConfigured || !db) return null;
  const snap = await getDoc(doc(db, "practitioners", uid));
  return snap.exists() ? fromData(uid, snap.data()) : null;
}

/** Admins only (the rule denies anyone else a list). Newest first. */
export async function listPractitioners(): Promise<Practitioner[]> {
  if (!isFirebaseConfigured || !db) return [];
  const snap = await getDocs(collection(db, "practitioners"));
  return snap.docs
    .map((item) => fromData(item.id, item.data()))
    .sort((a, b) => (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0));
}

/**
 * Files or re-files the account's details. Every save goes back to "pending":
 * a changed FFC number or expiry has to be checked again before it counts.
 * The decision fields are left untouched (the rule forbids the owner to write
 * them), so a previous decision note stays readable until the next decision.
 */
export async function submitPractitioner(uid: string, email: string | null, input: PractitionerInput): Promise<void> {
  if (!isFirebaseConfigured || !db) throw new Error("Firebase database is not configured.");
  await setDoc(
    doc(db, "practitioners", uid),
    {
      fullName: input.fullName.trim(),
      email,
      phone: input.phone.trim(),
      ffcNumber: input.ffcNumber.trim().toUpperCase(),
      ffcExpiry: input.ffcExpiry,
      agencyName: input.agencyName.trim(),
      status: "pending",
      submittedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
