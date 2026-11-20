/**
 * Sending people back to the page they were on after they sign in (S1-7).
 *
 * Sign-in links carry the page as `?next=/the/page?with=query`. The sign-in
 * and sign-up pages only follow a path on this site: anything that could
 * leave it (`https://…`, `//host`, `/\host`, a scheme) is ignored, so a
 * crafted link can't use our sign-in page to bounce people to another site.
 * Paths under /auth are ignored too, so nobody lands back on the sign-in page.
 */
export function safeReturnPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const path = raw.trim();
  if (path.length === 0 || path.length > 500) return null;
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return null;
  if (/[\u0000-\u001f\\]/.test(path)) return null;
  // Resolve against a dummy origin: if the result is not on that origin, the
  // path was trying to leave the site.
  let url: URL;
  try {
    url = new URL(path, "https://dynasty.invalid");
  } catch {
    return null;
  }
  if (url.origin !== "https://dynasty.invalid") return null;
  if (url.pathname === "/auth" || url.pathname.startsWith("/auth/")) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

/** `/auth/login?next=…` (or /auth/signup) for a given page. */
export function authHref(page: string | null, base: "/auth/login" | "/auth/signup" = "/auth/login"): string {
  const next = safeReturnPath(page);
  return next && next !== "/" ? `${base}?next=${encodeURIComponent(next)}` : base;
}
