import { NextResponse } from "next/server";

import { buildInfo } from "@/lib/server/platform-checks";

/**
 * Public: which commit this deployment was built from. The repository is public,
 * so the SHA reveals nothing; the console compares it with main to tell whether
 * production is behind.
 */
export function GET() {
  return NextResponse.json(buildInfo(), { headers: { "Cache-Control": "public, s-maxage=60" } });
}
