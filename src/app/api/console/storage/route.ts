import { NextResponse } from "next/server";

import { consoleRoute } from "@/lib/server/console-auth";
import { cleanUpListingFiles } from "@/lib/server/storage-cleanup";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * What tonight's file clean-up would delete (storage-cleanup.ts), without
 * deleting anything: unused listing files past the grace period, and stale
 * photo fingerprints.
 */
export const GET = consoleRoute(async () => NextResponse.json({ dryRun: true, ...(await cleanUpListingFiles({ dryRun: true })) }));
