import { NextResponse } from "next/server";

import { consoleRoute, recordConsoleEvent } from "@/lib/server/console-auth";
import { runHealthProbes } from "@/lib/server/health";

export const dynamic = "force-dynamic";

/**
 * On-demand health check, run against the deployment that serves the console.
 * The same probes run every night from /api/cron/nightly.
 */
export const POST = consoleRoute(async (request, caller) => {
  const origin = new URL(request.url).origin;
  const probes = await runHealthProbes(origin);
  const failed = probes.filter((p) => !p.ok).length;
  await recordConsoleEvent(caller, "health.check", `Health check: ${failed ? `${failed} failed` : "all passed"}`, {
    failed,
    origin,
    probes: probes.map((p) => `${p.id}:${p.ok ? "ok" : "fail"}:${p.ms}ms`),
  });
  return NextResponse.json({ ranAt: new Date().toISOString(), origin, probes });
});
