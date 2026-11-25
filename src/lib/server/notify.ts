import { FieldValue } from "firebase-admin/firestore";

import { AdminUnavailableError, adminApp, adminAuth, adminDb } from "./firebase-admin";
import { optOutLink } from "./email-prefs";
import { sendMail, type MailResult } from "./mail";
import { agencyInviteEmail, enquiryEmail } from "./mail-templates";

/**
 * Notifications that follow a user's own write. The browser saves the record
 * (enquiry, invitation) under firestore.rules as before, then asks the server
 * to e-mail about it. The server re-reads the record, checks the caller is the
 * one who wrote it, and claims it in a transaction so each record is e-mailed
 * at most once however often the request is repeated.
 */

export class NotifyError extends Error {
  constructor(
    message: string,
    public status: 400 | 401 | 403 | 404 | 503,
  ) {
    super(message);
  }
}

export async function signedInCaller(request: Request): Promise<{ uid: string; email: string | null }> {
  if (!adminApp()) throw new NotifyError("The server isn't connected to Firebase.", 503);
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new NotifyError("Sign in first.", 401);
  try {
    // checkRevoked: a disabled account, or one an admin signed out, stops
    // sending e-mails at once, not when its hour-long ID token expires
    // (audit finding S9). Same check as the console and admin routes.
    const decoded = await adminAuth().verifyIdToken(token, true);
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch (error) {
    if (error instanceof AdminUnavailableError) throw new NotifyError("The server isn't connected to Firebase.", 503);
    throw new NotifyError("Your session has expired. Sign in again.", 401);
  }
}

type Outcome = { status: MailResult["status"] | "already" | "no_recipient" };

/**
 * Claims the record for notifying. Returns its data, or null when it was
 * already claimed. `check` throws when the caller may not notify about it.
 */
async function claim(path: string, field: string, check: (data: FirebaseFirestore.DocumentData) => void) {
  const ref = adminDb().doc(path);
  return adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new NotifyError("Not found.", 404);
    const data = snap.data()!;
    check(data);
    if (data[field]) return null;
    tx.update(ref, { [field]: { claimedAt: FieldValue.serverTimestamp(), status: "sending" } });
    return data;
  });
}

async function record(path: string, field: string, status: string, detail?: string) {
  await adminDb()
    .doc(path)
    .update({ [field]: { claimedAt: FieldValue.serverTimestamp(), status, ...(detail ? { detail: detail.slice(0, 300) } : {}) } })
    .catch((error) => console.error("[notify] could not record the outcome:", error));
}

/** E-mails a listing's owner about a new enquiry, sent by the caller. */
export async function notifyEnquiry(caller: { uid: string; email: string | null }, inquiryId: string): Promise<Outcome> {
  const path = `inquiries/${inquiryId}`;
  const data = await claim(path, "ownerNotify", (d) => {
    if (d.userId !== caller.uid) throw new NotifyError("Only the buyer who sent this enquiry can do this.", 403);
  });
  if (!data) return { status: "already" };

  const ownerId = typeof data.ownerId === "string" ? data.ownerId : "";
  if (!ownerId) {
    await record(path, "ownerNotify", "no_recipient", "The listing has no owner (sample listing or agent profile).");
    return { status: "no_recipient" };
  }
  const owner = await adminAuth().getUser(ownerId).catch(() => null);
  if (!owner?.email || owner.disabled) {
    await record(path, "ownerNotify", "no_recipient", "The owner has no e-mail address or is disabled.");
    return { status: "no_recipient" };
  }
  // The title comes from the listing itself, not from the buyer's copy of it.
  const listingId = String(data.propertyId ?? "");
  const listing = listingId ? (await adminDb().doc(`properties/${listingId}`).get()).data() : undefined;
  const role = owner.customClaims?.role;
  const inboxPath = role === "agent" || role === "admin" ? "/agent/enquiries" : "/seller/portal";

  const mail = enquiryEmail({
    listingTitle: String(listing?.title ?? data.propertyTitle ?? ""),
    listingId,
    kind: String(data.kind ?? "message"),
    buyerName: String(data.contactName ?? ""),
    // The verified address on the buyer's session, not a field they typed.
    buyerEmail: caller.email,
    buyerPhone: String(data.contactPhone ?? ""),
    notes: String(data.notes ?? ""),
    inboxPath,
    optOut: optOutLink(ownerId, "enquiryEmails"),
  });
  const result = await sendMail({
    kind: "enquiry",
    // The owner may have turned these off (/alerts, or the link in the e-mail).
    optOut: { uid: ownerId, pref: "enquiryEmails" },
    to: { email: owner.email, name: owner.displayName ?? undefined },
    replyTo: caller.email ? { email: caller.email, name: String(data.contactName ?? "") || undefined } : undefined,
    ref: `inquiries/${inquiryId}`,
    ...mail,
  });
  await record(path, "ownerNotify", result.status, result.status === "skipped" ? result.reason : result.status === "failed" ? result.error : undefined);
  return { status: result.status };
}

/** E-mails the agent a principal (the caller) just invited. */
export async function notifyAgencyInvite(caller: { uid: string }, inviteId: string): Promise<Outcome> {
  if (!inviteId.startsWith(`${caller.uid}_`)) throw new NotifyError("Only the agency that sent this invitation can do this.", 403);
  const path = `agency_invites/${inviteId}`;
  const data = await claim(path, "notified", (d) => {
    if (d.principalUid !== caller.uid) throw new NotifyError("Only the agency that sent this invitation can do this.", 403);
  });
  if (!data) return { status: "already" };
  const email = typeof data.email === "string" ? data.email : "";
  if (!email) {
    await record(path, "notified", "no_recipient");
    return { status: "no_recipient" };
  }
  const principal = await adminAuth().getUser(caller.uid).catch(() => null);
  const mail = agencyInviteEmail({ agencyName: String(data.agencyName ?? ""), principalName: principal?.displayName ?? null });
  const result = await sendMail({
    kind: "agency_invite",
    to: { email },
    replyTo: principal?.email ? { email: principal.email, name: principal.displayName ?? undefined } : undefined,
    ref: path,
    ...mail,
  });
  await record(path, "notified", result.status, result.status === "skipped" ? result.reason : result.status === "failed" ? result.error : undefined);
  return { status: result.status };
}
