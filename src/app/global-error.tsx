"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary: replaces the root layout when it fails to render, so it
 * must ship its own <html>/<body> and inline styles (no Tailwind, no fonts).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const button: React.CSSProperties = {
    marginTop: 24,
    padding: "12px 26px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#faf9f6",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "#0d0c0b",
          color: "#faf9f6",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <p style={{ fontSize: 40, margin: 0 }}>🎧</p>
          <h1 style={{ margin: "18px 0 10px", fontSize: 22, fontWeight: 600 }}>
            AEVON Music couldn&rsquo;t load
          </h1>
          <p style={{ margin: 0, color: "#a8a29a", fontSize: 14, lineHeight: 1.6 }}>
            Please reload the page. If it keeps happening, try clearing the site
            data for this domain.
          </p>
          {error.digest ? (
            <p
              style={{
                marginTop: 12,
                fontSize: 10,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "rgba(168,162,154,0.65)",
              }}
            >
              Ref {error.digest}
            </p>
          ) : null}
          <button type="button" onClick={reset} style={button}>
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
