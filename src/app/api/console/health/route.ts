import { NextResponse } from "next/server";

import { consoleRoute, recordConsoleEvent } from "@/lib/server/console-auth";
import { adminAuth, adminDb } from "@/lib/server/firebase-admin";
import { REPO } from "@/lib/server/platform-checks";

export const dynamic = "force-dynamic";

type Probe = { id: string; label: string; ok: boolean; ms: number; detail: string };

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

/**
 * On-demand health check, run against the deployment that serves the console.
 * Until Blaze (scheduled functions) this is the only uptime check there is.
 */
export const POST = consoleRoute(async (request, caller) => {
  const origin = new URL(request.url).origin;
  const probes = await Promise.all([
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
  const failed = probes.filter((p) => !p.ok).length;
  await recordConsoleEvent(caller, "health.check", `Health check: ${failed ? `${failed} failed` : "all passed"}`, {
    failed,
    origin,
    probes: probes.map((p) => `${p.id}:${p.ok ? "ok" : "fail"}:${p.ms}ms`),
  });
  return NextResponse.json({ ranAt: new Date().toISOString(), origin, probes });
});
