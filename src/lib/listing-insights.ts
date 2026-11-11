import { collection, getDocs, query, where } from "firebase/firestore";

import { db, isFirebaseConfigured } from "./firebase";
import type { SellerListing } from "./seller-listings";
import { ACTIVE_CATALOGUE_STATUSES } from "./types/domain";

/**
 * Two read-only insights for a listing's Performance tab (Phase B):
 * how its asking price sits against real Dynasty listings nearby, and a
 * checklist of what would make it stronger.
 *
 * The comparison reads only live listings stored in Firestore — never the
 * sample homes the public catalogue falls back to — and refuses to compare
 * against fewer than MIN_COMPARABLES homes, so a "median" is never one other
 * listing's price.
 */

export const MIN_COMPARABLES = 5;

export type Comparable = {
  id: string;
  title: string;
  location: string;
  status: string;
  suburb: string;
  city: string;
  listingType: "sale" | "rent";
  type: string;
  price: number;
  floorSizeSqm: number;
};

function norm(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export function suburbOf(location: string | undefined): string {
  return norm((location ?? "").split(",")[0]);
}

/** Every live (published or under offer) listing, for comparisons. */
export async function getLiveComparables(): Promise<Comparable[]> {
  if (!isFirebaseConfigured || !db) return [];
  const snap = await getDocs(query(collection(db, "properties"), where("status", "in", [...ACTIVE_CATALOGUE_STATUSES])));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: String(data.title ?? "Untitled"),
      location: String(data.location ?? ""),
      status: String(data.status ?? ""),
      suburb: suburbOf(String(data.location ?? "")),
      city: norm(data.city ?? String(data.location ?? "").split(",")[1]),
      listingType: data.listingType === "rent" ? "rent" : "sale",
      type: norm(data.type),
      price: Number(String(data.price ?? "").replace(/[^0-9]/g, "")) || 0,
      floorSizeSqm: Number(data.floorSizeSqm ?? 0) || 0,
    };
  });
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

export type AreaComparison =
  | { basis: "none"; reason: string; nearest: number }
  | {
      basis: "suburb" | "city";
      area: string;
      metric: "perSqm" | "price";
      count: number;
      median: number;
      mine: number;
      deltaPct: number;
    };

export function compareWithArea(listing: SellerListing, all: Comparable[]): AreaComparison {
  const price = listing.numericPrice ?? 0;
  if (!price) return { basis: "none", reason: "This listing has no asking price to compare.", nearest: 0 };
  const listingType = listing.listingType ?? "sale";
  const type = norm(listing.type);
  const peers = all.filter((c) => c.id !== listing.id && c.listingType === listingType && c.type === type && c.price > 0);
  const suburb = suburbOf(listing.location);
  const city = norm(listing.city ?? (listing.location ?? "").split(",")[1]);
  const tiers: { basis: "suburb" | "city"; area: string; rows: Comparable[] }[] = [
    { basis: "suburb", area: suburb, rows: suburb ? peers.filter((c) => c.suburb === suburb) : [] },
    { basis: "city", area: city, rows: city ? peers.filter((c) => c.city === city) : [] },
  ];
  const size = listing.floorSizeSqm ?? 0;
  for (const tier of tiers) {
    const sized = tier.rows.filter((c) => c.floorSizeSqm > 0);
    // Per m² wherever the floor size is known: total price compares a flat with a mansion.
    if (size > 0 && sized.length >= MIN_COMPARABLES) {
      const med = median(sized.map((c) => c.price / c.floorSizeSqm));
      const mine = price / size;
      return { basis: tier.basis, area: tier.area, metric: "perSqm", count: sized.length, median: Math.round(med), mine: Math.round(mine), deltaPct: Math.round(((mine - med) / med) * 100) };
    }
    if (tier.rows.length >= MIN_COMPARABLES) {
      const med = median(tier.rows.map((c) => c.price));
      return { basis: tier.basis, area: tier.area, metric: "price", count: tier.rows.length, median: med, mine: price, deltaPct: Math.round(((price - med) / med) * 100) };
    }
  }
  const nearest = Math.max(tiers[0].rows.length, tiers[1].rows.length);
  return {
    basis: "none",
    reason: `Not enough comparable live listings on Dynasty yet: ${nearest} found, ${MIN_COMPARABLES} needed.`,
    nearest,
  };
}

export type HealthItem = { key: string; label: string; done: boolean; tip: string };

/**
 * What makes a listing stronger, from what it already has. There is no edit
 * screen yet, so each tip says what is missing rather than linking somewhere
 * that cannot fix it.
 */
export function listingHealth(listing: SellerListing): HealthItem[] {
  const photos = listing.photoCount ?? 0;
  return [
    { key: "photos", label: "At least 8 photos", done: photos >= 8, tip: `${photos} photo${photos === 1 ? "" : "s"} on the listing.` },
    { key: "size", label: "Floor size given", done: (listing.floorSizeSqm ?? 0) > 0, tip: "Buyers compare homes per m²; without it the price comparison falls back to total price." },
    { key: "description", label: "Description of 300+ characters", done: (listing.descriptionLength ?? 0) >= 300, tip: `${listing.descriptionLength ?? 0} characters now.` },
    { key: "floorplan", label: "Floor plan", done: Boolean(listing.hasFloorPlan), tip: "Shown as its own tab on the listing." },
    { key: "tour", label: "Video or 3D tour link", done: Boolean(listing.hasTour), tip: "Matterport, YouTube or Vimeo." },
    { key: "showday", label: "Show day set", done: Boolean(listing.hasShowDay), tip: "The show day is shown on the listing page." },
  ];
}

/** Whole days since the listing went live (or was filed, if never published). */
export function daysOnMarket(listing: SellerListing, now: number = Date.now()): number | null {
  const from = listing.publishedAt ?? listing.createdAt;
  if (!from) return null;
  return Math.max(0, Math.floor((now - new Date(from).getTime()) / 86_400_000));
}

export type MarketSnapshot = {
  count: number;
  median: number;
  min: number;
  max: number;
  /** Middle half of asking prices; only with 8+ listings. */
  quartiles: { p25: number; p75: number } | null;
  /** Median per m² over the listings that give a floor size, with how many did. */
  perSqm: { median: number; count: number } | null;
};

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo));
}

/** Asking-price figures for a set of live listings (Phase E price snapshot). */
export function marketSnapshot(rows: Comparable[]): MarketSnapshot | null {
  const prices = rows.map((r) => r.price).filter((p) => p > 0).sort((a, b) => a - b);
  if (prices.length === 0) return null;
  const sized = rows.filter((r) => r.price > 0 && r.floorSizeSqm > 0).map((r) => r.price / r.floorSizeSqm).sort((a, b) => a - b);
  return {
    count: prices.length,
    median: quantile(prices, 0.5),
    min: prices[0],
    max: prices[prices.length - 1],
    quartiles: prices.length >= 8 ? { p25: quantile(prices, 0.25), p75: quantile(prices, 0.75) } : null,
    perSqm: sized.length >= MIN_COMPARABLES ? { median: quantile(sized, 0.5), count: sized.length } : null,
  };
}
