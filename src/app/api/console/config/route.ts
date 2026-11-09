import { NextResponse } from "next/server";

import { FEATURE_FLAGS, normalisePlatformConfig, type FeatureFlag } from "@/lib/platform-config";
import { consoleRoute, recordConsoleEvent } from "@/lib/server/console-auth";
import { adminDb } from "@/lib/server/firebase-admin";
import { PLATFORM_CONFIG_DOC, readPlatformConfig } from "@/lib/server/platform-config";

export const dynamic = "force-dynamic";

export const GET = consoleRoute(async () => {
  const { config } = await readPlatformConfig();
  return NextResponse.json({ config, flags: FEATURE_FLAGS });
});

export const PUT = consoleRoute(async (request, caller) => {
  const before = (await readPlatformConfig()).config;
  const next = normalisePlatformConfig(await request.json());
  next.updatedAt = new Date().toISOString();
  next.updatedBy = caller.email ?? caller.uid;
  await adminDb().doc(PLATFORM_CONFIG_DOC).set(next);

  const changes: string[] = [];
  if (before.maintenance.enabled !== next.maintenance.enabled) {
    changes.push(`banner ${next.maintenance.enabled ? "on" : "off"}`);
  } else if (next.maintenance.enabled && before.maintenance.message !== next.maintenance.message) {
    changes.push("banner text");
  }
  for (const key of Object.keys(FEATURE_FLAGS) as FeatureFlag[]) {
    if (before.flags[key] !== next.flags[key]) {
      changes.push(`${FEATURE_FLAGS[key].label} ${next.flags[key] ? "on" : "off"}`);
    }
  }
  await recordConsoleEvent(caller, "config.update", `Site switches: ${changes.join(", ") || "saved with no change"}`, {
    maintenance: next.maintenance,
    flags: next.flags,
  });
  return NextResponse.json({ config: next });
});
