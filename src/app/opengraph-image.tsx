import { ImageResponse } from "next/og";

/**
 * The default share card.
 *
 * Every page on this site previously emitted an empty `og:image`, so a listing
 * shared to WhatsApp — which is how property circulates in South Africa —
 * arrived as a blank rectangle.
 *
 * Drawn rather than photographed on purpose: the catalogue's imagery is
 * reused stock, and putting a stock interior behind the wordmark would imply
 * it is a Dynasty property. Type on the brand colour claims nothing it cannot
 * back up. A per-listing card, with that listing's own photograph, belongs
 * with real photography (plan §7.3).
 */
export const runtime = "edge";
export const alt = "Dynasty Estates — property for sale and to rent in South Africa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b4d4e",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 26,
              letterSpacing: 10,
              textTransform: "uppercase",
              color: "#9fd6cc",
            }}
          >
            Dynasty
          </div>
          <div style={{ fontSize: 60, fontWeight: 700, color: "#ffffff", marginTop: 4 }}>
            Estates
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 52, lineHeight: 1.15, color: "#ffffff", maxWidth: 900 }}>
            Homes for sale and to rent across South Africa
          </div>
          <div style={{ fontSize: 28, color: "#9fd6cc", marginTop: 20 }}>
            Suburb, price, bedrooms and energy resilience
          </div>
        </div>
      </div>
    ),
    size
  );
}
