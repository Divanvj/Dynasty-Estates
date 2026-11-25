// Server code only (audit item 3.2): importing this from a Client Component
// fails the build, so nothing here (keys, Admin SDK) can reach the browser.
import "server-only";

import { adminAuth, adminDb } from "./firebase-admin";
import { optOutLink, readEmailPrefs } from "./email-prefs";
import { isUndeliverable } from "./email-verification";
import { sendMail } from "./mail";
import { ffcReminderEmail } from "./mail-templates";
import { dueFfcMilestone, sentMilestones, withMilestone } from "@/lib/ffc-reminders";
import { daysUntil, PPRA_URL } from "@/lib/practitioner-compliance";

/**
 * S1-9 — the nightly reminder that an agent's Fidelity Fund Certificate is
 * about to expire (60 days, 30 days, a week; lib/ffc-reminders.ts).
 *
 * Only **verified** practitioners are reminded: a pending or rejected record
 * is not trading on Dynasty yet, and the admin queue is already looking at it.
 *
 * `compliance_reminders/{uid}` (server-only, like email_verification) records
 * which steps have gone out **for one expiry date**. Keying it by the date is
 * what makes renewal work: the moment the agent files a new certificate, the
 * record no longer matches, the steps reset, and next year's reminders are
 * free to send. Without that, a renewed agent would never be reminded again.
 */

export const COMPLIANCE_REMINDERS = "compliance_reminders";

export type FfcReminderRun = {
  practitioners: number;
  candidates: number;
  emailed: number;
  skipped: number;
  failed: number;
  more: boolean;
};

function expiryLabel(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/**
 * One run. `now` and `onlyUid` are for checking it by hand without waiting for
 * a night to pass (see the console's test send and the S1-9 notes).
 */
export async function runFfcReminders(options: { maxEmails?: number; now?: number; onlyUid?: string } = {}): Promise<FfcReminderRun> {
  const maxEmails = options.maxEmails ?? 40;
  const now = options.now ?? Date.now();
  const run: FfcReminderRun = { practitioners: 0, candidates: 0, emailed: 0, skipped: 0, failed: 0, more: false };

  const docs = options.onlyUid
    ? [await adminDb().collection("practitioners").doc(options.onlyUid).get()].filter((d) => d.exists && d.data()?.status === "verified")
    : (await adminDb().collection("practitioners").where("status", "==", "verified").get()).docs;
  run.practitioners = docs.length;

  for (const doc of docs) {
    const data = doc.data()!;
    const ffcExpiry = String(data.ffcExpiry ?? "");
    const daysLeft = daysUntil(ffcExpiry, now);
    if (daysLeft === null) continue;

    const ref = adminDb().collection(COMPLIANCE_REMINDERS).doc(doc.id);
    const record = await ref.get();
    const milestone = dueFfcMilestone(daysLeft, sentMilestones(record.data(), ffcExpiry));
    if (milestone === null) continue;
    run.candidates++;

    if (run.emailed + run.failed >= maxEmails) {
      run.more = true;
      break;
    }

    // The address on the account, not the one typed on the record: that is the
    // one they sign in with and the one Dynasty already e-mails.
    const user = await adminAuth()
      .getUser(doc.id)
      .catch(() => null);
    const email = user?.email ?? (typeof data.email === "string" ? data.email : "");
    if (!email || isUndeliverable(email) || user?.disabled) {
      run.skipped++;
      continue;
    }

    // Asked before sending, not left to sendMail's own check: an agent who has
    // turned these off would otherwise add a "skipped" row to mail_log every
    // single night. Nothing is written down either, so if they turn them back
    // on while the certificate is still running out, the step is still owed.
    const prefs = await readEmailPrefs(doc.id);
    if (!prefs.complianceReminders) {
      run.skipped++;
      continue;
    }

    const name = String(data.fullName ?? "") || user?.displayName || null;
    const mail = ffcReminderEmail({
      name,
      ffcNumber: String(data.ffcNumber ?? ""),
      ffcExpiry,
      expiryLabel: expiryLabel(ffcExpiry),
      daysLeft,
      ppraUrl: PPRA_URL,
      optOut: optOutLink(doc.id, "complianceReminders"),
    });
    const result = await sendMail({
      kind: "ffc_reminder",
      to: { email, name: name ?? undefined },
      ref: `practitioners/${doc.id}`,
      optOut: { uid: doc.id, pref: "complianceReminders" },
      ...mail,
    });

    if (result.status === "sent") run.emailed++;
    else if (result.status === "failed") run.failed++;
    else run.skipped++;

    // A step is written down only when the e-mail actually went, so a failure
    // or a switched-off kind is retried the next night rather than lost.
    if (result.status === "sent") {
      await ref.set(
        {
          uid: doc.id,
          ffcExpiry,
          sent: withMilestone(sentMilestones((await ref.get()).data(), ffcExpiry), milestone),
          lastSentAt: new Date().toISOString(),
          lastMilestone: milestone,
          lastResult: result.status,
        },
        { merge: false },
      );
    }
  }

  return run;
}
