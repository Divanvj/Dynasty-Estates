/**
 * S1-9 — when an agent is reminded that their Fidelity Fund Certificate is
 * about to expire. No Firebase import: the nightly job
 * (lib/server/practitioner-reminders.ts) and the tests share this.
 *
 * Without a valid FFC a practitioner may not trade, so the reminders start
 * well before the date on the certificate. The warning in the portal appears
 * at EXPIRY_WARNING_DAYS (60); these e-mails follow the same first step and
 * then get closer together.
 */

/** Days before expiry, furthest first. One e-mail per step, ever. */
export const FFC_REMINDER_DAYS = [60, 30, 7] as const;

export type FfcMilestone = (typeof FFC_REMINDER_DAYS)[number];

export function isFfcMilestone(value: unknown): value is FfcMilestone {
  return typeof value === "number" && (FFC_REMINDER_DAYS as readonly number[]).includes(value);
}

/**
 * The step this certificate is due, or null when nothing is owed today.
 *
 * It is deliberately *not* "exactly 60, 30 or 7 days left": a night the job
 * doesn't run, a certificate filed late, or a date changed on the profile
 * would all mean the step is missed for good. Instead the smallest step the
 * certificate has already reached is owed, so a run on day 29 still sends the
 * 30-day reminder — once.
 *
 * `sent` is the steps this practitioner has already been e-mailed about.
 * An expired certificate (daysLeft < 0) is left to the portal and the "Needs
 * you today" list: an e-mail after the fact helps nobody and the agent is
 * already blocked.
 */
export function dueFfcMilestone(daysLeft: number | null, sent: readonly number[] = []): FfcMilestone | null {
  if (daysLeft === null || !Number.isFinite(daysLeft) || daysLeft < 0) return null;
  // Smallest step the certificate has reached: 29 days left → the 30-day step.
  const reached = FFC_REMINDER_DAYS.filter((days) => daysLeft <= days);
  const due = reached[reached.length - 1];
  if (due === undefined) return null;
  return sent.includes(due) ? null : due;
}

/**
 * The steps already e-mailed, read from a `compliance_reminders/{uid}` record.
 *
 * The record is tied to one expiry date. When the agent files a renewed
 * certificate the date no longer matches, so this returns nothing and the
 * whole 60 / 30 / 7 run starts again for the new date — without that, an agent
 * would be reminded once in their life and never again.
 */
export function sentMilestones(record: unknown, ffcExpiry: string): FfcMilestone[] {
  const data = (record ?? {}) as { ffcExpiry?: unknown; sent?: unknown };
  if (typeof data.ffcExpiry !== "string" || data.ffcExpiry !== ffcExpiry) return [];
  const raw = Array.isArray(data.sent) ? data.sent : [];
  return raw.map(Number).filter(isFfcMilestone);
}

/** The steps to write back after one has been e-mailed: no duplicates, furthest first. */
export function withMilestone(sent: readonly FfcMilestone[], milestone: FfcMilestone): FfcMilestone[] {
  return [...new Set([...sent, milestone])].sort((a, b) => b - a);
}

/** "60 days", "a week" — how the e-mail says it, in one place. */
export function ffcMilestoneLabel(milestone: FfcMilestone): string {
  return milestone === 7 ? "a week" : `${milestone} days`;
}
