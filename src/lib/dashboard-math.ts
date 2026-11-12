import { lastDays, sastDay, type DayStats } from "./listing-stats";
import { asStage, INQUIRY_STAGES, type InquiryStage, type SellerInquiry } from "./seller-inquiries";

/**
 * Pure helpers behind the premium dashboards (docs/dashboards/REDESIGN-PLAN.md).
 * Everything is derived from stored data; nothing is estimated.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;
/** First reply within this counts as "on target" (owner decision 2026-11-12). */
export const REPLY_TARGET_MS = 60 * 60 * 1000;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-11-12" → "12 Nov". */
export function shortDay(day: string): string {
  const [, m, d] = day.split("-").map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1]}`;
}

/** The last `days` SAST days and the `days` before them, oldest first. */
export function periods(days: number, now: number) {
  const both = lastDays(days * 2, now);
  return { previous: both.slice(0, days), current: both.slice(days), since: both[0] };
}

/** Stats summed per day over all listings, one entry per day in `days`. */
export function statsPerDay(rows: DayStats[], days: string[]) {
  const byDay = new Map(days.map((d) => [d, { views: 0, saves: 0, contactClicks: 0 }]));
  for (const row of rows) {
    const slot = byDay.get(row.date);
    if (!slot) continue;
    slot.views += row.views;
    slot.saves += row.saves;
    slot.contactClicks += row.contactClicks;
  }
  return days.map((d) => byDay.get(d)!);
}

export function sum(values: number[]) {
  return values.reduce((a, b) => a + b, 0);
}

/** How many items were created on each day in `days`. */
export function countPerDay(items: { createdAt: Date | null }[], days: string[]) {
  const counts = new Map(days.map((d) => [d, 0]));
  for (const item of items) {
    if (!item.createdAt) continue;
    const d = sastDay(item.createdAt);
    if (counts.has(d)) counts.set(d, counts.get(d)! + 1);
  }
  return days.map((d) => counts.get(d)!);
}

/** First-reply figures over the window: share within the target and the slowest. */
export function replyFigures(items: Pick<SellerInquiry, "createdAt" | "firstRespondedAt">[], now: number, windowDays = 30) {
  const since = now - windowDays * DAY_MS;
  const waits = items
    .filter((i) => i.createdAt && i.firstRespondedAt && i.createdAt.getTime() >= since)
    .map((i) => Math.max(0, i.firstRespondedAt!.getTime() - i.createdAt!.getTime()));
  if (waits.length === 0) return null;
  return {
    count: waits.length,
    withinTarget: waits.filter((w) => w <= REPLY_TARGET_MS).length / waits.length,
    slowestMs: Math.max(...waits),
  };
}

/** "38 min" → ["38", "min"], for a big figure with a small unit. */
export function splitAge(text: string): [string, string] {
  const [value, ...rest] = text.split(" ");
  return [value, rest.join(" ")];
}

export const FUNNEL_STAGES: InquiryStage[] = ["new", "contacted", "viewing", "offer", "won"];

/**
 * How many enquiries reached at least each stage. A lost enquiry counts at
 * New only — the stage it was lost from is not stored.
 */
export function funnelCounts(items: Pick<SellerInquiry, "status">[]) {
  const order = (stage: InquiryStage) => (stage === "lost" ? 0 : INQUIRY_STAGES.indexOf(stage));
  return FUNNEL_STAGES.map((stage, k) => ({ stage, count: items.filter((i) => order(asStage(i.status)) >= k).length }));
}

/** Open enquiries (moved on but not closed) untouched for longer than `days`. */
export function stuckEnquiries(items: SellerInquiry[], now: number, days = 7) {
  return items.filter((i) => {
    const stage = asStage(i.status);
    if (stage === "new" || stage === "won" || stage === "lost") return false;
    const last = (i.updatedAt ?? i.createdAt)?.getTime() ?? now;
    return now - last > days * DAY_MS;
  });
}

/** "Good morning" etc. by South African time. */
export function greeting(now: number) {
  const hour = (new Date(now).getUTCHours() + 2) % 24;
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

/** "Thursday 12 November" in SAST. */
export function longToday(now: number) {
  const d = new Date(now + 2 * 60 * 60 * 1000);
  const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getUTCDay()];
  const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][d.getUTCMonth()];
  return `${weekday} ${d.getUTCDate()} ${month}`;
}

/** "up 18%" / "down 6%" / "" for prose; empty when there is nothing to compare. */
export function changeWords(now: number, before: number) {
  if (before === 0 || now === before) return "";
  const pct = Math.round((Math.abs(now - before) / before) * 100);
  return now > before ? `up ${pct}%` : `down ${pct}%`;
}
