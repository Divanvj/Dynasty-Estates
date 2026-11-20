"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { authHref, safeReturnPath } from "./return-path";

const URL_CHANGE = "dynasty:urlchange";
let historyWatched = false;

/**
 * Next.js moves between pages (and /search changes its filters) with
 * history.pushState / replaceState, which fire no event. Wrapping them once
 * lets the hooks below re-read the address bar when it changes. Reading it
 * only during render picked up the previous page's address: Next updates the
 * URL after the new page has rendered.
 */
function watchHistory() {
  if (historyWatched || typeof window === "undefined") return;
  historyWatched = true;
  for (const method of ["pushState", "replaceState"] as const) {
    const original = window.history[method].bind(window.history);
    window.history[method] = (...args: Parameters<History["pushState"]>) => {
      original(...args);
      window.dispatchEvent(new Event(URL_CHANGE));
    };
  }
}

function subscribeToUrl(onChange: () => void): () => void {
  watchHistory();
  window.addEventListener(URL_CHANGE, onChange);
  window.addEventListener("popstate", onChange);
  // Once more after this render has settled, by which time Next has written
  // the new URL.
  const settle = window.setTimeout(onChange, 0);
  return () => {
    window.removeEventListener(URL_CHANGE, onChange);
    window.removeEventListener("popstate", onChange);
    window.clearTimeout(settle);
  };
}

/** The current page's query string, read in the browser (empty while rendering on the server). */
function useSearchString(): string {
  return useSyncExternalStore(
    subscribeToUrl,
    () => window.location.search,
    () => "",
  );
}

/** A sign-in (or sign-up) link that returns to the page it is on. */
export function useAuthHref(base: "/auth/login" | "/auth/signup" = "/auth/login"): string {
  const pathname = usePathname();
  const search = useSearchString();
  return authHref(pathname ? `${pathname}${search}` : null, base);
}

/** On /auth pages: the safe `next` from the address bar, or null. */
export function useNextPath(): string | null {
  return safeReturnPath(new URLSearchParams(useSearchString()).get("next"));
}

/** Same as useNextPath, for event handlers (reads the address bar at call time). */
export function readNextPath(): string | null {
  if (typeof window === "undefined") return null;
  return safeReturnPath(new URLSearchParams(window.location.search).get("next"));
}
