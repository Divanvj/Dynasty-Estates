import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only: the shared demo is exposed through a cloudflared quick tunnel, so
  // dev asset + HMR requests arrive from a *.trycloudflare.com origin. Without
  // this the client bundle never hydrates over the tunnel and role-gated pages
  // render as an empty skeleton.
  //
  // The private 192.168.x.x range is here for the same reason: `next dev` binds
  // 0.0.0.0, so a phone on the same Wi-Fi can reach this machine directly, and
  // without the origin allowed it hits the identical symptom — every page
  // returns 200 and then sits there unhydrated, which reads as a broken app
  // rather than a blocked origin. Private range only; this never matches a
  // public address, and `allowedDevOrigins` has no effect on a production build.
  allowedDevOrigins: ["*.trycloudflare.com", "192.168.*.*"],
  // The shared demo link is served by `next dev`, so the on-screen dev badge
  // would show to everyone testing it — and it sits over the mobile nav's first
  // tab. Compile and runtime errors are still surfaced.
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
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
