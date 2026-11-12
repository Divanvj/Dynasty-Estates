import { SITE_URL } from "@/lib/site-url";

import { RETIRED_TEST_ACCOUNTS } from "./console-data";
import { adminApp, adminAuth, adminConfigError, adminDb, adminRules, googleApi, PROJECT_ID } from "./firebase-admin";

/*
  Infrastructure checks for the console's Platform, Firebase, Deploys and
  Go-live pages. Each check returns a status plus the evidence, and says
  plainly when it could not run (no token, no permission) instead of guessing.
*/

export const REPO = "Divanvj/Dynasty-Estates";
const VERCEL_PROJECT = process.env.VERCEL_PROJECT_NAME || "dynasty-estates";
const VERCEL_TEAM_SLUG = process.env.VERCEL_TEAM_SLUG || "tricore3";

export type CheckState = "ok" | "warning" | "error" | "blocked" | "unknown";
export type Check = {
  id: string;
  label: string;
  state: CheckState;
  summary: string;
  fix?: string;
  href?: string;
};

// ---------------------------------------------------------------- GitHub

const ghCache = new Map<string, { at: number; value: unknown }>();

async function github<T>(path: string, raw = false): Promise<{ ok: boolean; status: number; data: T | null }> {
  const key = `${raw}:${path}`;
  const hit = ghCache.get(key);
  if (hit && Date.now() - hit.at < 120_000) return hit.value as { ok: boolean; status: number; data: T | null };
  const url = raw ? `https://raw.githubusercontent.com/${REPO}/main/${path}` : `https://api.github.com/repos/${REPO}${path}`;
  const headers: Record<string, string> = { "User-Agent": "dynasty-estates-console" };
  if (!raw) headers.Accept = "application/vnd.github+json";
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  let value: { ok: boolean; status: number; data: T | null };
  try {
    const response = await fetch(url, { headers, cache: "no-store" });
    const data = response.ok ? ((raw ? await response.text() : await response.json()) as T) : null;
    value = { ok: response.ok, status: response.status, data };
  } catch {
    value = { ok: false, status: 0, data: null };
  }
  if (value.ok) ghCache.set(key, { at: Date.now(), value });
  return value;
}

type GhCommit = { sha: string; html_url: string; commit: { message: string; author: { name: string; date: string } } };
type GhRun = { id: number; name: string; status: string; conclusion: string | null; html_url: string; head_sha: string; created_at: string; display_title: string };

export function buildInfo() {
  return {
    sha: process.env.NEXT_PUBLIC_BUILD_SHA ?? "unknown",
    builtAt: process.env.NEXT_PUBLIC_BUILD_TIME ?? null,
    env: process.env.NEXT_PUBLIC_BUILD_ENV ?? "unknown",
  };
}

/** Parses the claims table in WORKING_ON.md. */
function parseClaims(markdown: string | null) {
  if (!markdown) return [];
  const rows = markdown.split("\n").filter((line) => /^\|\s*[^|-]/.test(line));
  return rows
    .slice(1)
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim().replace(/`/g, "")))
    .filter((cells) => cells.length >= 4 && cells[0] && cells[0] !== "Machine")
    .map(([machine, branch, area, since]) => ({ machine, branch, area, since }));
}

async function productionBuild(): Promise<{ sha: string; builtAt: string | null; env: string } | null> {
  try {
    const response = await fetch(`${SITE_URL}/api/platform/build`, { cache: "no-store", signal: AbortSignal.timeout(6000) });
    if (!response.ok) return null;
    return (await response.json()) as { sha: string; builtAt: string | null; env: string };
  } catch {
    return null;
  }
}

async function vercelDeployments() {
  const token = process.env.VERCEL_TOKEN;
  if (!token) return { connected: false as const, deployments: [] };
  try {
    const team = process.env.VERCEL_TEAM_ID ? `teamId=${process.env.VERCEL_TEAM_ID}` : `slug=${VERCEL_TEAM_SLUG}`;
    const response = await fetch(`https://api.vercel.com/v6/deployments?app=${VERCEL_PROJECT}&${team}&limit=8`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return { connected: false as const, deployments: [], error: `Vercel API ${response.status}` };
    const body = (await response.json()) as {
      deployments: Array<{ uid: string; url: string; state: string; target: string | null; created: number; meta?: Record<string, string>; creator?: { username?: string } }>;
    };
    return {
      connected: true as const,
      deployments: body.deployments.map((d) => ({
        id: d.uid,
        url: `https://${d.url}`,
        state: d.state,
        target: d.target ?? "preview",
        createdAt: new Date(d.created).toISOString(),
        sha: d.meta?.githubCommitSha ?? null,
        by: d.creator?.username ?? null,
      })),
    };
  } catch (error) {
    return { connected: false as const, deployments: [], error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getDeploys() {
  const [head, commits, runs, workingOn, production, vercel] = await Promise.all([
    github<GhCommit>("/commits/main"),
    github<GhCommit[]>("/commits?sha=main&per_page=12"),
    github<{ workflow_runs: GhRun[] }>("/actions/runs?branch=main&per_page=6"),
    github<string>("WORKING_ON.md", true),
    productionBuild(),
    vercelDeployments(),
  ]);

  const mainSha = head.data?.sha ?? null;
  const build = buildInfo();

  const behind = async (sha: string | undefined | null) => {
    if (!sha || sha === "unknown" || !mainSha) return null;
    if (sha === mainSha) return 0;
    const compare = await github<{ ahead_by: number; behind_by: number; status: string }>(`/compare/${sha}...main`);
    return compare.data ? compare.data.ahead_by : null;
  };

  const [thisBehind, productionBehind] = await Promise.all([behind(build.sha), behind(production?.sha)]);

  return {
    github: {
      reachable: head.ok,
      rateLimited: head.status === 403 || head.status === 429,
      repo: REPO,
      main: head.data
        ? { sha: head.data.sha, message: head.data.commit.message.split("\n")[0], author: head.data.commit.author.name, date: head.data.commit.author.date, url: head.data.html_url }
        : null,
      commits: (commits.data ?? []).map((c) => ({
        sha: c.sha,
        message: c.commit.message.split("\n")[0],
        author: c.commit.author.name,
        date: c.commit.author.date,
        url: c.html_url,
      })),
      ci: (runs.data?.workflow_runs ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        title: r.display_title,
        status: r.status,
        conclusion: r.conclusion,
        sha: r.head_sha,
        createdAt: r.created_at,
        url: r.html_url,
      })),
      claims: parseClaims(workingOn.data),
    },
    thisBuild: { ...build, commitsBehindMain: thisBehind },
    production: production
      ? { ...production, url: SITE_URL, commitsBehindMain: productionBehind }
      : { url: SITE_URL, sha: null, builtAt: null, env: null, commitsBehindMain: null },
    vercel,
  };
}

// ---------------------------------------------------------------- Firebase

/** Strips comments and whitespace so a comment-only edit is not reported as drift. */
export function normaliseRules(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\s+/g, "");
}

type IndexDef = {
  /** Present in firestore.indexes.json. The REST API omits it; it is in `name`. */
  collectionGroup?: string;
  name?: string;
  queryScope?: string;
  fields: Array<{ fieldPath: string; order?: string; arrayConfig?: string }>;
};

const collectionOf = (i: IndexDef) =>
  i.collectionGroup ?? i.name?.match(/collectionGroups\/([^/]+)\//)?.[1] ?? "unknown";

const indexKey = (i: IndexDef) =>
  `${collectionOf(i)}|${i.queryScope ?? "COLLECTION"}|${i.fields
    .filter((f) => f.fieldPath !== "__name__")
    .map((f) => `${f.fieldPath}:${f.order ?? f.arrayConfig}`)
    .join(",")}`;

export const KNOWN_COLLECTIONS = [
  "users",
  "properties",
  "physical_properties",
  "inquiries",
  "applications",
  "support_requests",
  "collections",
  "audit_logs",
  "photo_fingerprints",
  "listing_stats",
  "practitioners",
  "agencies",
  "agency_members",
  "agency_invites",
  "app_errors",
  "app_error_groups",
  "web_vitals",
  "console_events",
  "platform_config",
] as const;

export async function getFirebaseStatus() {
  const connected = Boolean(adminApp());
  if (!connected) {
    return { connected, error: adminConfigError(), projectId: PROJECT_ID } as const;
  }

  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${PROJECT_ID}.firebasestorage.app`;

  const [deployedRules, repoRules, deployedIndexes, repoIndexes, authConfig, storage, monitoring, sizes, deployedStorageRules, repoStorageRules] = await Promise.all([
    adminRules()
      .getFirestoreRuleset()
      .then((r) => ({ source: r.source[0]?.content ?? "", name: r.name, createTime: r.createTime, error: null as string | null }))
      .catch((e: Error) => ({ source: null, name: null, createTime: null, error: e.message })),
    github<string>("firestore.rules", true),
    googleApi<{ indexes?: Array<IndexDef & { name: string; state: string }> }>(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/collectionGroups/-/indexes`,
    ),
    github<string>("firestore.indexes.json", true),
    googleApi<{
      authorizedDomains?: string[];
      signIn?: { email?: { enabled?: boolean }; phoneNumber?: { enabled?: boolean }; anonymous?: { enabled?: boolean } };
    }>(`https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config`),
    googleApi(`https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}`),
    googleApi(
      `https://monitoring.googleapis.com/v3/projects/${PROJECT_ID}/metricDescriptors?filter=${encodeURIComponent('metric.type = starts_with("firestore.googleapis.com/document/read")')}`,
    ),
    Promise.all(
      KNOWN_COLLECTIONS.map(async (name) => {
        try {
          return { name, count: (await adminDb().collection(name).count().get()).data().count };
        } catch {
          return { name, count: null };
        }
      }),
    ),
    adminRules()
      .getStorageRuleset(bucket)
      .then((r) => ({ source: r.source[0]?.content ?? "", createTime: r.createTime, error: null as string | null }))
      .catch((e: Error) => ({ source: null, createTime: null, error: e.message })),
    github<string>("storage.rules", true),
  ]);

  const google = await googleApi<{ defaultSupportedIdpConfigs?: Array<{ name?: string; enabled?: boolean }> }>(
    `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/defaultSupportedIdpConfigs`,
  );

  let rulesState: CheckState = "unknown";
  if (deployedRules.source && repoRules.data) {
    rulesState = normaliseRules(deployedRules.source) === normaliseRules(repoRules.data) ? "ok" : "warning";
  }

  let repoIndexList: IndexDef[] = [];
  try {
    repoIndexList = repoIndexes.data ? ((JSON.parse(repoIndexes.data) as { indexes: IndexDef[] }).indexes ?? []) : [];
  } catch {
    repoIndexList = [];
  }
  const deployedIndexList = deployedIndexes.data?.indexes ?? [];
  const deployedKeys = new Set(deployedIndexList.map(indexKey));
  const repoKeys = new Set(repoIndexList.map(indexKey));

  const domains = authConfig.data?.authorizedDomains ?? [];
  const siteHost = new URL(SITE_URL).hostname;

  return {
    connected,
    projectId: PROJECT_ID,
    rules: {
      state: rulesState,
      deployedAt: deployedRules.createTime,
      rulesetName: deployedRules.name,
      error: deployedRules.error ?? (repoRules.ok ? null : "Could not read firestore.rules from GitHub main."),
      deployedLength: deployedRules.source?.length ?? null,
      repoLength: repoRules.data?.length ?? null,
    },
    indexes: {
      state: (deployedIndexes.ok && repoIndexes.ok
        ? repoIndexList.every((i) => deployedKeys.has(indexKey(i)))
          ? "ok"
          : "warning"
        : "unknown") as CheckState,
      error: deployedIndexes.error,
      deployed: deployedIndexList.map((i) => ({ key: indexKey(i), state: i.state, inRepo: repoKeys.has(indexKey(i)) })),
      // Only claim an index is missing when the deployed list was actually read.
      missing: deployedIndexes.ok ? repoIndexList.filter((i) => !deployedKeys.has(indexKey(i))).map(indexKey) : [],
    },
    auth: {
      error: authConfig.error,
      providers: {
        email: authConfig.data?.signIn?.email?.enabled === true,
        phone: authConfig.data?.signIn?.phoneNumber?.enabled === true,
        anonymous: authConfig.data?.signIn?.anonymous?.enabled === true,
        google: (google.data?.defaultSupportedIdpConfigs ?? []).some((c) => c.name?.endsWith("/google.com") && c.enabled),
      },
      authorizedDomains: domains,
      siteHost,
      siteHostAuthorized: domains.includes(siteHost),
      tunnelDomains: domains.filter((d) => d.endsWith(".trycloudflare.com")),
    },
    storage: {
      bucket,
      state: (storage.ok ? "ok" : storage.status === 404 ? "blocked" : "unknown") as CheckState,
      error: storage.ok ? null : storage.error,
      rules: {
        state: (deployedStorageRules.source && repoStorageRules.data
          ? normaliseRules(deployedStorageRules.source) === normaliseRules(repoStorageRules.data)
            ? "ok"
            : "warning"
          : "unknown") as CheckState,
        deployedAt: deployedStorageRules.createTime,
        error: deployedStorageRules.error ?? (repoStorageRules.ok ? null : "Could not read storage.rules from GitHub main."),
      },
    },
    monitoring: {
      state: (monitoring.ok ? "ok" : monitoring.status === 403 ? "blocked" : "unknown") as CheckState,
      error: monitoring.ok ? null : monitoring.error,
    },
    collections: sizes,
  };
}

// ---------------------------------------------------------------- Go-live

/** Which of the retired shared test logins could still sign in. Null if Auth could not be read. */
async function retiredTestAccountsStatus(): Promise<{ active: string[] } | null> {
  if (!adminApp()) return null;
  try {
    const { users } = await adminAuth().getUsers(Object.keys(RETIRED_TEST_ACCOUNTS).map((email) => ({ email })));
    return { active: users.filter((u) => !u.disabled).map((u) => u.email ?? u.uid) };
  } catch {
    return null;
  }
}

/** Written by /api/cron/nightly after every run. */
export const NIGHTLY_DOC = "platform_config/nightly";
type NightlyRun = { lastRunAt: string; ok: boolean; failures: string[]; summary: string };

async function lastNightlyRun(): Promise<NightlyRun | null | "unknown"> {
  if (!adminApp()) return "unknown";
  try {
    const snap = await adminDb().doc(NIGHTLY_DOC).get();
    return snap.exists ? (snap.data() as NightlyRun) : null;
  } catch {
    return "unknown";
  }
}

export async function getGoLiveChecks(): Promise<Check[]> {
  const [firebase, deploys, retired, nightly] = await Promise.all([
    getFirebaseStatus(),
    getDeploys(),
    retiredTestAccountsStatus(),
    lastNightlyRun(),
  ]);
  const checks: Check[] = [];

  if (!firebase.connected) {
    checks.push({
      id: "admin-sdk",
      label: "Console connected to Firebase",
      state: "error",
      summary: firebase.error ?? "No service-account key.",
      fix: "Add FIREBASE_SERVICE_ACCOUNT (the key JSON) to the Vercel project's environment variables and redeploy.",
    });
    return checks;
  }

  checks.push({ id: "admin-sdk", label: "Console connected to Firebase", state: "ok", summary: `Admin SDK reads project ${firebase.projectId}.` });

  checks.push({
    id: "blaze",
    label: "Blaze plan and Cloud Storage",
    state: firebase.storage.state === "ok" ? "ok" : firebase.storage.state === "blocked" ? "blocked" : "unknown",
    summary:
      firebase.storage.state === "ok"
        ? `Bucket ${firebase.storage.bucket} exists.`
        : firebase.storage.state === "blocked"
          ? `Bucket ${firebase.storage.bucket} does not exist. Listing photos cannot upload, so listings can only be saved as drafts.`
          : `Could not check the bucket: ${firebase.storage.error ?? "unknown error"}.`,
    fix: "Upgrade the Firebase project to Blaze, create the default bucket, then deploy storage.rules.",
    href: `https://console.firebase.google.com/project/${firebase.projectId}/usage/details`,
  });

  if (firebase.storage.state === "ok") {
    const storageRules = firebase.storage.rules;
    checks.push({
      id: "storage-rules",
      label: "Storage rules match main",
      state: storageRules.state,
      summary:
        storageRules.state === "ok"
          ? "Deployed Storage rules match storage.rules on main (comments ignored)."
          : storageRules.state === "warning"
            ? `The bucket's rules differ from storage.rules on main, so photo uploads may be refused. Deployed ${storageRules.deployedAt ?? "at an unknown time"}.`
            : (storageRules.error ?? "Could not compare."),
      fix: "Deploy from a scratch copy of origin/main: npx.cmd firebase-tools deploy --only storage --project dynasty-estates",
      href: "/console/firebase",
    });
  }

  checks.push({
    id: "rules",
    label: "Firestore rules match main",
    state: firebase.rules.state,
    summary:
      firebase.rules.state === "ok"
        ? `Deployed ruleset matches firestore.rules on main (comments ignored).`
        : firebase.rules.state === "warning"
          ? `The deployed rules differ from firestore.rules on main. Deployed ${firebase.rules.deployedAt ?? "at an unknown time"}.`
          : (firebase.rules.error ?? "Could not compare."),
    fix: "Deploy the rules from a scratch copy of origin/main: npx.cmd firebase-tools deploy --only firestore:rules --project dynasty-estates",
    href: "/console/firebase",
  });

  checks.push({
    id: "indexes",
    label: "Firestore indexes deployed",
    state: firebase.indexes.state,
    summary:
      firebase.indexes.state === "ok"
        ? `All ${firebase.indexes.deployed.length} composite indexes in firestore.indexes.json are deployed.`
        : firebase.indexes.missing.length
          ? `${firebase.indexes.missing.length} index(es) in the repo are not deployed: ${firebase.indexes.missing.join("; ")}`
          : (firebase.indexes.error ?? "Could not compare."),
    fix: "npx.cmd firebase-tools deploy --only firestore:indexes --project dynasty-estates",
    href: "/console/firebase",
  });

  checks.push({
    id: "domain",
    label: "Production domain can sign in",
    state: firebase.auth.error ? "unknown" : firebase.auth.siteHostAuthorized ? "ok" : "error",
    summary: firebase.auth.error
      ? `Could not read the auth config: ${firebase.auth.error}`
      : firebase.auth.siteHostAuthorized
        ? `${firebase.auth.siteHost} is an authorised domain.`
        : `${firebase.auth.siteHost} is not in Firebase authorised domains, so Google and phone sign-in fail there.`,
    fix: "Add the domain under Authentication → Settings → Authorised domains.",
  });

  const behind = deploys.production.commitsBehindMain;
  checks.push({
    id: "production-current",
    label: "Production runs the latest main",
    state: deploys.production.sha === null ? "unknown" : behind === 0 ? "ok" : behind === null ? "unknown" : "warning",
    summary:
      deploys.production.sha === null
        ? `${deploys.production.url} does not report its build yet (it predates the console), so its commit is unknown.`
        : behind === 0
          ? `Production is on ${deploys.production.sha.slice(0, 7)}, the head of main.`
          : behind === null
            ? `Production is on ${deploys.production.sha.slice(0, 7)}; could not compare with main.`
            : `Production is ${behind} commit(s) behind main.`,
    fix: "Vercel is not git-connected. Deploy manually: npx --yes vercel@65.2.0 deploy --prod --yes",
    href: "/console/deploys",
  });

  const ci = deploys.github.ci[0];
  checks.push({
    id: "ci",
    label: "CI green on main",
    state: !ci ? "unknown" : ci.status !== "completed" ? "unknown" : ci.conclusion === "success" ? "ok" : "error",
    summary: !ci
      ? "No CI runs found (or GitHub could not be reached)."
      : ci.status !== "completed"
        ? `Latest run is ${ci.status}.`
        : `Latest run on main: ${ci.conclusion} (${ci.title}).`,
    href: ci?.url,
  });

  checks.push({
    id: "test-accounts",
    label: "Old test accounts disabled",
    state: retired === null ? "unknown" : retired.active.length ? "error" : "ok",
    summary:
      retired === null
        ? "Could not read the accounts."
        : retired.active.length
          ? `${retired.active.join(", ")} can still sign in, and their passwords are in the public repo's git history.`
          : "The four demo.*@dynastyestates-demo.com accounts are disabled or gone. Testing uses developer accounts that switch role.",
    fix: "Disable them on the Users page (or Firebase console → Authentication). Their passwords stay in git history, so do not re-enable them.",
  });

  checks.push({
    id: "monitoring",
    label: "Firestore usage metrics",
    state: firebase.monitoring.state === "ok" ? "ok" : "blocked",
    summary:
      firebase.monitoring.state === "ok"
        ? "Cloud Monitoring is readable."
        : "The service account cannot read Cloud Monitoring (403), so read/write usage charts are unavailable.",
    fix: "In Google Cloud IAM, grant the firebase-adminsdk service account the Monitoring Viewer role. Does not need Blaze.",
  });

  const staleMs = 26 * 60 * 60 * 1000;
  checks.push({
    id: "scheduled",
    label: "Nightly jobs ran",
    state:
      nightly === "unknown"
        ? "unknown"
        : !nightly
          ? "error"
          : Date.now() - Date.parse(nightly.lastRunAt) > staleMs
            ? "error"
            : nightly.ok
              ? "ok"
              : "warning",
    summary:
      nightly === "unknown"
        ? "Could not read the last nightly run."
        : !nightly
          ? "The nightly jobs (health check, integrity scan, stats clean-up) have never run. Vercel Cron calls /api/cron/nightly at 02:00 SAST, and the route refuses every call until CRON_SECRET is set."
          : `Last run ${nightly.lastRunAt}: ${nightly.summary}.${Date.now() - Date.parse(nightly.lastRunAt) > staleMs ? " That is more than a day ago." : ""} Results are in the event log. No alert e-mails yet: that needs an e-mail provider.`,
    fix: "In Vercel → dynasty-estates → Settings → Environment Variables, add CRON_SECRET (a random value of 16+ characters) for Production, then redeploy. Check Vercel → Cron Jobs for failed runs.",
    href: "/console/events",
  });

  return checks;
}
