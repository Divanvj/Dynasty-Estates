import { NextResponse } from "next/server";

import { consoleRoute } from "@/lib/server/console-auth";
import { getOverview, parsePeriod } from "@/lib/server/console-data";

export const dynamic = "force-dynamic";

export const GET = consoleRoute(async (request) => {
  const period = parsePeriod(new URL(request.url).searchParams.get("period"));
  return NextResponse.json(await getOverview(period));
});
