import { NextResponse } from "next/server";

import { consoleRoute, recordConsoleEvent } from "@/lib/server/console-auth";
import { runIntegrityScan } from "@/lib/server/console-data";

export const dynamic = "force-dynamic";

/** Read-only scan; it reports problems and changes nothing. */
export const POST = consoleRoute(async (_request, caller) => {
  const result = await runIntegrityScan();
  const problems = result.findings.filter((f) => f.severity !== "info").reduce((n, f) => n + f.items.length, 0);
  await recordConsoleEvent(caller, "integrity.scan", `Ran a data integrity scan: ${problems} problem(s)`, {
    problems,
    checks: result.findings.map((f) => `${f.check}:${f.items.length}`),
  });
  return NextResponse.json(result);
});
