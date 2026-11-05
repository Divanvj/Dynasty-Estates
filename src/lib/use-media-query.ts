"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscribe to a CSS media query from React.
 *
 * `useSyncExternalStore` rather than an effect, which is the shape the rest of
 * this app already uses for browser state (`useUserRole`, the theme provider,
 * the three copies of `usePrefersReducedMotion` in the gallery, the card
 * carousel and the home spotlight). It also keeps the value correct through
 * hydration instead of flipping in a second render pass, which is what
 * `react-hooks/set-state-in-effect` exists to prevent.
 *
 * `serverValue` is what the server renders, and the choice matters: pick the
 * value that makes the common path render correctly first, because the other
 * one corrects itself immediately after hydration.
 *
 * Worth extracting the three `usePrefersReducedMotion` copies onto this later;
 * they are byte-identical and all three would become one line.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === "undefined") return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = useCallback(() => serverValue, [serverValue]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Tailwind's `lg`. Below this the mobile app bar and tab bar are in play. */
export const LG_QUERY = "(min-width: 1024px)";
