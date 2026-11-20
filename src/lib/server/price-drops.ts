import { adminAuth, adminDb } from "./firebase-admin";
import { optOutLink, readEmailPrefs } from "./email-prefs";
import { sendMail } from "./mail";
import { priceDropEmail, type DropListing } from "./mail-templates";
import { dropReasonLabel, materialDrop, priceNumber, type PriceDrop } from "@/lib/price-drops";
import { criteriaFromParams, matchesCriteria, type SearchableListing } from "@/lib/search-criteria";
import { ACTIVE_CATALOGUE_STATUSES } from "@/lib/types/domain";

/**
 * S1-10 — the nightly "this home came down in price" e-mail.
 *
 * Nothing on a listing records what it used to cost, and adding a price
 * history to `properties` would mean a rules change and a write on a path the
 * UI lane also edits. Instead `price_watch/{listingId}` (server-only, like
 * compliance_reminders) holds the asking price this job last saw. Tonight's
 * price against that one is the drop — which also means the first night a
 * listing is seen only records it, and an edit made and undone between two
 * runs is never noticed. Both are fine: this is a "worth another look"
 * e-mail, not an audit trail.
 *
 * Who hears about it: whoever saved the home, and whoever saved a search it
 * matches (alerts on). The listing's own owner never does — they set the
 * price. One e-mail per person covers every drop they should hear about.
 */

export const PRICE_WATCH = "price_watch";
/** Homes in one e-mail; the rest wait for the next drop. */
const PER_EMAIL = 8;

type Watched = SearchableListing & {
  id: string;
  slug: string;
  title: string;
  location: string;
  listingType: string;
  ownerId: string;
  price: number;
};

export type PriceDropRun = {
  listings: number;
  drops: number;
  people: number;
  emailed: number;
  skipped: number;
  failed: number;
};

async function liveListings(): Promise<Watched[]> {
  const snap = await adminDb()
    .collection("properties")
    .where("status", "in", [...ACTIVE_CATALOGUE_STATUSES])
    .get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      slug: String(data.slug ?? d.id),
      title: String(data.title ?? "Untitled property"),
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
      price: priceNumber(data.price),
      numericPrice: priceNumber(data.price),
      ownerId: String(data.ownerId ?? ""),
    };
  });
}

/**
 * Who saved which home. The whole collection group is read: a saved home is a
 * two-field document and there are few of them, and filtering by listing would
 * need a collection-group index for a job that looks at every live listing
 * anyway. If saved homes ever run to five figures, index `propertyId` and ask
 * per drop instead.
 */
async function saversByListing(): Promise<Map<string, Set<string>>> {
  const snap = await adminDb().collectionGroup("savedProperties").get();
  const map = new Map<string, Set<string>>();
  for (const doc of snap.docs) {
    const uid = doc.ref.parent.parent?.id;
    const listingId = String(doc.data().propertyId ?? doc.id);
    if (!uid || !listingId) continue;
    map.set(listingId, (map.get(listingId) ?? new Set()).add(uid));
  }
  return map;
}

type Follower = { uid: string; reason: "saved" | "search"; searchLabel?: string };

export async function runPriceDropAlerts(options: { maxEmails?: number } = {}): Promise<PriceDropRun> {
  const maxEmails = options.maxEmails ?? 100;
  const run: PriceDropRun = { listings: 0, drops: 0, people: 0, emailed: 0, skipped: 0, failed: 0 };

  const listings = await liveListings();
  run.listings = listings.length;
  if (!listings.length) return run;

  const watchSnap = await adminDb().collection(PRICE_WATCH).get();
  const lastSeen = new Map(watchSnap.docs.map((d) => [d.id, priceNumber(d.data().price)]));

  const drops: Array<{ listing: Watched; drop: PriceDrop }> = [];
  const writes = adminDb().batch();
  const now = new Date().toISOString();
  for (const listing of listings) {
    if (!listing.price) continue;
    const previous = lastSeen.get(listing.id) ?? 0;
    const drop = previous ? materialDrop(previous, listing.price) : null;
    if (drop) drops.push({ listing, drop });
    // The watch always moves to tonight's price, even when the e-mail fails:
    // re-alerting everyone the next night because one address bounced is
    // worse than missing that one drop, and the next cut still tells them.
    if (previous !== listing.price) {
      writes.set(adminDb().collection(PRICE_WATCH).doc(listing.id), { listingId: listing.id, price: listing.price, seenAt: now });
    }
  }
  run.drops = drops.length;

  if (drops.length) {
    const savers = await saversByListing();
    const searchSnap = await adminDb().collection("saved_searches").where("alerts", "==", true).get();
    const searches = searchSnap.docs.map((d) => ({
      uid: String(d.data().userId ?? ""),
      label: String(d.data().label ?? ""),
      criteria: criteriaFromParams(new URLSearchParams(String(d.data().query ?? ""))),
    }));

    // One bundle per person, each home saying why they are hearing about it.
    const byPerson = new Map<string, DropListing[]>();
    for (const { listing, drop } of drops) {
      const followers: Follower[] = [...(savers.get(listing.id) ?? [])].map((uid) => ({ uid, reason: "saved" as const }));
      for (const search of searches) {
        if (!search.uid || followers.some((f) => f.uid === search.uid)) continue;
        if (matchesCriteria(listing, search.criteria)) followers.push({ uid: search.uid, reason: "search", searchLabel: search.label });
      }
      for (const follower of followers) {
        if (follower.uid === listing.ownerId) continue;
        const row: DropListing = {
          title: listing.title,
          slug: listing.slug,
          location: listing.location,
          listingType: listing.listingType,
          from: drop.from,
          to: drop.to,
          percent: drop.percent,
          why: dropReasonLabel(follower.reason, follower.searchLabel),
        };
        byPerson.set(follower.uid, [...(byPerson.get(follower.uid) ?? []), row]);
      }
    }
    run.people = byPerson.size;

    for (const [uid, rows] of byPerson) {
      if (run.emailed + run.failed >= maxEmails) break;
      // Asked here rather than left to sendMail, so someone who has turned
      // these off doesn't collect a skipped mail_log row every night.
      const prefs = await readEmailPrefs(uid);
      if (!prefs.priceDropAlerts) {
        run.skipped++;
        continue;
      }
      const user = await adminAuth()
        .getUser(uid)
        .catch(() => null);
      if (!user?.email || user.disabled) {
        run.skipped++;
        continue;
      }
      const biggestFirst = [...rows].sort((a, b) => b.percent - a.percent).slice(0, PER_EMAIL);
      const mail = priceDropEmail({ drops: biggestFirst, optOut: optOutLink(uid, "priceDropAlerts") });
      const result = await sendMail({
        kind: "price_drop",
        optOut: { uid, pref: "priceDropAlerts" },
        to: { email: user.email, name: user.displayName ?? undefined },
        ref: `price_watch/${biggestFirst.map((d) => d.slug).join(",")}`.slice(0, 300),
        ...mail,
      });
      if (result.status === "sent") run.emailed++;
      else if (result.status === "failed") run.failed++;
      else run.skipped++;
    }
  }

  await writes.commit();
  return run;
}
