import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only: the shared demo is exposed through a cloudflared quick tunnel, so
  // dev asset + HMR requests arrive from a *.trycloudflare.com origin. Without
  // this the client bundle never hydrates over the tunnel and role-gated pages
  // render as an empty skeleton.
  allowedDevOrigins: ["*.trycloudflare.com"],
  // The shared demo link is served by `next dev`, so the on-screen dev badge
  // would show to everyone testing it — and it sits over the mobile nav's first
  // tab. Compile and runtime errors are still surfaced.
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
