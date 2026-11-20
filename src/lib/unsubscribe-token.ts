import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * The signed token behind every "stop these e-mails" link, and behind
 * "Stop alerts for this search" (S1-11).
 *
 * `uid.target.signature`, where target is either a preference key
 * (`savedSearchAlerts`) or `search-<id>` for one saved search. The link works
 * without signing in, so the signature is what stops it being used to turn off
 * someone else's e-mails: it only ever does that one thing for that one
 * person, and an edited uid or target no longer verifies.
 *
 * What a target *means* is lib/server/email-prefs.ts's business; this file
 * only signs and checks the shape, and imports nothing, so plain Node can test
 * it. The secret is passed in (MAIL_LINK_SECRET, or CRON_SECRET when that is
 * not set). Preference tokens are signed exactly as they were before
 * per-search links existed, so links already in people's inboxes keep working.
 */

export type UnsubscribeToken = { uid: string; target: string };

const SEARCH_PREFIX = "search-";
const UID = /^[A-Za-z0-9]{1,128}$/;
/** Covers both a preference key and `search-<firestore id>`. */
const TARGET = /^[A-Za-z0-9]{1,40}$|^search-[A-Za-z0-9]{1,64}$/;
const MIN_KEY_LENGTH = 16;

export function searchTarget(searchId: string): string {
  return `${SEARCH_PREFIX}${searchId}`;
}

/** The search id in a target, or null when it is a preference key. */
export function searchIdFromTarget(target: string): string | null {
  return target.startsWith(SEARCH_PREFIX) ? target.slice(SEARCH_PREFIX.length) : null;
}

function signature(uid: string, target: string, key: string): string {
  return createHmac("sha256", key).update(`unsubscribe:${uid}:${target}`).digest("base64url").slice(0, 32);
}

/** null when the key is missing or too short, or the parts are not usable. */
export function buildUnsubscribeToken(uid: string, target: string, key: string): string | null {
  if (key.length < MIN_KEY_LENGTH || !UID.test(uid) || !TARGET.test(target)) return null;
  return `${uid}.${target}.${signature(uid, target, key)}`;
}

export function readUnsubscribeToken(token: string, key: string): UnsubscribeToken | null {
  if (key.length < MIN_KEY_LENGTH) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [uid, target, sig] = parts;
  if (!UID.test(uid) || !TARGET.test(target) || !sig) return null;
  const expected = Buffer.from(signature(uid, target, key));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given) ? { uid, target } : null;
}
