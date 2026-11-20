import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { recordConsoleEvent } from "@/lib/server/console-auth";
import { runIntegrityScan } from "@/lib/server/console-data";
import { adminApp, adminDb } from "@/lib/server/firebase-admin";
import { runHealthProbes } from "@/lib/server/health";
import { deleteOldStats, retentionCutoff } from "@/lib/server/listing-stats";
import { alertRecipients, sendMail } from "@/lib/server/mail";
import { opsAlertEmail } from "@/lib/server/mail-templates";
import { NIGHTLY_DOC } from "@/lib/server/platform-checks";
import { runVerificationReminders } from "@/lib/server/email-verification";
import { runFfcReminders } from "@/lib/server/practitioner-reminders";
import { runSavedSearchAlerts } from "@/lib/server/saved-searches";
import { cleanUpListingFiles, GRACE_DAYS } from "@/lib/server/storage-cleanup";
import { runWeeklyReports, sastWeekday } from "@/lib/server/weekly-report";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * The nightly jobs (docs/blaze/SETUP-PLAN.md, B2), run by Vercel Cron
 * (vercel.json) at 00:00 UTC = 02:00 SAST:
 *   1. health probes against the production site,
 *   2. the read-only data integrity scan,
 *   3. listing_stats retention (days older than 13 months are deleted),
 *   4. listing files nothing refers to any more (storage-cleanup.ts),
 *   5. saved-search alert e-mails,
 *   5b. one reminder to new accounts that haven't confirmed their e-mail (S1-6),
 *   5c. certificate expiry reminders to agents at 60 / 30 / 7 days (S1-9),
 *   6. on Mondays (SAST), the weekly listing report e-mails.
 * The e-mail jobs cap how many they send per run (the function has 60 s);
 * whatever is left over goes out the next night.
 * Each result goes to console_events as actor "system", so it shows in the
 * console's event log and the go-live list reads the last run from there.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET`. Without CRON_SECRET set
 * in the project the route refuses every call: the scan is read-heavy and
 * must not be something anyone on the internet can trigger.
 */

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET ?? "";
  if (secret.length < 16) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || process.env.CRON_SECRET.length < 16) {
    return NextResponse.json({ error: "CRON_SECRET is not set (16 characters or more), so the nightly jobs are off." }, { status: 503 });
  }
  if (!authorised(request)) return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  if (!adminApp()) return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 503 });

  const started = Date.now();
  const report: Record<string, unknown> = {};
  const failures: string[] = [];

  // Each job runs even if an earlier one failed.
  try {
    const probes = await runHealthProbes(SITE_URL);
    const failed = probes.filter((p) => !p.ok);
    report.health = { failed: failed.length, probes };
    if (failed.length) failures.push(`health: ${failed.map((p) => p.id).join(", ")}`);
    await recordConsoleEvent(null, "nightly.health", `Nightly health check: ${failed.length ? `${failed.length} failed (${failed.map((p) => p.label).join(", ")})` : "all passed"}`, {
      failed: failed.length,
      origin: SITE_URL,
      probes: probes.map((p) => `${p.id}:${p.ok ? "ok" : "fail"}:${p.ms}ms`),
    });
  } catch (error) {
    failures.push(`health: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const scan = await runIntegrityScan();
    const problems = scan.findings.filter((f) => f.severity !== "info").reduce((n, f) => n + f.items.length, 0);
    report.integrity = { problems, checks: scan.findings.map((f) => `${f.check}:${f.items.length}`) };
    await recordConsoleEvent(null, "nightly.integrity", `Nightly integrity scan: ${problems} problem(s)`, {
      problems,
      checks: scan.findings.map((f) => `${f.check}:${f.items.length}`),
    });
  } catch (error) {
    failures.push(`integrity: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const cutoff = retentionCutoff();
    const { deleted, more } = await deleteOldStats(cutoff);
    report.retention = { cutoff, deleted, more };
    await recordConsoleEvent(null, "nightly.retention", `Nightly stats clean-up: ${deleted} day record(s) before ${cutoff} deleted${more ? ", more left for tomorrow" : ""}`, {
      cutoff,
      deleted,
      more,
    });
  } catch (error) {
    failures.push(`retention: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const files = await cleanUpListingFiles();
    report.files = files;
    await recordConsoleEvent(
      null,
      "nightly.files",
      `Nightly file clean-up: ${files.deleted} unused file(s) and ${files.fingerprintsDeleted} stale photo fingerprint(s) deleted, ${files.waiting} newer than ${GRACE_DAYS} days kept${files.more ? ", more left for tomorrow" : ""}`,
      { ...files },
    );
  } catch (error) {
    failures.push(`files: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const alerts = await runSavedSearchAlerts({ maxEmails: 60 });
    report.savedSearches = alerts;
    if (alerts.failed) failures.push(`saved-search alerts: ${alerts.failed} e-mail(s) failed`);
    await recordConsoleEvent(null, "nightly.saved_searches", `Saved-search alerts: ${alerts.emailed} e-mailed, ${alerts.skipped} skipped, ${alerts.failed} failed (${alerts.searches} searches)${alerts.more ? ", more left for tomorrow" : ""}`, { ...alerts });
  } catch (error) {
    failures.push(`saved-search alerts: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const reminders = await runVerificationReminders({ maxEmails: 40 });
    report.verificationReminders = reminders;
    if (reminders.failed) failures.push(`verification reminders: ${reminders.failed} e-mail(s) failed`);
    await recordConsoleEvent(null, "nightly.verify_email", `Verification reminders: ${reminders.emailed} e-mailed, ${reminders.skipped} skipped, ${reminders.failed} failed (${reminders.candidates} unconfirmed)${reminders.more ? ", more left for tomorrow" : ""}`, { ...reminders });
  } catch (error) {
    failures.push(`verification reminders: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const ffc = await runFfcReminders({ maxEmails: 40 });
    report.ffcReminders = ffc;
    if (ffc.failed) failures.push(`certificate reminders: ${ffc.failed} e-mail(s) failed`);
    await recordConsoleEvent(null, "nightly.ffc_reminders", `Certificate expiry reminders: ${ffc.emailed} e-mailed, ${ffc.skipped} skipped, ${ffc.failed} failed (${ffc.candidates} due of ${ffc.practitioners} verified)${ffc.more ? ", more left for tomorrow" : ""}`, { ...ffc });
  } catch (error) {
    failures.push(`certificate reminders: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (sastWeekday() === 1) {
    try {
      const weekly = await runWeeklyReports();
      report.weeklyReports = weekly;
      if (weekly.failed) failures.push(`weekly reports: ${weekly.failed} e-mail(s) failed`);
      if (!weekly.alreadySent) {
        await recordConsoleEvent(null, "nightly.weekly_reports", `Weekly listing reports for the week of ${weekly.weekOf}: ${weekly.emailed} e-mailed, ${weekly.skipped} skipped, ${weekly.failed} failed`, { ...weekly });
      }
    } catch (error) {
      failures.push(`weekly reports: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const summary = failures.length ? `Nightly jobs finished with problems: ${failures.join("; ")}` : "Nightly jobs finished";
  try {
    await recordConsoleEvent(null, "nightly.run", summary, { ms: Date.now() - started, failures });
    // Read by the go-live list ("Scheduled jobs") without an index.
    await adminDb().doc(NIGHTLY_DOC).set({ lastRunAt: new Date().toISOString(), ok: failures.length === 0, failures, summary });
  } catch (error) {
    console.error("[cron] could not record the run:", error);
  }

  // Tell a person when something failed (MAIL_ALERTS_TO; switch "Nightly job alerts").
  if (failures.length) {
    const mail = opsAlertEmail({ summary, failures, ranAt: new Date().toISOString() });
    for (const to of alertRecipients()) {
      await sendMail({ kind: "ops_alert", to: { email: to }, ref: NIGHTLY_DOC, ...mail });
    }
  }
  return NextResponse.json({ ok: failures.length === 0, ms: Date.now() - started, failures, ...report }, { status: failures.length ? 500 : 200 });
}
