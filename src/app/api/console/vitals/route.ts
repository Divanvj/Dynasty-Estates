import { NextResponse } from "next/server";

import { consoleRoute } from "@/lib/server/console-auth";
import { getVitals } from "@/lib/server/console-data";

export const dynamic = "force-dynamic";

export const GET = consoleRoute(async (request) => {
  const days = Math.min(30, Math.max(1, Number(new URL(request.url).searchParams.get("days")) || 7));
  return NextResponse.json(await getVitals(days));
});
