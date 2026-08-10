import { ImageResponse } from "@vercel/og";

export const runtime = "nodejs";

// Social card in the Direction A system: off-white ground, ink text, the
// accent reserved for the wordmark's second half. Sans throughout; the old
// card was still Georgia on warm paper.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "Coconut Labs";

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "flex-start",
          background: "#F7F7F5",
          color: "#0B0B0C",
          display: "flex",
          flexDirection: "column",
          fontFamily: "sans-serif",
          height: "100%",
          justifyContent: "space-between",
          padding: 72,
          width: "100%",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, fontWeight: 600, letterSpacing: "-0.02em" }}>
          <span>coconut</span>
          <span style={{ color: "#2440CC" }}>labs</span>
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        <div style={{ color: "#6A6A78", fontFamily: "monospace", fontSize: 22 }}>
          independent inference research · coconutlabs.org
        </div>
      </div>
    ),
    {
      height: 630,
      width: 1200,
    },
  );
}
