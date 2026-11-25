// Server code only (audit item 3.2): importing this from a Client Component
// fails the build, so nothing here (keys, Admin SDK) can reach the browser.
import "server-only";

import { adminAuth, adminDb } from "./firebase-admin";
import { optOutLink, searchStopPageUrl } from "./email-prefs";
import { sendMail, type MailResult } from "./mail";
import { savedSearchEmail, type AlertListing } from "./mail-templates";
import { criteriaFromParams, criteriaToParams, describeCriteria, hasNarrowingCriteria, matchesCriteria, type SearchableListing } from "@/lib/search-criteria";
import { SITE_URL } from "@/lib/site-url";
import { ACTIVE_CATALOGUE_STATUSES } from "@/lib/types/domain";

/**
 * Saved searches (`saved_searches/{id}`), server only: the browser reads and
 * writes them through /api/saved-searches, which checks the ID token, so no
 * Firestore rule is needed. Each holds the search page's query string; the
 * nightly job e-mails listings published since the search was last checked.
 */

export const SAVED_SEARCHES = "saved_searches";
export const MAX_SAVED_SEARCHES = 10;
/** Homes listed per search in one e-mail; the rest are a "See N more" link. */
const PER_SEARCH = 5;

export type SavedSearch = {
  id: string;
  label: string;
  /** The canonical /search query string (no view or sort). */
  query: string;
  alerts: boolean;
  createdAt: string;
  lastCheckedAt: string;
  lastAlertAt: string | null;
};

function toSavedSearch(id: string, data: FirebaseFirestore.DocumentData): SavedSearch {
  return {
    id,
    label: String(data.label ?? ""),
    query: String(data.query ?? ""),
    alerts: data.alerts !== false,
    createdAt: String(data.createdAt ?? ""),
    lastCheckedAt: String(data.lastCheckedAt ?? data.createdAt ?? ""),
    lastAlertAt: typeof data.lastAlertAt === "string" ? data.lastAlertAt : null,
  };
}

export class SavedSearchError extends Error {
  constructor(
    message: string,
    public status: 400 | 403 | 404 | 409,
  ) {
    super(message);
  }
}

export async function listSavedSearches(uid: string): Promise<SavedSearch[]> {
  const snap = await adminDb().collection(SAVED_SEARCHES).where("userId", "==", uid).get();
  return snap.docs.map((d) => toSavedSearch(d.id, d.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Saves the search in `query` (a /search query string) for the caller. */
export async function createSavedSearch(uid: string, query: string): Promise<SavedSearch> {
  const criteria = criteriaFromParams(new URLSearchParams(query.slice(0, 2000)));
  if (!hasNarrowingCriteria(criteria)) throw new SavedSearchError("Choose an area, a price or another filter first, so the alerts are about homes you want.", 400);
  const canonical = criteriaToParams(criteria).toString();
  const existing = await listSavedSearches(uid);
  const same = existing.find((s) => s.query === canonical);
  if (same) return same;
  if (existing.length >= MAX_SAVED_SEARCHES) throw new SavedSearchError(`You can save up to ${MAX_SAVED_SEARCHES} searches. Delete one on Alerts first.`, 409);
  const now = new Date().toISOString();
  const data = { userId: uid, label: describeCriteria(criteria), query: canonical, alerts: true, createdAt: now, lastCheckedAt: now, lastAlertAt: null };
  const ref = await adminDb().collection(SAVED_SEARCHES).add(data);
  return toSavedSearch(ref.id, data);
}

async function ownRef(uid: string, id: string) {
  if (!/^[A-Za-z0-9]{1,64}$/.test(id)) throw new SavedSearchError("Not found.", 404);
  const ref = adminDb().collection(SAVED_SEARCHES).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new SavedSearchError("Not found.", 404);
  if (snap.data()!.userId !== uid) throw new SavedSearchError("This saved search belongs to another account.", 403);
  return ref;
}

export async function setSavedSearchAlerts(uid: string, id: string, alerts: boolean): Promise<void> {
  const ref = await ownRef(uid, id);
  // Turning alerts back on starts from now, not with a backlog.
  await ref.update(alerts ? { alerts, lastCheckedAt: new Date().toISOString() } : { alerts });
}

/**
 * S1-11 — "Stop alerts for this search", from the link in the e-mail. The
 * search is not deleted: it stays on /alerts with its switch off, so turning
 * it back on is one tap and nothing the person saved is thrown away.
 * Returns the search's label, for the page to say what it stopped.
 */
export async function stopSavedSearchAlerts(uid: string, id: string): Promise<string> {
  const ref = await ownRef(uid, id);
  await ref.update({ alerts: false });
  return String((await ref.get()).data()?.label ?? "this search");
}

export async function deleteSavedSearch(uid: string, id: string): Promise<void> {
  await (await ownRef(uid, id)).delete();
}

type CatalogueListing = SearchableListing & AlertListing & { publishedAt: string };

function toIso(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === "string" ? value : "";
}

/** Live listings published after `since`, in the shape the filters read. */
async function listingsPublishedSince(since: string): Promise<CatalogueListing[]> {
  const snap = await adminDb()
    .collection("properties")
    .where("status", "in", [...ACTIVE_CATALOGUE_STATUSES])
    .get();
  const out: CatalogueListing[] = [];
  for (const d of snap.docs) {
    const data = d.data();
    const publishedAt = toIso(data.publishedAt);
    if (!publishedAt || publishedAt <= since) continue;
    out.push({
      title: String(data.title ?? "Untitled property"),
      slug: String(data.slug ?? d.id),
      price: String(data.price ?? "Price on request"),
      location: String(data.location ?? ""),
      description: String(data.description ?? ""),
      suburb: String(data.suburb ?? ""),
      city: String(data.city ?? ""),
      province: String(data.province ?? ""),
      features: Array.isArray(data.features) ? data.features.map(String) : [],
      type: String(data.type ?? "House"),
      listingType: String(data.listingType ?? "sale"),
      beds: Number(data.beds ?? 0),
      baths: Number(data.baths ?? 0),
      parking: Number(data.parking ?? 0),
      furnishedStatus: typeof data.furnishedStatus === "string" ? data.furnishedStatus : undefined,
      numericPrice: Number(String(data.price ?? "0").replace(/[^0-9.]/g, "")) || 0,
      publishedAt,
    });
  }
  return out.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export type AlertRun = { searches: number; people: number; emailed: number; skipped: number; failed: number; more: boolean };

/**
 * E-mails each person the live listings published since their searches were
 * last checked: one e-mail per person, grouped by search. Every search with
 * alerts on is marked checked whatever happened, so nobody gets a backlog
 * after a switch was off. `onlyUid` limits the run to one account (the
 * console's "send mine now").
 */
export async function runSavedSearchAlerts(options: { onlyUid?: string; maxEmails?: number } = {}): Promise<AlertRun> {
  const maxEmails = options.maxEmails ?? 150;
  const runAt = new Date().toISOString();
  let query: FirebaseFirestore.Query = adminDb().collection(SAVED_SEARCHES).where("alerts", "==", true);
  if (options.onlyUid) query = query.where("userId", "==", options.onlyUid);
  const snap = await query.get();
  const run: AlertRun = { searches: snap.size, people: 0, emailed: 0, skipped: 0, failed: 0, more: false };
  if (snap.empty) return run;

  const searches = snap.docs.map((d) => ({ ref: d.ref, userId: String(d.data().userId ?? ""), ...toSavedSearch(d.id, d.data()) }));
  const oldest = searches.reduce((min, s) => (s.lastCheckedAt && s.lastCheckedAt < min ? s.lastCheckedAt : min), runAt);
  const fresh = await listingsPublishedSince(oldest);

  const byUser = new Map<string, typeof searches>();
  for (const s of searches) {
    if (!s.userId) continue;
    byUser.set(s.userId, [...(byUser.get(s.userId) ?? []), s]);
  }
  run.people = byUser.size;

  for (const [uid, own] of byUser) {
    const blocks = own
      .map((s) => {
        const criteria = criteriaFromParams(new URLSearchParams(s.query));
        const matches = fresh.filter((l) => l.publishedAt > s.lastCheckedAt && matchesCriteria(l, criteria));
        return {
          search: s,
          label: s.label,
          url: `${SITE_URL}/search?${s.query}`,
          listings: matches.slice(0, PER_SEARCH),
          more: Math.max(0, matches.length - PER_SEARCH),
          // S1-11: stops this search only; the footer link still stops them all.
          stopUrl: searchStopPageUrl(uid, s.id),
        };
      })
      .filter((b) => b.listings.length > 0);

    let sent = false;
    if (blocks.length) {
      if (run.emailed + run.failed >= maxEmails) {
        // Left unchecked, so tomorrow's run picks them up.
        run.more = true;
        continue;
      }
      const user = await adminAuth().getUser(uid).catch(() => null);
      let result: MailResult = { status: "skipped", reason: "The account has no e-mail address or is disabled." };
      if (user?.email && !user.disabled) {
        const mail = savedSearchEmail({ searches: blocks, optOut: optOutLink(uid, "savedSearchAlerts") });
        result = await sendMail({
          kind: "saved_search",
          optOut: { uid, pref: "savedSearchAlerts" },
          to: { email: user.email, name: user.displayName ?? undefined },
          ref: `saved_searches/${blocks.map((b) => b.search.id).join(",")}`.slice(0, 300),
          ...mail,
        });
      }
      sent = result.status === "sent";
      if (sent) run.emailed += 1;
      else if (result.status === "failed") run.failed += 1;
      else run.skipped += 1;
      if (result.status === "failed") continue; // Try again tomorrow.
    }
    const batch = adminDb().batch();
    for (const s of own) {
      const alerted = sent && blocks.some((b) => b.search.id === s.id);
      batch.update(s.ref, { lastCheckedAt: runAt, ...(alerted ? { lastAlertAt: runAt } : {}) });
    }
    await batch.commit();
  }
  return run;
}
