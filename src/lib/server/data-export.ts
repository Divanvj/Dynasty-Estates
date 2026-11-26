import "server-only";

import { adminAuth, adminDb } from "./firebase-admin";

/**
 * "Download my data" (audit item 2.5; POPIA section 23, a person's right to a
 * copy of the personal information held about them). Everything Dynasty
 * Estates holds that the account holder gave it, read with the Admin SDK for
 * one account at a time.
 *
 * Deliberately left out: enquiries and tenancy applications that OTHER people
 * sent to this account's listings. Those are the senders' personal details;
 * they get them in their own export.
 */

type Row = Record<string, unknown> & { id: string };

/** Firestore values to plain JSON: timestamps as ISO strings, references as paths. */
function plain(value: unknown): unknown {
  if (value === null || value === undefined) return value ?? null;
  if (Array.isArray(value)) return value.map(plain);
  if (typeof value === "object") {
    const v = value as { toDate?: () => Date; path?: unknown; latitude?: unknown; longitude?: unknown };
    if (typeof v.toDate === "function") return v.toDate().toISOString();
    if (typeof v.path === "string" && "firestore" in (value as object)) return v.path;
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, inner]) => [k, plain(inner)]));
  }
  return value;
}

async function where(collection: string, field: string, uid: string): Promise<Row[]> {
  const snap = await adminDb().collection(collection).where(field, "==", uid).limit(1000).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...(plain(doc.data()) as Record<string, unknown>) }));
}

async function one(path: string): Promise<Row | null> {
  const snap = await adminDb().doc(path).get();
  return snap.exists ? { id: snap.id, ...(plain(snap.data()) as Record<string, unknown>) } : null;
}

async function sub(path: string): Promise<Row[]> {
  const snap = await adminDb().collection(path).limit(1000).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...(plain(doc.data()) as Record<string, unknown>) }));
}

export type AccountExport = Awaited<ReturnType<typeof exportAccountData>>;

export async function exportAccountData(uid: string) {
  const user = await adminAuth().getUser(uid);
  const [
    profile,
    savedHomes,
    collections,
    savedSearches,
    enquiriesSent,
    tenancyApplications,
    listings,
    supportRequests,
    emailPreferences,
    agentRecord,
    agency,
    agencyMemberships,
  ] = await Promise.all([
    one(`users/${uid}`),
    sub(`users/${uid}/savedProperties`),
    where("collections", "ownerId", uid),
    where("saved_searches", "userId", uid),
    where("inquiries", "userId", uid),
    where("applications", "applicantId", uid),
    where("properties", "ownerId", uid),
    where("support_requests", "userId", uid),
    one(`email_prefs/${uid}`),
    one(`practitioners/${uid}`),
    one(`agencies/${uid}`),
    where("agency_members", "memberUid", uid),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    about:
      "Everything Dynasty Estates holds that you gave it, as at the time above. Enquiries and applications that other people sent about your listings are not included: those are their own details. Questions: info@dynastyestates.co.za.",
    account: {
      uid,
      email: user.email ?? null,
      emailVerified: user.emailVerified,
      displayName: user.displayName ?? null,
      phoneNumber: user.phoneNumber ?? null,
      createdAt: user.metadata.creationTime ?? null,
      lastSignInAt: user.metadata.lastSignInTime ?? null,
      signInMethods: user.providerData.map((p) => p.providerId),
    },
    profile,
    savedHomes,
    collections,
    savedSearches,
    enquiriesSent,
    tenancyApplications,
    listings,
    supportRequests,
    emailPreferences,
    agentRecord,
    agency,
    agencyMemberships,
  };
}
