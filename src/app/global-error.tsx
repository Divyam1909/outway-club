"use client";

import { useEffect } from "react";

/**
 * Last line of defence: this replaces the root layout itself, so it runs when
 * the failure happened *before* the navbar, footer or fonts could render.
 *
 * Because it substitutes the layout it must ship its own <html> and <body>,
 * and it cannot rely on globals.css or the font variables being applied — so
 * everything here is inline and self-contained on purpose. It should almost
 * never be seen; when it is, a raw Next.js crash screen is the alternative.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <html lang="en-IN">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1.5rem",
          backgroundColor: "#F6F1E7",
          color: "#1C1B19",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: "34rem", textAlign: "center" }}>
          <p
            style={{
              margin: "0 0 0.75rem",
              fontSize: "0.8125rem",
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#A85C42",
            }}
          >
            Outway Club
          </p>

          <h1 style={{ margin: 0, fontSize: "1.875rem", fontWeight: 600, lineHeight: 1.2 }}>
            The site didn&apos;t load
          </h1>

          <p style={{ margin: "1rem 0 0", fontSize: "0.9375rem", lineHeight: 1.7, color: "#5C5A54" }}>
            Something failed before the page could start. This is on our side — reloading usually
            fixes it. No booking or payment is affected.
          </p>

          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                cursor: "pointer",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: "#1E3D32",
                color: "#FDFBF7",
                padding: "0.75rem 1.75rem",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              Reload the page
            </button>
            <a
              href="/"
              style={{
                borderRadius: "9999px",
                border: "1px solid rgba(28,27,25,0.15)",
                color: "#1C1B19",
                padding: "0.75rem 1.75rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Back to home
            </a>
          </div>

          {error.digest && (
            <p style={{ marginTop: "2rem", fontSize: "0.75rem", color: "#8A8781" }}>
              Reference: <code style={{ fontFamily: "ui-monospace, monospace" }}>{error.digest}</code>
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
