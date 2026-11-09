"use client";

import { useEffect } from "react";
import { useReportWebVitals } from "next/web-vitals";

import { reportClientError, telemetrySessionId } from "@/lib/telemetry-client";

type Metric = Parameters<Parameters<typeof useReportWebVitals>[0]>[0];

let queue: Array<Record<string, unknown>> = [];

function flush() {
  if (!queue.length) return;
  const body = JSON.stringify({ metrics: queue.slice(0, 10) });
  queue = [];
  try {
    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/telemetry/vitals", blob)) {
      void fetch("/api/telemetry/vitals", { method: "POST", body, keepalive: true }).catch(() => {});
    }
  } catch {
    // Never let reporting break the page.
  }
}

// A stable function reference, as useReportWebVitals requires, or each render
// re-reports every metric seen so far.
function onMetric(metric: Metric) {
  queue.push({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    navigationType: metric.navigationType,
    route: window.location.pathname,
    sessionId: telemetrySessionId(),
  });
  if (queue.length >= 6) flush();
}

/**
 * Sends uncaught browser errors and real-user page speed to the developer
 * console (/console/errors, /console/performance). Renders nothing.
 */
export default function TelemetryReporter() {
  useReportWebVitals(onMetric);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      // Cross-origin script errors arrive as "Script error." with nothing to act on.
      if (!event.error && /^Script error\.?$/.test(event.message)) return;
      reportClientError({ error: event.error ?? event.message });
    };
    const onRejection = (event: PromiseRejectionEvent) => reportClientError({ error: event.reason });
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  return null;
}
