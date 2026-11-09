/**
 * Browser side of the error telemetry (server side: src/lib/server/telemetry.ts).
 * Used by TelemetryReporter and by the error boundaries.
 */

const SESSION_KEY = "dynasty_telemetry_session";
const MAX_REPORTS_PER_PAGE = 10;

let sent = 0;
const seen = new Set<string>();

export function telemetrySessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "no-storage";
  }
}

export type ClientErrorInput = {
  error: unknown;
  source?: "client" | "boundary";
  digest?: string;
  test?: boolean;
};

export function reportClientError({ error, source = "client", digest, test }: ClientErrorInput): void {
  if (typeof window === "undefined") return;
  const err =
    error instanceof Error ? error : new Error(typeof error === "string" ? error : "Non-Error value thrown");
  const key = `${err.name}|${err.message}`;
  // The same error repeating in a render loop is one report, not a flood.
  if (seen.has(key) || sent >= MAX_REPORTS_PER_PAGE) return;
  seen.add(key);
  sent += 1;

  const body = JSON.stringify({
    source,
    name: err.name,
    message: err.message,
    stack: err.stack,
    digest,
    route: window.location.pathname,
    url: window.location.href.split("?")[0],
    sessionId: telemetrySessionId(),
    test: test === true,
  });
  try {
    void fetch("/api/telemetry/error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Reporting must never become a second error.
  }
}
