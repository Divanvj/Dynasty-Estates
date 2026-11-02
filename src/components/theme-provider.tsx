"use client";

import React, { createContext, useContext, useEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "dynasty_theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";
/** Lets a theme change in this tab notify subscribers; `storage` only fires cross-tab. */
const THEME_CHANGE_EVENT = "dynasty_theme_change";

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

/**
 * The stored preference, read as an external store rather than mirrored into
 * state from an effect.
 *
 * The previous version initialised to "system" and then called setState inside
 * an effect to correct it, which is a cascading render on every mount and is
 * what React 19's `set-state-in-effect` rule flags. `useSyncExternalStore`
 * exists for exactly this: it renders the server snapshot during hydration and
 * swaps to the client snapshot without a mismatch, so the `mounted` flag the old
 * implementation needed is gone too.
 */
function subscribeStoredTheme(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  };
}

/**
 * Set whenever the theme is changed in this tab, and preferred over storage on
 * read. Without it the theme would be unchangeable wherever localStorage throws
 * — private mode, blocked site data — because the store would keep reading back
 * the old value and the toggle would appear dead.
 */
let sessionTheme: Theme | null = null;

/**
 * Light is the default for anyone who has not chosen, per the Improvement
 * Notes. "system" stays a selectable option — it simply stops being what you
 * get by saying nothing, which previously handed every dark-OS visitor a dark
 * site on their first view.
 *
 * Only the no-preference case changed: a stored "dark" or "system" is returned
 * untouched, so nobody's saved choice is overwritten by this default moving.
 *
 * Keep in step with the pre-paint script in src/app/layout.tsx. The two decide
 * the same thing at different moments, and if they disagree the page paints one
 * theme and then flips to the other.
 */
const DEFAULT_THEME: Theme = "light";

function getStoredTheme(): Theme {
  if (sessionTheme) return sessionTheme;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/** Server and pre-hydration snapshot. Matches the markup React sent. */
function getServerTheme(): Theme {
  return DEFAULT_THEME;
}

function subscribeSystemDark(onChange: () => void) {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getSystemDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches;
}

function getServerSystemDark(): boolean {
  return false;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeStoredTheme, getStoredTheme, getServerTheme);
  const systemPrefersDark = useSyncExternalStore(
    subscribeSystemDark,
    getSystemDark,
    getServerSystemDark,
  );

  // Derived, not stored: there is no second source of truth to keep in step.
  const resolvedTheme: ResolvedTheme =
    theme === "system" ? (systemPrefersDark ? "dark" : "light") : theme;

  /**
   * The one legitimate effect here — writing the resolved theme out to the DOM,
   * which is an external system. It sets no state.
   *
   * It reads the preference live rather than using `resolvedTheme`, which is
   * only the trigger. During hydration `useSyncExternalStore` returns the
   * *server* snapshot, so `resolvedTheme` is DEFAULT_THEME no matter what the
   * visitor chose. Writing that to the DOM stripped the `dark` class the
   * pre-paint script had set, and the store's correction a moment later put it
   * back: a measured 345ms flash of light theme on every load for anyone using
   * dark. Reading the store directly agrees with the pre-paint script, so the
   * first write is a no-op — and unlike a "skip the first run" flag it still
   * behaves under StrictMode's double-invoked effects.
   */
  useEffect(() => {
    const stored = getStoredTheme();
    const effective: ResolvedTheme =
      stored === "system" ? (getSystemDark() ? "dark" : "light") : stored;

    const root = document.documentElement;
    if (effective === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [resolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    sessionTheme = newTheme;
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // Storage unavailable — the choice holds for this session via
      // `sessionTheme` but will not survive a reload.
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
