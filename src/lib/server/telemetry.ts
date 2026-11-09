import { createHash } from "node:crypto";

import { adminApp, adminDb } from "./firebase-admin";

/**
 * Error and page-speed telemetry, written with the Admin SDK so the public site
 * needs no Firestore rule for it (clients cannot read or write these
 * collections at all). The console reads them back.
 *
 *   app_errors         one document per occurrence
 *   app_error_groups   one per fingerprint: resolved state set from the console
 *   web_vitals         one per reported metric
 */

export type ErrorSource = "client" | "server" | "boundary";

export type ErrorReport = {
  source: ErrorSource;
  message: string;
  name?: string;
  stack?: string;
  digest?: string;
  route?: string;
  url?: string;
  userAgent?: string;
  sessionId?: string;
  release?: string;
  test?: boolean;
};

const clip = (value: unknown, max: number): string | null =>
  typeof value === "string" && value.length ? value.slice(0, max) : null;

/**
 * Turns a concrete path into its route shape, so /property/abc-123 and
 * /property/def-456 count as one place. Long hex-ish or numeric segments are
 * treated as ids.
 */
export function routeShape(pathname: string | null | undefined): string {
  if (!pathname) return "unknown";
  const clean = pathname.split("?")[0].split("#")[0] || "/";
  return clean
    .split("/")
    .map((segment) =>
      /^\d+$/.test(segment) || /^[A-Za-z0-9_-]{16,}$/.test(segment) || /-\w{6,}$/.test(segment) ? ":id" : segment,
    )
    .join("/")
    .slice(0, 160);
}

/** The same error from different pages, ids or line numbers groups together. */
export function fingerprint(report: Pick<ErrorReport, "name" | "message" | "stack" | "source">): string {
  const message = (report.message ?? "")
    .replace(/\b[0-9a-f]{8,}\b/gi, "#")
    .replace(/\d+/g, "#")
    .slice(0, 300);
  const frame = (report.stack ?? "")
    .split("\n")
    .find((line) => /at |@/.test(line))
    ?.replace(/:\d+:\d+/g, "")
    .replace(/\?[^)\s]*/g, "")
    .trim()
    .slice(0, 200);
  return createHash("sha1")
    .update(`${report.source}|${report.name ?? "Error"}|${message}|${frame ?? ""}`)
    .digest("hex")
    .slice(0, 16);
}

export async function recordError(report: ErrorReport): Promise<boolean> {
  if (!adminApp()) return false;
  const message = clip(report.message, 1000) ?? "Unknown error";
  await adminDb()
    .collection("app_errors")
    .add({
      fingerprint: fingerprint({ ...report, message }),
      source: report.source,
      name: clip(report.name, 120) ?? "Error",
      message,
      stack: clip(report.stack, 4000),
      digest: clip(report.digest, 120),
      route: routeShape(report.route ?? report.url),
      url: clip(report.url, 500),
      userAgent: clip(report.userAgent, 300),
      sessionId: clip(report.sessionId, 64),
      release: clip(report.release, 64) ?? process.env.NEXT_PUBLIC_BUILD_SHA ?? null,
      test: report.test === true,
      createdAt: new Date(),
    });
  return true;
}

export type VitalReport = {
  name: string;
  value: number;
  rating?: string;
  route?: string;
  navigationType?: string;
  sessionId?: string;
};

const VITALS = new Set(["LCP", "INP", "CLS", "FCP", "TTFB", "FID"]);

export async function recordVitals(reports: VitalReport[]): Promise<number> {
  if (!adminApp()) return 0;
  const valid = reports.filter(
    (r) => VITALS.has(r.name) && typeof r.value === "number" && Number.isFinite(r.value) && r.value >= 0,
  );
  if (!valid.length) return 0;
  const batch = adminDb().batch();
  const now = new Date();
  for (const r of valid.slice(0, 10)) {
    batch.set(adminDb().collection("web_vitals").doc(), {
      name: r.name,
      value: r.value,
      rating: clip(r.rating, 24),
      route: routeShape(r.route),
      navigationType: clip(r.navigationType, 24),
      sessionId: clip(r.sessionId, 64),
      release: process.env.NEXT_PUBLIC_BUILD_SHA ?? null,
      createdAt: now,
    });
  }
  await batch.commit();
  return valid.length;
}

/**
 * Best-effort flood guard for the two public endpoints. Per server instance
 * only — serverless instances do not share memory — so it caps a single noisy
 * tab or a loop, not a determined attacker. Payloads are size-capped above.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function allowRequest(key: string, limit: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    if (buckets.size > 5000) buckets.clear();
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

export function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}
