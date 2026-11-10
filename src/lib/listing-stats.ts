/**
 * Listing statistics (docs/dashboards/PLAN.md, F1). One document per listing
 * per day in `listing_stats`, id `{listingId}_{YYYYMMDD}`, counting views,
 * saves and contact clicks. Written only by the server (/api/track, Admin
 * SDK); the listing's owner and admins may read them (firestore.rules).
 * No user id, IP address or cookie is stored — only the counts.
 *
 * Shared by the browser and the server, so nothing here imports Firebase.
 */

export const LISTING_EVENTS = ["view", "save", "contact"] as const;
export type ListingEvent = (typeof LISTING_EVENTS)[number];

/** The counter field each event increments. */
export const EVENT_FIELD: Record<ListingEvent, "views" | "saves" | "contactClicks"> = {
  view: "views",
  save: "saves",
  contact: "contactClicks",
};

export type DayStats = {
  /** SAST calendar day, "YYYY-MM-DD". */
  date: string;
  listingId: string;
  views: number;
  saves: number;
  contactClicks: number;
};

/** Listing ids are Firestore document ids; reject anything else before a lookup. */
export const LISTING_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

const SAST_OFFSET_MS = 2 * 60 * 60 * 1000; // South Africa is UTC+2 all year.

/** The SAST calendar day of an instant, "YYYY-MM-DD". */
export function sastDay(at: Date | number = Date.now()): string {
  return new Date(new Date(at).getTime() + SAST_OFFSET_MS).toISOString().slice(0, 10);
}

/** The last `days` SAST days, oldest first, ending today. */
export function lastDays(days: number, now: number = Date.now()): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) out.push(sastDay(now - i * 24 * 60 * 60 * 1000));
  return out;
}

export function statsDocId(listingId: string, day: string): string {
  return `${listingId}_${day.replace(/-/g, "")}`;
}

/** Fills missing days with zeros so a chart has one point per day. */
export function seriesFor(rows: DayStats[], days: string[]): DayStats[] {
  const byDay = new Map(rows.map((row) => [row.date, row]));
  const listingId = rows[0]?.listingId ?? "";
  return days.map((date) => byDay.get(date) ?? { date, listingId, views: 0, saves: 0, contactClicks: 0 });
}

export function sumStats(rows: DayStats[]) {
  return rows.reduce(
    (acc, row) => ({ views: acc.views + row.views, saves: acc.saves + row.saves, contactClicks: acc.contactClicks + row.contactClicks }),
    { views: 0, saves: 0, contactClicks: 0 },
  );
}
