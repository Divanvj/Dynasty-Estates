import type { UserRecord } from "firebase-admin/auth";

import { fallbackProperties } from "@/lib/property-data";

import { adminAuth, adminDb } from "./firebase-admin";

/*
  Reads for the developer console. Everything here is computed from live data
  with the Admin SDK; nothing is estimated or filled in. Collections are small
  today, so documents are read (capped) and counted in memory — that copes with
  createdAt being a Timestamp in some collections and an ISO string in others,
  which a Firestore range query cannot. The cap is reported when it is hit.
*/

export const READ_CAP = 5000;

export type Period = "day" | "week" | "month";
export const PERIOD_MS: Record<Period, number> = {
  day: 86_400_000,
  week: 7 * 86_400_000,
  month: 30 * 86_400_000,
};

export function parsePeriod(value: string | null): Period {
  return value === "day" || value === "month" ? value : "week";
}

/** Timestamp | Date | ISO string | millis → millis, or null. */
export function toMillis(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : ms;
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === "object" && "toMillis" in value && typeof (value as { toMillis: unknown }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return null;
}

export type Doc = { id: string; data: Record<string, unknown> };

export async function readCollection(name: string, cap = READ_CAP): Promise<{ docs: Doc[]; capped: boolean }> {
  const snapshot = await adminDb().collection(name).limit(cap + 1).get();
  const docs = snapshot.docs.slice(0, cap).map((d) => ({ id: d.id, data: d.data() }));
  return { docs, capped: snapshot.size > cap };
}

/** Documents created since `sinceMs`, newest first, read with a range query on a Timestamp field. */
export async function readSince(name: string, sinceMs: number, cap = READ_CAP): Promise<Doc[]> {
  const snapshot = await adminDb()
    .collection(name)
    .where("createdAt", ">=", new Date(sinceMs))
    .orderBy("createdAt", "desc")
    .limit(cap)
    .get();
  return snapshot.docs.map((d) => ({ id: d.id, data: d.data() }));
}

export async function listAllUsers(cap = READ_CAP): Promise<UserRecord[]> {
  const users: UserRecord[] = [];
  let pageToken: string | undefined;
  do {
    const page = await adminAuth().listUsers(1000, pageToken);
    users.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken && users.length < cap);
  return users;
}

export type Compare = { current: number; previous: number | null };

function inWindow(ms: number | null, start: number, end: number) {
  return ms !== null && ms >= start && ms < end;
}

function compareCount(values: Array<number | null>, period: Period, now: number): Compare {
  const len = PERIOD_MS[period];
  return {
    current: values.filter((ms) => inWindow(ms, now - len, now + 1)).length,
    previous: values.filter((ms) => inWindow(ms, now - 2 * len, now - len)).length,
  };
}

const countBy = <T,>(items: T[], key: (item: T) => string) =>
  items.reduce<Record<string, number>>((acc, item) => {
    const k = key(item);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

// ---------------------------------------------------------------- overview

export async function getOverview(period: Period) {
  const now = Date.now();
  const len = PERIOD_MS[period];

  const [users, properties, physical, inquiries, applications, support, collections, audit, errorsRecent, vitalsRecent, savedCount] =
    await Promise.all([
      listAllUsers(),
      readCollection("properties"),
      adminDb().collection("physical_properties").count().get(),
      readCollection("inquiries"),
      readCollection("applications"),
      readCollection("support_requests"),
      readCollection("collections"),
      adminDb().collection("audit_logs").count().get(),
      readSince("app_errors", now - 2 * Math.max(len, PERIOD_MS.week)),
      readSince("web_vitals", now - len),
      adminDb().collectionGroup("savedProperties").count().get(),
    ]);

  const roleOf = (u: UserRecord) => (typeof u.customClaims?.role === "string" ? (u.customClaims.role as string) : "none");
  const created = (docs: Doc[]) => docs.map((d) => toMillis(d.data.createdAt));

  const listingStatus = countBy(properties.docs, (d) => String(d.data.status ?? "Unknown"));
  const fraudFlagged = properties.docs.filter(
    (d) => Array.isArray(d.data.fraudSignals) && (d.data.fraudSignals as unknown[]).length > 0,
  ).length;

  const errorTimes = errorsRecent.filter((d) => d.data.test !== true).map((d) => toMillis(d.data.createdAt));
  const resolved = await resolvedFingerprints();
  const openGroups = new Set(
    errorsRecent
      .filter((d) => d.data.test !== true && inWindow(toMillis(d.data.createdAt), now - len, now + 1))
      .map((d) => String(d.data.fingerprint))
      .filter((fp) => !resolved.has(fp)),
  );

  const lcp = vitalsRecent.filter((d) => d.data.name === "LCP").map((d) => Number(d.data.value));

  return {
    period,
    generatedAt: new Date(now).toISOString(),
    capped: [properties, inquiries, applications, support, collections].some((r) => r.capped),
    users: {
      total: users.length,
      byRole: countBy(users, roleOf),
      byProvider: countBy(users, (u) => u.providerData[0]?.providerId ?? "none"),
      disabled: users.filter((u) => u.disabled).length,
      unverifiedEmail: users.filter((u) => u.email && !u.emailVerified).length,
      newUsers: compareCount(users.map((u) => toMillis(u.metadata.creationTime)), period, now),
      // Auth keeps only the LAST sign-in, so "active" in the previous period
      // cannot be reconstructed. It is reported as unknown, not as zero.
      active: {
        current: users.filter((u) => inWindow(toMillis(u.metadata.lastSignInTime), now - len, now + 1)).length,
        previous: null,
      } satisfies Compare,
    },
    listings: {
      total: properties.docs.length,
      physical: physical.data().count,
      byStatus: listingStatus,
      newListings: compareCount(created(properties.docs), period, now),
      fraudFlagged,
    },
    activity: {
      inquiries: { total: inquiries.docs.length, ...compareCount(created(inquiries.docs), period, now) },
      applications: { total: applications.docs.length, ...compareCount(created(applications.docs), period, now) },
      support: { total: support.docs.length, ...compareCount(created(support.docs), period, now) },
      collections: { total: collections.docs.length, ...compareCount(created(collections.docs), period, now) },
      savedHomes: savedCount.data().count,
      auditEntries: audit.data().count,
    },
    queues: {
      moderation: listingStatus["Submitted"] ?? 0,
      needsChanges: listingStatus["Needs changes"] ?? 0,
      fraud: fraudFlagged,
      supportNew: support.docs.filter((d) => (d.data.status ?? "new") === "new").length,
      applicationsNew: applications.docs.filter((d) => d.data.status === "submitted").length,
      inquiriesNew: inquiries.docs.filter((d) => (d.data.status ?? "new") === "new").length,
    },
    errors: {
      occurrences: compareCount(errorTimes, period, now),
      openGroups: openGroups.size,
      lastAt: errorTimes.length ? new Date(Math.max(...(errorTimes as number[]))).toISOString() : null,
    },
    vitals: {
      samples: vitalsRecent.length,
      lcpP75: percentile(lcp, 75),
    },
  };
}

export function percentile(values: number[], p: number): number | null {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

// ---------------------------------------------------------------- errors

async function resolvedFingerprints(): Promise<Set<string>> {
  const snapshot = await adminDb().collection("app_error_groups").where("resolved", "==", true).get();
  return new Set(snapshot.docs.map((d) => d.id));
}

export async function getErrorGroups(days: number) {
  const since = Date.now() - days * 86_400_000;
  const [events, groupsSnap] = await Promise.all([
    readSince("app_errors", since, 2000),
    adminDb().collection("app_error_groups").get(),
  ]);
  const meta = new Map(groupsSnap.docs.map((d) => [d.id, d.data()]));

  type Group = {
    fingerprint: string;
    name: string;
    message: string;
    source: string;
    count: number;
    sessions: Set<string>;
    routes: Record<string, number>;
    firstSeen: number;
    lastSeen: number;
    sample: Record<string, unknown>;
    test: boolean;
  };
  const groups = new Map<string, Group>();
  for (const { data } of events) {
    const fp = String(data.fingerprint);
    const at = toMillis(data.createdAt) ?? 0;
    let group = groups.get(fp);
    if (!group) {
      group = {
        fingerprint: fp,
        name: String(data.name ?? "Error"),
        message: String(data.message ?? ""),
        source: String(data.source ?? "client"),
        count: 0,
        sessions: new Set(),
        routes: {},
        firstSeen: at,
        lastSeen: at,
        sample: data,
        test: data.test === true,
      };
      groups.set(fp, group);
    }
    group.count += 1;
    if (data.sessionId) group.sessions.add(String(data.sessionId));
    const route = String(data.route ?? "unknown");
    group.routes[route] = (group.routes[route] ?? 0) + 1;
    group.firstSeen = Math.min(group.firstSeen, at);
    if (at >= group.lastSeen) {
      group.lastSeen = at;
      group.sample = data;
    }
  }

  return {
    days,
    truncated: events.length >= 2000,
    groups: [...groups.values()]
      .map((g) => {
        const m = meta.get(g.fingerprint);
        const resolvedAt = toMillis(m?.resolvedAt);
        return {
          fingerprint: g.fingerprint,
          name: g.name,
          message: g.message,
          source: g.source,
          test: g.test,
          count: g.count,
          sessions: g.sessions.size,
          routes: Object.entries(g.routes).sort((a, b) => b[1] - a[1]).slice(0, 5),
          firstSeen: new Date(g.firstSeen).toISOString(),
          lastSeen: new Date(g.lastSeen).toISOString(),
          // A group resolved before it happened again is open again.
          resolved: m?.resolved === true && resolvedAt !== null && resolvedAt >= g.lastSeen,
          resolvedBy: (m?.resolvedBy as string | undefined) ?? null,
          sample: {
            stack: (g.sample.stack as string | null) ?? null,
            url: (g.sample.url as string | null) ?? null,
            userAgent: (g.sample.userAgent as string | null) ?? null,
            digest: (g.sample.digest as string | null) ?? null,
            release: (g.sample.release as string | null) ?? null,
          },
        };
      })
      .sort((a, b) => Number(a.resolved) - Number(b.resolved) || b.lastSeen.localeCompare(a.lastSeen)),
  };
}

// ---------------------------------------------------------------- performance

export const VITAL_THRESHOLDS: Record<string, { good: number; poor: number; unit: "ms" | "" }> = {
  LCP: { good: 2500, poor: 4000, unit: "ms" },
  INP: { good: 200, poor: 500, unit: "ms" },
  CLS: { good: 0.1, poor: 0.25, unit: "" },
  FCP: { good: 1800, poor: 3000, unit: "ms" },
  TTFB: { good: 800, poor: 1800, unit: "ms" },
};

export async function getVitals(days: number) {
  const docs = await readSince("web_vitals", Date.now() - days * 86_400_000, 5000);
  const byMetric: Record<string, number[]> = {};
  const byRoute: Record<string, Record<string, number[]>> = {};
  for (const { data } of docs) {
    const name = String(data.name);
    const value = Number(data.value);
    const route = String(data.route ?? "unknown");
    (byMetric[name] ??= []).push(value);
    ((byRoute[route] ??= {})[name] ??= []).push(value);
  }
  const summarise = (values: number[] | undefined) =>
    values?.length ? { p75: percentile(values, 75), samples: values.length } : null;
  return {
    days,
    samples: docs.length,
    truncated: docs.length >= 5000,
    thresholds: VITAL_THRESHOLDS,
    metrics: Object.fromEntries(Object.keys(VITAL_THRESHOLDS).map((m) => [m, summarise(byMetric[m])])),
    routes: Object.entries(byRoute)
      .map(([route, metrics]) => ({
        route,
        samples: Object.values(metrics).reduce((n, v) => n + v.length, 0),
        metrics: Object.fromEntries(Object.keys(VITAL_THRESHOLDS).map((m) => [m, summarise(metrics[m])])),
      }))
      .sort((a, b) => (b.metrics.LCP?.p75 ?? 0) - (a.metrics.LCP?.p75 ?? 0)),
  };
}

// ---------------------------------------------------------------- event log

export type EventCategory =
  | "accounts"
  | "listings"
  | "enquiries"
  | "support"
  | "admin"
  | "console"
  | "errors"
  | "code";

export type LogEvent = {
  id: string;
  category: EventCategory;
  at: string;
  title: string;
  detail: string;
  actor: string | null;
  severity: "info" | "warning" | "error";
  href?: string;
};

export async function getEventLog(sinceMs: number): Promise<LogEvent[]> {
  const iso = (ms: number | null) => new Date(ms ?? 0).toISOString();
  const after = (ms: number | null) => ms !== null && ms >= sinceMs;
  const events: LogEvent[] = [];

  const [users, properties, inquiries, applications, support, audit, consoleEvents, errors, collections] = await Promise.all([
    listAllUsers(),
    readCollection("properties"),
    readCollection("inquiries"),
    readCollection("applications"),
    readCollection("support_requests"),
    readCollection("audit_logs"),
    readSince("console_events", sinceMs, 500),
    readSince("app_errors", sinceMs, 500),
    readCollection("collections"),
  ]);

  for (const u of users) {
    const created = toMillis(u.metadata.creationTime);
    if (after(created)) {
      events.push({
        id: `acct-new-${u.uid}`,
        category: "accounts",
        at: iso(created),
        title: "Account created",
        detail: `${u.email ?? u.phoneNumber ?? u.uid} · ${u.providerData[0]?.providerId ?? "unknown"} sign-in`,
        actor: u.email ?? null,
        severity: "info",
      });
    }
    const signedIn = toMillis(u.metadata.lastSignInTime);
    if (after(signedIn) && signedIn !== created) {
      events.push({
        id: `acct-in-${u.uid}`,
        category: "accounts",
        at: iso(signedIn),
        title: "Signed in (latest)",
        detail: `${u.email ?? u.phoneNumber ?? u.uid} · role ${String(u.customClaims?.role ?? "none")}`,
        actor: u.email ?? null,
        severity: "info",
      });
    }
  }

  for (const { id, data } of properties.docs) {
    const created = toMillis(data.createdAt);
    const updated = toMillis(data.updatedAt);
    if (after(created)) {
      events.push({
        id: `lst-new-${id}`,
        category: "listings",
        at: iso(created),
        title: "Listing created",
        detail: `${String(data.title ?? id)} · ${String(data.status ?? "")}`,
        actor: String(data.ownerId ?? "") || null,
        severity: "info",
      });
    }
    if (after(updated) && updated !== created) {
      events.push({
        id: `lst-upd-${id}`,
        category: "listings",
        at: iso(updated),
        title: "Listing updated",
        detail: `${String(data.title ?? id)} · now ${String(data.status ?? "")}`,
        actor: String(data.ownerId ?? "") || null,
        severity: "info",
      });
    }
  }

  for (const { id, data } of inquiries.docs) {
    const at = toMillis(data.createdAt);
    if (after(at)) {
      events.push({
        id: `inq-${id}`,
        category: "enquiries",
        at: iso(at),
        title: `Enquiry (${String(data.kind ?? "message")})`,
        detail: String(data.propertyTitle ?? data.propertyId ?? ""),
        actor: (data.userEmail as string) ?? null,
        severity: "info",
      });
    }
  }
  for (const { id, data } of applications.docs) {
    const at = toMillis(data.createdAt);
    if (after(at)) {
      events.push({
        id: `app-${id}`,
        category: "enquiries",
        at: iso(at),
        title: "Tenant application filed",
        detail: `${String(data.propertyTitle ?? data.propertyId ?? "")} · ${String(data.status ?? "")}`,
        actor: (data.applicantEmail as string) ?? null,
        severity: "info",
      });
    }
  }
  for (const { id, data } of collections.docs) {
    const at = toMillis(data.createdAt);
    if (after(at)) {
      events.push({
        id: `col-${id}`,
        category: "enquiries",
        at: iso(at),
        title: "Collection created",
        detail: String(data.name ?? id),
        actor: null,
        severity: "info",
      });
    }
  }
  for (const { id, data } of support.docs) {
    const at = toMillis(data.createdAt);
    if (after(at)) {
      events.push({
        id: `sup-${id}`,
        category: "support",
        at: iso(at),
        title: `Support request · ${String(data.status ?? "new")}`,
        detail: String(data.message ?? "").slice(0, 140),
        actor: (data.userEmail as string) ?? null,
        severity: data.status === "new" ? "warning" : "info",
        href: "/admin",
      });
    }
  }
  for (const { id, data } of audit.docs) {
    const at = toMillis(data.createdAt);
    if (after(at)) {
      events.push({
        id: `aud-${id}`,
        category: "admin",
        at: iso(at),
        title: String(data.action ?? "Admin action"),
        detail: `${String(data.resource ?? "")} ${data.details ? `· ${String(data.details).slice(0, 120)}` : ""}`.trim(),
        actor: (data.actorEmail as string) ?? null,
        severity: "info",
      });
    }
  }
  for (const { id, data } of consoleEvents) {
    events.push({
      id: `con-${id}`,
      category: "console",
      at: iso(toMillis(data.createdAt)),
      title: String(data.summary ?? data.action ?? "Console action"),
      detail: String(data.action ?? ""),
      actor: (data.actorEmail as string) ?? null,
      severity: String(data.action ?? "").startsWith("health.") && data.details && (data.details as { failed?: number }).failed ? "warning" : "info",
    });
  }
  for (const { id, data } of errors) {
    events.push({
      id: `err-${id}`,
      category: "errors",
      at: iso(toMillis(data.createdAt)),
      title: `${String(data.name ?? "Error")}${data.test ? " (test)" : ""}`,
      detail: `${String(data.message ?? "").slice(0, 140)} · ${String(data.route ?? "")}`,
      actor: null,
      severity: data.test ? "info" : "error",
      href: "/console/errors",
    });
  }

  return events.sort((a, b) => b.at.localeCompare(a.at));
}

// ---------------------------------------------------------------- integrity

export type IntegrityFinding = {
  check: string;
  title: string;
  severity: "error" | "warning" | "info";
  description: string;
  items: Array<{ id: string; label: string; collection: string }>;
};

export async function runIntegrityScan(): Promise<{ ranAt: string; findings: IntegrityFinding[]; scanned: Record<string, number> }> {
  const [users, profiles, properties, physical, inquiries, applications, fingerprints, collections] = await Promise.all([
    listAllUsers(),
    readCollection("users"),
    readCollection("properties"),
    readCollection("physical_properties"),
    readCollection("inquiries"),
    readCollection("applications"),
    readCollection("photo_fingerprints"),
    readCollection("collections"),
  ]);

  const uids = new Set(users.map((u) => u.uid));
  const profileIds = new Set(profiles.docs.map((d) => d.id));
  const propertyIds = new Set(properties.docs.map((d) => d.id));
  const physicalIds = new Set(physical.docs.map((d) => d.id));
  const findings: IntegrityFinding[] = [];
  const add = (f: IntegrityFinding) => {
    if (f.items.length) findings.push(f);
  };

  add({
    check: "listing-owner",
    title: "Listings whose owner account no longer exists",
    severity: "error",
    description: "The ownerId does not match any Firebase Auth account, so nobody can edit or withdraw the listing.",
    items: properties.docs
      .filter((d) => !d.data.ownerId || !uids.has(String(d.data.ownerId)))
      .map((d) => ({ id: d.id, label: String(d.data.title ?? d.id), collection: "properties" })),
  });
  add({
    check: "listing-physical",
    title: "Listings pointing at a missing physical property",
    severity: "error",
    description: "properties.propertyId should reference a physical_properties document (size, rooms, location).",
    items: properties.docs
      .filter((d) => typeof d.data.propertyId === "string" && !physicalIds.has(d.data.propertyId as string))
      .map((d) => ({ id: d.id, label: String(d.data.title ?? d.id), collection: "properties" })),
  });
  const referencedPhysical = new Set(properties.docs.map((d) => String(d.data.propertyId ?? "")));
  add({
    check: "physical-unused",
    title: "Physical properties with no listing",
    severity: "info",
    description: "Left behind when a listing was deleted or its creation failed half-way.",
    items: physical.docs
      .filter((d) => !referencedPhysical.has(d.id))
      .map((d) => ({ id: d.id, label: `${String(d.data.location ?? "")} ${String(d.data.city ?? "")}`.trim() || d.id, collection: "physical_properties" })),
  });
  // While Firestore holds no published listings the site shows built-in sample
  // listings (fallbackProperties), and visitors can enquire on those. Such
  // records are reported separately: the listing never existed in Firestore,
  // rather than having been deleted.
  const sampleIds = new Set(fallbackProperties.flatMap((p) => [p.id, p.slug]));
  const listingRefs = [
    ...inquiries.docs
      .filter((d) => typeof d.data.propertyId === "string" && !(d.data.propertyId as string).startsWith("agent:"))
      .map((d) => ({ d, collection: "inquiries" })),
    ...applications.docs.filter((d) => typeof d.data.propertyId === "string").map((d) => ({ d, collection: "applications" })),
  ].filter(({ d }) => !propertyIds.has(d.data.propertyId as string));
  const toItem = ({ d, collection }: { d: Doc; collection: string }) => ({
    id: d.id,
    label: `${String(d.data.propertyTitle ?? d.data.propertyId)} (${String(d.data.propertyId)})`,
    collection,
  });
  add({
    check: "enquiry-listing",
    title: "Enquiries and applications for listings that no longer exist",
    severity: "warning",
    description: "The listing is neither in Firestore nor one of the built-in samples. Agent enquiries (propertyId agent:…) are excluded.",
    items: listingRefs.filter(({ d }) => !sampleIds.has(d.data.propertyId as string)).map(toItem),
  });
  add({
    check: "enquiry-sample",
    title: "Enquiries and applications on sample listings",
    severity: "info",
    description: "Filed against the built-in sample listings the site shows while Firestore has no published listings. Expected during testing; they will never reach a real agent.",
    items: listingRefs.filter(({ d }) => sampleIds.has(d.data.propertyId as string)).map(toItem),
  });
  add({
    check: "auth-no-profile",
    title: "Accounts with no profile document",
    severity: "warning",
    description: "Signed-in pages read users/{uid} for name and phone; these accounts show blanks until a profile is written.",
    items: users
      .filter((u) => !profileIds.has(u.uid))
      .map((u) => ({ id: u.uid, label: u.email ?? u.phoneNumber ?? u.uid, collection: "auth" })),
  });
  add({
    check: "profile-no-auth",
    title: "Profiles with no account",
    severity: "warning",
    description: "A users/{uid} document whose Firebase Auth account was deleted.",
    items: profiles.docs
      .filter((d) => !uids.has(d.id))
      .map((d) => ({ id: d.id, label: String(d.data.email ?? d.id), collection: "users" })),
  });
  const profileRole = new Map(profiles.docs.map((d) => [d.id, String(d.data.role ?? "")]));
  add({
    check: "role-mismatch",
    title: "Role claim and profile role disagree",
    severity: "warning",
    description: "The claim is what the rules enforce; the profile role is only a display mirror. Accounts without a claim are counted as buyer.",
    items: users
      .filter((u) => profileRole.has(u.uid))
      .filter((u) => {
        const claim = typeof u.customClaims?.role === "string" ? (u.customClaims.role as string) : "buyer";
        return profileRole.get(u.uid) !== claim;
      })
      .map((u) => ({
        id: u.uid,
        label: `${u.email ?? u.phoneNumber ?? u.uid}: claim ${String(u.customClaims?.role ?? "none")}, profile ${profileRole.get(u.uid) || "none"}`,
        collection: "auth",
      })),
  });
  const thirtyDaysAgo = Date.now() - 30 * 86_400_000;
  add({
    check: "stale-drafts",
    title: "Drafts untouched for 30 days",
    severity: "info",
    description: "Drafts the owner has not edited in a month.",
    items: properties.docs
      .filter((d) => d.data.status === "Draft" && (toMillis(d.data.updatedAt) ?? toMillis(d.data.createdAt) ?? 0) < thirtyDaysAgo)
      .map((d) => ({ id: d.id, label: String(d.data.title ?? d.id), collection: "properties" })),
  });
  add({
    check: "fingerprint-orphans",
    title: "Photo fingerprints for missing listings",
    severity: "info",
    description: "Duplicate-photo checks still match these hashes even though the listing is gone.",
    items: fingerprints.docs
      .filter((d) => !propertyIds.has(String(d.data.listingId ?? "")))
      .map((d) => ({ id: d.id, label: `listing ${String(d.data.listingId ?? "?")}`, collection: "photo_fingerprints" })),
  });
  add({
    check: "collection-owner",
    title: "Collections whose owner no longer exists",
    severity: "warning",
    description: "Only the owner can read a collection, so these are unreachable.",
    items: collections.docs
      .filter((d) => !uids.has(String(d.data.ownerId ?? "")))
      .map((d) => ({ id: d.id, label: String(d.data.name ?? d.id), collection: "collections" })),
  });
  add({
    check: "no-claim",
    title: "Accounts with no role claim",
    severity: "info",
    description: "They act as buyers. Expected for ordinary sign-ups; listed so a missing staff claim is easy to spot.",
    items: users
      .filter((u) => typeof u.customClaims?.role !== "string")
      .map((u) => ({ id: u.uid, label: u.email ?? u.phoneNumber ?? u.uid, collection: "auth" })),
  });

  return {
    ranAt: new Date().toISOString(),
    findings,
    scanned: {
      accounts: users.length,
      users: profiles.docs.length,
      properties: properties.docs.length,
      physical_properties: physical.docs.length,
      inquiries: inquiries.docs.length,
      applications: applications.docs.length,
      photo_fingerprints: fingerprints.docs.length,
      collections: collections.docs.length,
    },
  };
}

// ---------------------------------------------------------------- users

export const ASSIGNABLE_ROLES = ["buyer", "seller", "agent", "admin", "developer"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export const TEST_ACCOUNT_EMAILS: Record<string, string> = {
  "demo.buyer@dynastyestates-demo.com": "buyer",
  "demo.seller@dynastyestates-demo.com": "seller",
  "demo.agent@dynastyestates-demo.com": "agent",
  "demo.admin@dynastyestates-demo.com": "admin",
};

export async function getUsers() {
  const [users, profiles] = await Promise.all([listAllUsers(), readCollection("users")]);
  const profileById = new Map(profiles.docs.map((d) => [d.id, d.data]));
  return users
    .map((u) => {
      const profile = profileById.get(u.uid);
      return {
        uid: u.uid,
        email: u.email ?? null,
        phone: u.phoneNumber ?? null,
        displayName: u.displayName ?? (profile?.displayName as string | undefined) ?? null,
        role: typeof u.customClaims?.role === "string" ? (u.customClaims.role as string) : null,
        profileRole: (profile?.role as string | undefined) ?? null,
        hasProfile: Boolean(profile),
        providers: u.providerData.map((p) => p.providerId),
        emailVerified: u.emailVerified,
        disabled: u.disabled,
        createdAt: u.metadata.creationTime ? new Date(u.metadata.creationTime).toISOString() : null,
        lastSignInAt: u.metadata.lastSignInTime ? new Date(u.metadata.lastSignInTime).toISOString() : null,
        tokensValidAfter: u.tokensValidAfterTime ? new Date(u.tokensValidAfterTime).toISOString() : null,
        testAccount: Boolean(u.email && TEST_ACCOUNT_EMAILS[u.email]),
        expectedTestRole: (u.email && TEST_ACCOUNT_EMAILS[u.email]) || null,
      };
    })
    .sort((a, b) => (b.lastSignInAt ?? "").localeCompare(a.lastSignInAt ?? ""));
}
