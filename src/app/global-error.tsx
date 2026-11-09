"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

import { reportClientError } from "@/lib/telemetry-client";

/**
 * Last resort: an error in the root layout itself. It replaces the whole
 * document, so it carries its own <html> and <body> and cannot rely on the
 * theme or the stylesheet having loaded. Kept deliberately plain.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    reportClientError({ error, source: "boundary", digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#dce4e3",
          color: "#0f172a",
        }}
      >
        <div style={{ maxWidth: 420, padding: 32, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>Dynasty Estates could not load</h1>
          <p style={{ fontSize: 15, lineHeight: 1.5, margin: "0 0 20px", color: "#475569" }}>
            Something went wrong on our side. Nothing you did caused it.
          </p>
          {error.digest ? (
            <p style={{ fontFamily: "monospace", fontSize: 13, color: "#475569" }}>Reference: {error.digest}</p>
          ) : null}
          <button
            type="button"
            onClick={() => retry()}
            style={{
              cursor: "pointer",
              border: 0,
              borderRadius: 999,
              padding: "10px 22px",
              fontSize: 15,
              fontWeight: 700,
              color: "#fff",
              background: "#0b4d4e",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
