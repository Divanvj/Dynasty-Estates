import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { recordConsoleEvent } from "@/lib/server/console-auth";
import { runIntegrityScan } from "@/lib/server/console-data";
import { adminApp, adminDb } from "@/lib/server/firebase-admin";
import { runHealthProbes } from "@/lib/server/health";
import { deleteOldStats, retentionCutoff } from "@/lib/server/listing-stats";
import { NIGHTLY_DOC } from "@/lib/server/platform-checks";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * The nightly jobs (docs/blaze/SETUP-PLAN.md, B2), run by Vercel Cron
 * (vercel.json) at 00:00 UTC = 02:00 SAST:
 *   1. health probes against the production site,
 *   2. the read-only data integrity scan,
 *   3. listing_stats retention (days older than 13 months are deleted).
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

  const summary = failures.length ? `Nightly jobs finished with problems: ${failures.join("; ")}` : "Nightly jobs finished";
  try {
    await recordConsoleEvent(null, "nightly.run", summary, { ms: Date.now() - started, failures });
    // Read by the go-live list ("Scheduled jobs") without an index.
    await adminDb().doc(NIGHTLY_DOC).set({ lastRunAt: new Date().toISOString(), ok: failures.length === 0, failures, summary });
  } catch (error) {
    console.error("[cron] could not record the run:", error);
  }
  return NextResponse.json({ ok: failures.length === 0, ms: Date.now() - started, failures, ...report }, { status: failures.length ? 500 : 200 });
}
