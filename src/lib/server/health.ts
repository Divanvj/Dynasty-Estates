import { adminAuth, adminDb } from "./firebase-admin";
import { REPO } from "./platform-checks";

/**
 * Health probes shared by the console's "Run health check" button
 * (/api/console/health) and the nightly job (/api/cron/nightly).
 */

export type Probe = { id: string; label: string; ok: boolean; ms: number; detail: string };

async function time(id: string, label: string, run: () => Promise<string>): Promise<Probe> {
  const start = performance.now();
  try {
    const detail = await run();
    return { id, label, ok: true, ms: Math.round(performance.now() - start), detail };
  } catch (error) {
    return {
      id,
      label,
      ok: false,
      ms: Math.round(performance.now() - start),
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

async function page(origin: string, path: string) {
  const response = await fetch(`${origin}${path}`, {
    cache: "no-store",
    redirect: "manual",
    signal: AbortSignal.timeout(20000),
  });
  if (response.status >= 400) throw new Error(`HTTP ${response.status}`);
  return `HTTP ${response.status}`;
}

/** Times Firestore, Auth, the key pages of `origin` and GitHub. Never throws. */
export async function runHealthProbes(origin: string): Promise<Probe[]> {
  return Promise.all([
    time("firestore", "Firestore read", async () => {
      await adminDb().doc("platform_config/site").get();
      return "platform_config/site read";
    }),
    time("auth", "Firebase Auth", async () => {
      const result = await adminAuth().listUsers(1);
      return result.users.length ? "users listed" : "no users";
    }),
    time("home", "Home page /", () => page(origin, "/")),
    time("search", "Search /search", () => page(origin, "/search")),
    time("status", "Status API", () => page(origin, "/api/platform/status")),
    time("github", "GitHub API", async () => {
      const response = await fetch(`https://api.github.com/repos/${REPO}`, {
        headers: { "User-Agent": "dynasty-estates-console" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return `HTTP ${response.status}`;
    }),
  ]);
}
