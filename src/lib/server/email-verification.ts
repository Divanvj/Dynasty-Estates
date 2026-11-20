import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { UserRecord } from "firebase-admin/auth";

import { adminAuth, adminDb } from "./firebase-admin";
import { sendMail, type MailResult } from "./mail";
import { verifyEmailEmail } from "./mail-templates";
import { SITE_URL } from "@/lib/site-url";

/**
 * E-mail address verification (S1-6). Server-only.
 *
 * The link is Firebase's own verification link (generated with the Admin SDK),
 * sent through our mail provider in a Dynasty e-mail rather than Firebase's
 * generic one, so it is logged in mail_log like every other e-mail. Clicking
 * it marks the account verified on Firebase's action page, which then returns
 * the person to /auth/verified.
 *
 * `email_verification/{uid}` (server-only, no client rule) records when we
 * last sent one, so a resend button or a repeated sign-up request cannot be
 * used to flood an inbox, and so the nightly reminder goes out once.
 */

export const VERIFICATION_COLLECTION = "email_verification";
/** Shortest gap between two e-mails to the same account. */
const RESEND_GAP_MS = 60_000;
/** Most e-mails to one account in a day (sign-up + resends). */
const DAILY_LIMIT = 5;
/** The reminder goes to accounts this many days old that still haven't verified. */
export const REMINDER_AFTER_DAYS = 3;
/** Older accounts are left alone: no reminder for an account from months ago. */
const REMINDER_MAX_AGE_DAYS = 30;

export type VerificationReason = "signup" | "resend" | "reminder";
export type VerificationOutcome =
  | { status: MailResult["status"] }
  | { status: "already_verified" | "no_email" | "too_soon" | "daily_limit" | "not_password_account" | "undeliverable" | "developer" };

/** Only e-mail-and-password accounts need this; Google accounts arrive verified. */
function needsVerification(user: UserRecord): boolean {
  return Boolean(user.email) && !user.emailVerified && user.providerData.some((p) => p.providerId === "password");
}

/**
 * Reserved test domains (RFC 2606/6761) never receive mail. Sending there only
 * bounces, which counts against the sender with the mail provider. The
 * developer test logins use .test addresses.
 */
export function isUndeliverable(email: string): boolean {
  return /.(test|example|invalid|localhost)$/i.test(email.trim());
}

/** Developer test accounts (custom claim) are left alone, as the banner does. */
function isDeveloper(user: UserRecord): boolean {
  return user.customClaims?.developer === true || user.customClaims?.role === "developer";
}

async function verificationLink(email: string): Promise<string> {
  try {
    return await adminAuth().generateEmailVerificationLink(email, { url: `${SITE_URL}/auth/verified` });
  } catch (error) {
    // Firebase only returns to an authorised domain; locally SITE_URL is
    // localhost, which it refuses. The link still verifies the address, it
    // just ends on Firebase's own confirmation page.
    console.warn("[verify-email] link with return page refused, sending without it:", error);
    return adminAuth().generateEmailVerificationLink(email);
  }
}

export async function sendVerificationEmail(uid: string, reason: VerificationReason): Promise<VerificationOutcome> {
  const user = await adminAuth().getUser(uid);
  if (!user.email) return { status: "no_email" };
  if (user.emailVerified) return { status: "already_verified" };
  if (!needsVerification(user)) return { status: "not_password_account" };
  if (isUndeliverable(user.email)) return { status: "undeliverable" };
  if (isDeveloper(user)) return { status: "developer" };

  const ref = adminDb().collection(VERIFICATION_COLLECTION).doc(uid);
  const today = new Date().toISOString().slice(0, 10);
  // Claim the send in a transaction, so two requests at once send one e-mail.
  const allowed = await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() ?? {};
    const last = data.lastSentAt instanceof Timestamp ? data.lastSentAt.toMillis() : 0;
    if (reason !== "reminder" && Date.now() - last < RESEND_GAP_MS) return "too_soon" as const;
    const sentToday = data.day === today ? Number(data.sentToday ?? 0) : 0;
    if (sentToday >= DAILY_LIMIT) return "daily_limit" as const;
    tx.set(
      ref,
      {
        uid,
        email: user.email,
        lastSentAt: FieldValue.serverTimestamp(),
        day: today,
        sentToday: sentToday + 1,
        sent: FieldValue.increment(1),
        ...(reason === "reminder" ? { remindedAt: FieldValue.serverTimestamp() } : {}),
      },
      { merge: true },
    );
    return "ok" as const;
  });
  if (allowed !== "ok") return { status: allowed };

  const link = await verificationLink(user.email);
  const mail = verifyEmailEmail({ name: user.displayName ?? null, link, reminder: reason === "reminder" });
  const result = await sendMail({ kind: "verify_email", to: { email: user.email, name: user.displayName ?? undefined }, ref: `auth/${uid}`, ...mail });
  await ref.set({ lastResult: result.status }, { merge: true }).catch(() => undefined);
  return { status: result.status };
}

/**
 * Nightly: one reminder to e-mail-and-password accounts that are
 * REMINDER_AFTER_DAYS old or more (up to 30 days) and still unverified.
 */
export async function runVerificationReminders(options: { maxEmails: number }) {
  const now = Date.now();
  const candidates: UserRecord[] = [];
  let pageToken: string | undefined;
  do {
    const page = await adminAuth().listUsers(1000, pageToken);
    for (const user of page.users) {
      const age = (now - Date.parse(user.metadata.creationTime)) / 86_400_000;
      if (
        !user.disabled &&
        needsVerification(user) &&
        !isUndeliverable(user.email ?? "") &&
        !isDeveloper(user) &&
        age >= REMINDER_AFTER_DAYS &&
        age <= REMINDER_MAX_AGE_DAYS
      )
        candidates.push(user);
    }
    pageToken = page.pageToken;
  } while (pageToken);

  const result = { candidates: candidates.length, emailed: 0, skipped: 0, failed: 0, more: false };
  for (const user of candidates) {
    if (result.emailed + result.failed >= options.maxEmails) {
      result.more = true;
      break;
    }
    const done = await adminDb().collection(VERIFICATION_COLLECTION).doc(user.uid).get();
    if (done.data()?.remindedAt) {
      result.skipped++;
      continue;
    }
    const outcome = await sendVerificationEmail(user.uid, "reminder");
    if (outcome.status === "sent") result.emailed++;
    else if (outcome.status === "failed") result.failed++;
    else result.skipped++;
  }
  return result;
}
