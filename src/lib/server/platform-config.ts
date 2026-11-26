// Server code only (audit item 3.2): importing this from a Client Component
// fails the build, so nothing here (keys, Admin SDK) can reach the browser.
import "server-only";

import { normalisePlatformConfig, type PlatformConfig, DEFAULT_PLATFORM_CONFIG } from "@/lib/platform-config";

import { adminApp, adminDb } from "./firebase-admin";

export const PLATFORM_CONFIG_DOC = "platform_config/site";

export async function readPlatformConfig(): Promise<{ config: PlatformConfig; connected: boolean }> {
  if (!adminApp()) return { config: DEFAULT_PLATFORM_CONFIG, connected: false };
  const snapshot = await adminDb().doc(PLATFORM_CONFIG_DOC).get();
  return { config: normalisePlatformConfig(snapshot.data()), connected: true };
}
