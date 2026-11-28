"use client";

import { useSyncExternalStore } from "react";

/**
 * The visitor's For Sale / To Rent choice, kept for the browsing session
 * (owner, 26 Nov 2026: choosing For Sale, opening a listing and going back
 * to the catalogue switched it to To Rent).
 *
 * Every For Sale / To Rent switch on the site writes it, and every page that
 * offers the choice starts from it, so the choice follows the visitor:
 * the home hero, the home listings, the catalogue (/search), and the
 * listing page's way back to the catalogue. A link that names an intent
 * (`/search?intent=rent`) still wins; this only fills in when none is given.
 *
 * Session storage, per tab: a preference for this visit, not an account
 * setting. When storage is blocked the site simply uses the default.
 */
export type SearchIntent = "rent" | "buy";

/** For Sale: the platform leads with sales (Improvement Notes). */
export const DEFAULT_SEARCH_INTENT: SearchIntent = "buy";

/** Also fired by the switches themselves, so open pages follow along. */
export const INTENT_EVENT = "dynasty:intent-change";

const INTENT_KEY = "dynasty:intent";
const SEARCH_KEY = "dynasty:last-search";
const SEARCH_EVENT = "dynasty:last-search-change";

export function isSearchIntent(value: unknown): value is SearchIntent {
  return value === "rent" || value === "buy";
}

function read(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Storage blocked (private mode, site data off): the choice lasts this page.
  }
}

export function readIntent(): SearchIntent | null {
  const value = read(INTENT_KEY);
  return isSearchIntent(value) ? value : null;
}

/** Records the choice and tells every open switch on the page. */
export function rememberIntent(intent: SearchIntent) {
  if (readIntent() === intent) return;
  write(INTENT_KEY, intent);
  window.dispatchEvent(new CustomEvent(INTENT_EVENT, { detail: intent }));
}

/** The catalogue's current query string, so "back to the catalogue" restores the filters too. */
export function rememberSearch(query: string) {
  if (read(SEARCH_KEY) === query) return;
  write(SEARCH_KEY, query);
  window.dispatchEvent(new Event(SEARCH_EVENT));
}

function subscribeIntent(onChange: () => void) {
  window.addEventListener(INTENT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(INTENT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * The remembered choice, or null when there is none (and always null on the
 * server and during hydration, so the server HTML and the first client render
 * agree; the remembered value follows on the next render).
 */
export function useRememberedIntent(): SearchIntent | null {
  return useSyncExternalStore(subscribeIntent, readIntent, () => null);
}

function subscribeSearch(onChange: () => void) {
  window.addEventListener(SEARCH_EVENT, onChange);
  return subscribeIntent(onChange);
}

function readLastSearch(): string | null {
  return read(SEARCH_KEY);
}

/**
 * Where "back to the catalogue" goes: the visitor's last catalogue search,
 * filters and all, while it is still on the choice they have now; otherwise
 * the catalogue on their current choice; otherwise on `fallback` (a listing
 * page passes its own listing's type).
 */
export function useCatalogueHref(fallback: SearchIntent): string {
  const intent = useRememberedIntent();
  const last = useSyncExternalStore(subscribeSearch, readLastSearch, () => null);
  const current = intent ?? fallback;
  if (last !== null) {
    const lastIntent = new URLSearchParams(last).get("intent");
    if (lastIntent === current) return `/search?${last}`;
  }
  return `/search?intent=${current}`;
}
