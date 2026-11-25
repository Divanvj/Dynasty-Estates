// Server code only (audit item 3.2): importing this from a Client Component
// fails the build, so nothing here (keys, Admin SDK) can reach the browser.
import "server-only";

import { adminAuth, adminDb } from "./firebase-admin";
import { optOutLink } from "./email-prefs";
import { sendMail } from "./mail";
import { weeklyReportEmail, type ReportListing } from "./mail-templates";
import { lastDays, statsDocId } from "@/lib/listing-stats";
import { ACTIVE_CATALOGUE_STATUSES } from "@/lib/types/domain";

/**
 * The Monday e-mail to each agent and private seller with live listings:
 * views, saves and contact clicks (listing_stats) and enquiries (inquiries)
 * for the seven SAST days before the run, one row per listing.
 *
 * Run from the nightly job on Mondays (SAST). WEEKLY_DOC records the Monday
 * it was last sent for, so a retried run doesn't send twice.
 */

export const WEEKLY_DOC = "platform_config/weekly_report";
const DAY_MS = 86_400_000;
const SAST_MS = 2 * 60 * 60 * 1000;

/** Monday is 1, as getUTCDay, in SAST. */
export function sastWeekday(now = Date.now()): number {
  return new Date(now + SAST_MS).getUTCDay();
}

function toMs(value: unknown): number | null {
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().getTime();
  }
  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : null;
  }
  return null;
}

function shortDate(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-ZA", { day: "numeric", month: "short", timeZone: "UTC" });
}

export type WeeklyRun = { owners: number; emailed: number; skipped: number; failed: number; weekOf: string; alreadySent?: boolean };

export async function runWeeklyReports(options: { onlyUid?: string; now?: number } = {}): Promise<WeeklyRun> {
  const now = options.now ?? Date.now();
  // The seven full days before today (SAST).
  const days = lastDays(7, now - DAY_MS);
  const weekOf = days[0];
  const weekLabel = `${shortDate(days[0])} to ${shortDate(days[6])}`;
  const windowStart = Date.parse(`${days[0]}T00:00:00+02:00`);
  const windowEnd = Date.parse(`${days[6]}T00:00:00+02:00`) + DAY_MS;
  const run: WeeklyRun = { owners: 0, emailed: 0, skipped: 0, failed: 0, weekOf };

  const db = adminDb();
  if (!options.onlyUid) {
    const last = (await db.doc(WEEKLY_DOC).get()).data();
    if (last?.weekOf === weekOf) return { ...run, alreadySent: true };
  }

  let query: FirebaseFirestore.Query = db.collection("properties").where("status", "in", [...ACTIVE_CATALOGUE_STATUSES]);
  if (options.onlyUid) query = query.where("ownerId", "==", options.onlyUid);
  const listings = await query.get();
  const byOwner = new Map<string, FirebaseFirestore.QueryDocumentSnapshot[]>();
  for (const listing of listings.docs) {
    const ownerId = listing.data().ownerId;
    if (typeof ownerId !== "string" || !ownerId) continue; // sample listings have no owner
    byOwner.set(ownerId, [...(byOwner.get(ownerId) ?? []), listing]);
  }
  run.owners = byOwner.size;

  for (const [uid, own] of byOwner) {
    const user = await adminAuth().getUser(uid).catch(() => null);
    if (!user?.email || user.disabled) {
      run.skipped += 1;
      continue;
    }
    const pipeline = user.customClaims?.role === "agent" || user.customClaims?.role === "admin";

    const statRefs = own.flatMap((l) => days.map((day) => db.collection("listing_stats").doc(statsDocId(l.id, day))));
    const stats = new Map<string, { views: number; saves: number; contactClicks: number }>();
    for (let i = 0; i < statRefs.length; i += 300) {
      for (const snap of await db.getAll(...statRefs.slice(i, i + 300))) {
        if (!snap.exists) continue;
        const d = snap.data()!;
        const id = String(d.listingId ?? snap.id.replace(/_\d{8}$/, ""));
        const t = stats.get(id) ?? { views: 0, saves: 0, contactClicks: 0 };
        stats.set(id, { views: t.views + Number(d.views ?? 0), saves: t.saves + Number(d.saves ?? 0), contactClicks: t.contactClicks + Number(d.contactClicks ?? 0) });
      }
    }

    const enquiries = new Map<string, number>();
    const inbox = await db.collection("inquiries").where("ownerId", "==", uid).get();
    for (const e of inbox.docs) {
      const at = toMs(e.data().createdAt);
      if (at === null || at < windowStart || at >= windowEnd) continue;
      const id = String(e.data().propertyId ?? "");
      enquiries.set(id, (enquiries.get(id) ?? 0) + 1);
    }

    const rows: ReportListing[] = own
      .map((l) => ({
        title: String(l.data().title ?? ""),
        path: pipeline ? `/agent/listings/${l.id}` : `/seller/listings/${l.id}`,
        ...(stats.get(l.id) ?? { views: 0, saves: 0, contactClicks: 0 }),
        enquiries: enquiries.get(l.id) ?? 0,
      }))
      .sort((a, b) => b.views - a.views);

    const mail = weeklyReportEmail({
      name: user.displayName ?? null,
      weekLabel,
      listings: rows,
      portalPath: pipeline ? "/agent/listings" : "/seller/portal",
      optOut: optOutLink(uid, "weeklyReports"),
    });
    const result = await sendMail({
      kind: "weekly_report",
      optOut: { uid, pref: "weeklyReports" },
      to: { email: user.email, name: user.displayName ?? undefined },
      ref: `weekly_report/${weekOf}`,
      ...mail,
    });
    if (result.status === "sent") run.emailed += 1;
    else if (result.status === "failed") run.failed += 1;
    else run.skipped += 1;
  }

  if (!options.onlyUid) await db.doc(WEEKLY_DOC).set({ ...run, sentAt: new Date(now).toISOString() });
  return run;
}
