import { NextResponse } from "next/server";

import { consoleRoute } from "@/lib/server/console-auth";
import { getFirebaseStatus } from "@/lib/server/platform-checks";

export const dynamic = "force-dynamic";

export const GET = consoleRoute(async () => NextResponse.json(await getFirebaseStatus()));
