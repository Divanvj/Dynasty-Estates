import { NextResponse } from "next/server";

import { consoleRoute } from "@/lib/server/console-auth";
import { getEventLog } from "@/lib/server/console-data";

export const dynamic = "force-dynamic";

const RANGES: Record<string, number> = { "1h": 3_600_000, "24h": 86_400_000, "7d": 7 * 86_400_000, "30d": 30 * 86_400_000 };

export const GET = consoleRoute(async (request) => {
  const range = new URL(request.url).searchParams.get("range") ?? "24h";
  const span = RANGES[range] ?? RANGES["24h"];
  return NextResponse.json({ range, events: await getEventLog(Date.now() - span) });
});
