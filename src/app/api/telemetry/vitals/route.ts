import { NextResponse } from "next/server";

import { allowRequest, clientKey, recordVitals, type VitalReport } from "@/lib/server/telemetry";

/** Public: real-user page speed from `useReportWebVitals` (TelemetryReporter). */
export async function POST(request: Request) {
  if (!allowRequest(`vit:${clientKey(request)}`, 60)) {
    return NextResponse.json({ stored: 0 }, { status: 429 });
  }
  const text = await request.text();
  if (text.length > 8_000) return NextResponse.json({ stored: 0 }, { status: 413 });
  try {
    const body = JSON.parse(text) as { metrics?: VitalReport[] };
    const stored = await recordVitals(Array.isArray(body.metrics) ? body.metrics : []);
    return NextResponse.json({ stored });
  } catch {
    return NextResponse.json({ stored: 0 }, { status: 400 });
  }
}
