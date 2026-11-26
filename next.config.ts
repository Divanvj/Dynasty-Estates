import { execSync } from "node:child_process";
import type { NextConfig } from "next";

/**
 * Which commit this build is, for the developer console's Deploys page. Vercel
 * sets VERCEL_GIT_COMMIT_SHA when it has git metadata; a local build asks git.
 * "unknown" is reported as such, never guessed.
 */
function buildSha(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA;
  try {
    return execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "unknown";
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_SHA: buildSha(),
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_BUILD_ENV: process.env.VERCEL_ENV ?? (process.env.NODE_ENV === "production" ? "production-build" : "development"),
  },
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
          // Report-only for now (audit item 1.2): browsers log what the policy
          // would block, but block nothing. Switch the key to
          // "Content-Security-Policy" once a preview shows no reports from
          // sign-in, maps, tours and video.
          {
            key: "Content-Security-Policy-Report-Only",
            value: contentSecurityPolicy(),
          },
          // Keeps other sites' windows from scripting this one, while still
          // letting Google's sign-in pop-up report back (Firebase's
          // documented setting for signInWithPopup).
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

/**
 * The Content-Security-Policy (audit findings S2 and S11).
 *
 * script-src keeps 'unsafe-inline' because Next.js writes its page bootstrap as
 * inline scripts; removing it needs per-request nonces, which would make every
 * page dynamic (no 5-minute catalogue cache). The other directives still cut
 * what an injected script could load, frame, connect to or submit to.
 * Sources come from what the site uses: Firebase Auth, Firestore and Storage;
 * Google sign-in and reCAPTCHA (phone sign-in); OpenStreetMap tiles; Unsplash
 * photos; Google Maps, YouTube, Vimeo and Matterport embeds; Vercel's preview
 * toolbar.
 */
function contentSecurityPolicy(): string {
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dynasty-estates.firebaseapp.com";
  const dev = process.env.NODE_ENV !== "production";
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : []), "https://apis.google.com", "https://www.google.com", "https://www.gstatic.com", "https://vercel.live"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https://images.unsplash.com", "https://firebasestorage.googleapis.com", "https://tile.openstreetmap.org", "https://*.tile.openstreetmap.org", "https://*.googleusercontent.com", "https://www.gstatic.com", "https://maps.gstatic.com", "https://vercel.com"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", "https://*.googleapis.com", `https://${authDomain}`, "https://www.google.com", "https://vercel.live", ...(dev ? ["ws:"] : [])],
    "frame-src": ["'self'", `https://${authDomain}`, "https://accounts.google.com", "https://www.google.com", "https://maps.google.com", "https://www.youtube-nocookie.com", "https://www.youtube.com", "https://player.vimeo.com", "https://my.matterport.com", "https://vercel.live"],
    "media-src": ["'self'", "blob:", "https://firebasestorage.googleapis.com"],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'self'"],
  };
  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources.join(" ")}`)
    .join("; ");
}
