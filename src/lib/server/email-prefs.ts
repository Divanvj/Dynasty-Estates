import { createHmac, timingSafeEqual } from "node:crypto";

import { DEFAULT_EMAIL_PREFS, EMAIL_PREFS, isEmailPref, normaliseEmailPrefs, type EmailPref, type EmailPrefs } from "@/lib/email-prefs";
import { SITE_URL } from "@/lib/site-url";

import { adminApp, adminDb } from "./firebase-admin";

/**
 * Per-person e-mail preferences (`email_prefs/{uid}`, server only) and the
 * signed "stop these e-mails" links. A link works without signing in, so it is
 * an HMAC of the uid and the preference: it can turn off that one kind of
 * e-mail for that one person and nothing else.
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

function signature(uid: string, pref: EmailPref, key: string): string {
  return createHmac("sha256", key).update(`unsubscribe:${uid}:${pref}`).digest("base64url").slice(0, 32);
}

/** The token in a "stop these e-mails" link, or null when no secret is set. */
export function unsubscribeToken(uid: string, pref: EmailPref): string | null {
  const key = secret();
  if (!key) return null;
  return `${uid}.${pref}.${signature(uid, pref, key)}`;
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

export function verifyUnsubscribeToken(token: string): { uid: string; pref: EmailPref } | null {
  const key = secret();
  const [uid, pref, sig] = token.split(".");
  if (!key || !uid || !sig || !isEmailPref(pref) || !/^[A-Za-z0-9]{1,128}$/.test(uid)) return null;
  const expected = Buffer.from(signature(uid, pref, key));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given) ? { uid, pref } : null;
}

/** The footer link for an e-mail of this kind (see mail-templates OptOutLink). */
export function optOutLink(uid: string, pref: EmailPref): { url: string | null; what: string } {
  return { url: unsubscribePageUrl(uid, pref), what: `“${EMAIL_PREFS[pref].label}”` };
}
