import { NextResponse } from "next/server";

import { allowRequest, clientKey, recordError, type ErrorSource } from "@/lib/server/telemetry";

/**
 * Public: the site's own error reporter posts here (TelemetryReporter, the error
 * boundaries). Validated, size-capped and rate-limited; stored server-side only.
 */
export async function POST(request: Request) {
  if (!allowRequest(`err:${clientKey(request)}`, 30)) {
    return NextResponse.json({ stored: false, reason: "rate-limited" }, { status: 429 });
  }
  const text = await request.text();
  if (text.length > 16_000) return NextResponse.json({ stored: false }, { status: 413 });

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ stored: false }, { status: 400 });
  }
  if (typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ stored: false }, { status: 400 });
  }
  const source: ErrorSource = body.source === "boundary" ? "boundary" : "client";

  try {
    const stored = await recordError({
      source,
      message: body.message,
      name: typeof body.name === "string" ? body.name : undefined,
      stack: typeof body.stack === "string" ? body.stack : undefined,
      digest: typeof body.digest === "string" ? body.digest : undefined,
      route: typeof body.route === "string" ? body.route : undefined,
      url: typeof body.url === "string" ? body.url : undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
      sessionId: typeof body.sessionId === "string" ? body.sessionId : undefined,
      test: body.test === true,
    });
    return NextResponse.json({ stored });
  } catch (error) {
    console.error("[telemetry] error report not stored", error);
    return NextResponse.json({ stored: false }, { status: 500 });
  }
}
