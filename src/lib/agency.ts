import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { db, isFirebaseConfigured } from "./firebase";

/**
 * Agencies (docs/dashboards/PLAN.md, F4, Phase G).
 *
 *   agencies/{principalUid}                       name, ppraFirmNumber, principalUid, createdAt
 *   agency_invites/{principalUid}_{email}         principalUid, agencyName, email (lower case), invitedAt
 *   agency_members/{principalUid}_{memberUid}     principalUid, memberUid, name, email, joinedAt
 *
 * One agency per principal, keyed by the principal's uid. Only an agent whose
 * FFC an admin verified may register one (firestore.rules). The principal
 * reads members' enquiries and stats through the membership link, so nothing
 * is copied onto listings or enquiries: when an agent leaves, access ends.
 * No e-mail is sent for an invite yet; the agent sees it in their account.
 */

export type Agency = { principalUid: string; name: string; ppraFirmNumber: string; createdAt: Date | null };
export type AgencyInvite = { id: string; principalUid: string; agencyName: string; email: string; invitedAt: Date | null };
export type AgencyMember = { id: string; principalUid: string; memberUid: string; name: string; email: string; joinedAt: Date | null };

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toDate(value: unknown): Date | null {
  const maybe = value as { toDate?: () => Date } | null;
  return maybe?.toDate ? maybe.toDate() : null;
}

function requireDb() {
  if (!isFirebaseConfigured || !db) throw new Error("Firebase database is not configured.");
  return db;
}

/** The agency this account is the principal of, or null. */
export async function getOwnAgency(uid: string): Promise<Agency | null> {
  if (!isFirebaseConfigured || !db) return null;
  const snap = await getDoc(doc(db, "agencies", uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return { principalUid: uid, name: String(d.name ?? ""), ppraFirmNumber: String(d.ppraFirmNumber ?? ""), createdAt: toDate(d.createdAt) };
}

export async function registerAgency(uid: string, name: string, ppraFirmNumber: string): Promise<void> {
  await setDoc(doc(requireDb(), "agencies", uid), {
    name: name.trim(),
    ppraFirmNumber: ppraFirmNumber.trim().toUpperCase(),
    principalUid: uid,
    createdAt: serverTimestamp(),
  });
}

export async function updateAgency(uid: string, name: string, ppraFirmNumber: string): Promise<void> {
  await updateDoc(doc(requireDb(), "agencies", uid), { name: name.trim(), ppraFirmNumber: ppraFirmNumber.trim().toUpperCase() });
}

function memberFrom(id: string, d: Record<string, unknown>): AgencyMember {
  return {
    id,
    principalUid: String(d.principalUid ?? ""),
    memberUid: String(d.memberUid ?? ""),
    name: String(d.name ?? ""),
    email: String(d.email ?? ""),
    joinedAt: toDate(d.joinedAt),
  };
}

function inviteFrom(id: string, d: Record<string, unknown>): AgencyInvite {
  return {
    id,
    principalUid: String(d.principalUid ?? ""),
    agencyName: String(d.agencyName ?? ""),
    email: String(d.email ?? ""),
    invitedAt: toDate(d.invitedAt),
  };
}

/** The principal's agents, longest-serving first. */
export async function getMembers(principalUid: string): Promise<AgencyMember[]> {
  if (!isFirebaseConfigured || !db) return [];
  const snap = await getDocs(query(collection(db, "agency_members"), where("principalUid", "==", principalUid)));
  return snap.docs
    .map((d) => memberFrom(d.id, d.data()))
    .sort((a, b) => (a.joinedAt?.getTime() ?? 0) - (b.joinedAt?.getTime() ?? 0));
}

/** Agencies this account has joined as an agent (normally none or one). */
export async function getMemberships(uid: string): Promise<{ member: AgencyMember; agency: Agency | null }[]> {
  if (!isFirebaseConfigured || !db) return [];
  const snap = await getDocs(query(collection(db, "agency_members"), where("memberUid", "==", uid)));
  return Promise.all(
    snap.docs.map(async (d) => {
      const member = memberFrom(d.id, d.data());
      return { member, agency: await getOwnAgency(member.principalUid).catch(() => null) };
    }),
  );
}

export async function getSentInvites(principalUid: string): Promise<AgencyInvite[]> {
  if (!isFirebaseConfigured || !db) return [];
  const snap = await getDocs(query(collection(db, "agency_invites"), where("principalUid", "==", principalUid)));
  return snap.docs.map((d) => inviteFrom(d.id, d.data())).sort((a, b) => (b.invitedAt?.getTime() ?? 0) - (a.invitedAt?.getTime() ?? 0));
}

/** Invitations addressed to this account's e-mail. */
export async function getMyInvites(email: string | null | undefined): Promise<AgencyInvite[]> {
  if (!isFirebaseConfigured || !db || !email) return [];
  const snap = await getDocs(query(collection(db, "agency_invites"), where("email", "==", email.toLowerCase())));
  return snap.docs.map((d) => inviteFrom(d.id, d.data()));
}

export async function inviteAgent(principalUid: string, agencyName: string, email: string): Promise<void> {
  const lower = email.trim().toLowerCase();
  await setDoc(doc(requireDb(), "agency_invites", `${principalUid}_${lower}`), {
    principalUid,
    agencyName,
    email: lower,
    invitedAt: serverTimestamp(),
  });
}

export async function deleteInvite(inviteId: string): Promise<void> {
  await deleteDoc(doc(requireDb(), "agency_invites", inviteId));
}

/** Joins the agency and uses up the invitation, in one write. */
export async function acceptInvite(invite: AgencyInvite, uid: string, name: string, email: string): Promise<void> {
  const database = requireDb();
  const batch = writeBatch(database);
  batch.set(doc(database, "agency_members", `${invite.principalUid}_${uid}`), {
    principalUid: invite.principalUid,
    memberUid: uid,
    name: name.trim().slice(0, 120),
    email: email.toLowerCase(),
    joinedAt: serverTimestamp(),
  });
  batch.delete(doc(database, "agency_invites", invite.id));
  await batch.commit();
}

/** Leaving (by the agent) or removing (by the principal) is the same delete. */
export async function removeMember(principalUid: string, memberUid: string): Promise<void> {
  await deleteDoc(doc(requireDb(), "agency_members", `${principalUid}_${memberUid}`));
}
