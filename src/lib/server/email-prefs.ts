// Server code only (audit item 3.2): importing this from a Client Component
// fails the build, so nothing here (keys, Admin SDK) can reach the browser.
import "server-only";

import { DEFAULT_EMAIL_PREFS, EMAIL_PREFS, isEmailPref, normaliseEmailPrefs, type EmailPref, type EmailPrefs } from "@/lib/email-prefs";
import { SITE_URL } from "@/lib/site-url";
import { buildUnsubscribeToken, readUnsubscribeToken, searchIdFromTarget, searchTarget } from "@/lib/unsubscribe-token";

import { adminApp, adminDb } from "./firebase-admin";

/**
 * Per-person e-mail preferences (`email_prefs/{uid}`, server only) and the
 * signed "stop these e-mails" links. A link works without signing in, so it is
 * an HMAC of the uid and what it turns off (lib/unsubscribe-token.ts): it can
 * stop that one kind of e-mail, or that one saved search, for that one person
 * and nothing else.
 *
 * The signing secret is MAIL_LINK_SECRET, or CRON_SECRET when that is not set
 * (both are server-only and already in Vercel). Without either, e-mails go out
 * without the link and the preference can still be changed on /alerts.
 */

export const EMAIL_PREFS_COLLECTION = "email_prefs";

export async function readEmailPrefs(uid: string): Promise<EmailPrefs> {
  if (!adminApp()) return { ...DEFAULT_EMAIL_PREFS };
  const snap = await adminDb().collection(EMAIL_PREFS_COLLECTION).doc(uid).get();
  return normaliseEmailPrefs(snap.data());
}

export async function writeEmailPrefs(uid: string, changes: Partial<EmailPrefs>, via: "settings" | "link"): Promise<EmailPrefs> {
  const clean: Partial<EmailPrefs> = {};
  for (const [key, value] of Object.entries(changes)) {
    if (isEmailPref(key) && typeof value === "boolean") clean[key] = value;
  }
  await adminDb()
    .collection(EMAIL_PREFS_COLLECTION)
    .doc(uid)
    .set({ ...clean, updatedAt: new Date().toISOString(), updatedVia: via }, { merge: true });
  return readEmailPrefs(uid);
}

function secret(): string {
  const value = (process.env.MAIL_LINK_SECRET || process.env.CRON_SECRET || "").trim();
  return value.length >= 16 ? value : "";
}

/** The token in a "stop these e-mails" link, or null when no secret is set. */
export function unsubscribeToken(uid: string, pref: EmailPref): string | null {
  return buildUnsubscribeToken(uid, pref, secret());
}

/** The token behind "Stop alerts for this search" (S1-11). */
export function searchStopToken(uid: string, searchId: string): string | null {
  return buildUnsubscribeToken(uid, searchTarget(searchId), secret());
}

/**
 * The page that link opens. It asks before stopping anything, as the
 * preference link does: mail scanners follow links.
 */
export function searchStopPageUrl(uid: string, searchId: string): string | null {
  const token = searchStopToken(uid, searchId);
  return token ? `${SITE_URL}/email/unsubscribe?t=${encodeURIComponent(token)}` : null;
}

/** The page the footer link opens (it asks before turning anything off). */
export function unsubscribePageUrl(uid: string, pref: EmailPref): string | null {
  const token = unsubscribeToken(uid, pref);
  return token ? `${SITE_URL}/email/unsubscribe?t=${encodeURIComponent(token)}` : null;
}

/** For the List-Unsubscribe header: mail apps POST here for one-click unsubscribe (RFC 8058). */
export function oneClickUnsubscribeUrl(uid: string, pref: EmailPref): string | null {
  const token = unsubscribeToken(uid, pref);
  return token ? `${SITE_URL}/api/email/unsubscribe?t=${encodeURIComponent(token)}` : null;
}

export type UnsubscribeTarget = { uid: string; pref: EmailPref } | { uid: string; searchId: string };

/** What a valid link is allowed to turn off: one preference, or one saved search. */
export function verifyUnsubscribeToken(token: string): UnsubscribeTarget | null {
  const read = readUnsubscribeToken(token, secret());
  if (!read) return null;
  if (isEmailPref(read.target)) return { uid: read.uid, pref: read.target };
  const searchId = searchIdFromTarget(read.target);
  return searchId ? { uid: read.uid, searchId } : null;
}

/** The footer link for an e-mail of this kind (see mail-templates OptOutLink). */
export function optOutLink(uid: string, pref: EmailPref): { url: string | null; what: string } {
  return { url: unsubscribePageUrl(uid, pref), what: `“${EMAIL_PREFS[pref].label}”` };
}
