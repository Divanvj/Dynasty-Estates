/**
 * The one public origin for this deployment.
 *
 * It was previously hardcoded as `https://dynastyestates.co.za` in robots.ts and
 * sitemap.ts while the site actually serves from Vercel, so canonical URLs,
 * sitemap entries and the robots sitemap pointer all named a host that does not
 * respond. A canonical pointing at an unreachable origin is worse than none:
 * crawlers cannot validate it, and any link built from it 404s for a real user.
 *
 * The default is therefore the host that serves the site today. When the custom
 * domain goes live, set `NEXT_PUBLIC_SITE_URL` in the Vercel project — that is
 * the only change needed, and every canonical, sitemap entry, Open Graph URL and
 * shared WhatsApp link follows it.
 *
 * Trailing slash is stripped so callers can always write `${SITE_URL}/path`.
 */
const FALLBACK_ORIGIN = "https://dynasty-estates.vercel.app";

// Trimmed and length-checked rather than `??`, because an env var declared but
// left blank arrives as "" — and "" ?? fallback is "", which would emit empty
// canonicals and a bare "/property/slug" in shared links.
const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const SITE_URL = (configured && configured.length > 0 ? configured : FALLBACK_ORIGIN).replace(
  /\/+$/,
  "",
);

/** Absolute URL for a path, for canonicals, sitemaps and share links. */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
