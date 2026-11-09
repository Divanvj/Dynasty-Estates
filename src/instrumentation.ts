import type { Instrumentation } from "next";

/**
 * Server-side errors (Server Components, route handlers, server actions) into
 * the developer console's error log. Browser errors arrive separately through
 * /api/telemetry/error.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  // firebase-admin needs Node; the edge runtime has nowhere to send this.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { recordError } = await import("@/lib/server/telemetry");
    const err = error instanceof Error ? error : new Error(String(error));
    await recordError({
      source: "server",
      name: err.name,
      message: err.message,
      stack: err.stack,
      digest:
        typeof error === "object" && error !== null && "digest" in error
          ? String((error as { digest: unknown }).digest)
          : undefined,
      route: context.routePath || request.path,
      url: request.path,
      userAgent: typeof request.headers["user-agent"] === "string" ? request.headers["user-agent"] : undefined,
    });
  } catch (reportError) {
    console.error("[telemetry] could not record a server error", reportError);
  }
};
