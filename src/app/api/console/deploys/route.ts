import { NextResponse } from "next/server";

import { consoleRoute } from "@/lib/server/console-auth";
import { getDeploys } from "@/lib/server/platform-checks";

export const dynamic = "force-dynamic";

export const GET = consoleRoute(async () => NextResponse.json(await getDeploys()));
