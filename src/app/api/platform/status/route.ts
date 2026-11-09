import { NextResponse } from "next/server";

import { DEFAULT_PLATFORM_CONFIG } from "@/lib/platform-config";
import { readPlatformConfig } from "@/lib/server/platform-config";

/**
 * Public: the maintenance banner and feature switches. Cached for 30 seconds at
 * the edge, so a change made in the console reaches visitors within about that.
 * Falls back to the defaults (everything on, no banner) if Firestore is not
 * reachable, so a console outage can never take features off the site.
 */
export async function GET() {
  let body;
  try {
    const { config } = await readPlatformConfig();
    body = { maintenance: config.maintenance, flags: config.flags };
  } catch {
    body = { maintenance: DEFAULT_PLATFORM_CONFIG.maintenance, flags: DEFAULT_PLATFORM_CONFIG.flags };
  }
  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
}
