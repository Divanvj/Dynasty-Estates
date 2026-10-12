import type { PropertyRecord } from "./property-data";

export type LatLng = { lat: number; lng: number };

/**
 * Suburb centroids for every suburb in the catalogue. Listings carry no
 * coordinates of their own, which is why the map could only ever show a generic
 * Google search pin rather than the properties themselves.
 */
const SUBURB_COORDS: Record<string, LatLng> = {
  // Gauteng
  rosebank: { lat: -26.1447, lng: 28.0425 },
  sandton: { lat: -26.1076, lng: 28.0567 },
  bryanston: { lat: -26.0525, lng: 28.0186 },
  morningside: { lat: -26.0836, lng: 28.0573 },
  dainfern: { lat: -25.9902, lng: 27.9935 },
  waterfall: { lat: -25.9975, lng: 28.1108 },
  menlyn: { lat: -25.7836, lng: 28.2757 },
  waterkloof: { lat: -25.7869, lng: 28.2294 },
  "silver lakes": { lat: -25.7729, lng: 28.3411 },
  "woodland hills": { lat: -29.1372, lng: 26.2364 }, // Bloemfontein
  // Western Cape
  "camps bay": { lat: -33.9550, lng: 18.3776 },
  claremont: { lat: -33.9840, lng: 18.4650 },
  constantia: { lat: -34.0269, lng: 18.4265 },
  "century city": { lat: -33.8918, lng: 18.5107 },
  stellenbosch: { lat: -33.9321, lng: 18.8602 },
  // KwaZulu-Natal
  umhlanga: { lat: -29.7268, lng: 31.0847 },
  ballito: { lat: -29.5387, lng: 31.2144 },
  // Eastern Cape
  summerstrand: { lat: -33.9857, lng: 25.6640 },
};

/** City fallbacks for listings whose suburb is not in the table above. */
const CITY_COORDS: Record<string, LatLng> = {
  johannesburg: { lat: -26.2041, lng: 28.0473 },
  sandton: { lat: -26.1076, lng: 28.0567 },
  pretoria: { lat: -25.7479, lng: 28.2293 },
  "cape town": { lat: -33.9249, lng: 18.4241 },
  durban: { lat: -29.8587, lng: 31.0218 },
  stellenbosch: { lat: -33.9321, lng: 18.8602 },
  bloemfontein: { lat: -29.0852, lng: 26.1596 },
  "gqeberha": { lat: -33.9608, lng: 25.6022 },
  "port elizabeth": { lat: -33.9608, lng: 25.6022 },
};

const PROVINCE_COORDS: Record<string, LatLng> = {
  gauteng: { lat: -26.2041, lng: 28.0473 },
  "western cape": { lat: -33.9249, lng: 18.4241 },
  "kwazulu-natal": { lat: -29.8587, lng: 31.0218 },
  "eastern cape": { lat: -33.9608, lng: 25.6022 },
  "free state": { lat: -29.0852, lng: 26.1596 },
};

/** Centre of South Africa, used when nothing else matches. */
export const SA_CENTRE: LatLng = { lat: -29.0, lng: 25.0 };

/**
 * Stable pseudo-random offset derived from the listing id, so several homes in
 * one suburb fan out instead of stacking on a single point — and so a given
 * listing lands in the same spot on every render.
 */
function jitter(id: string): LatLng {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const a = ((h >>> 0) % 360) * (Math.PI / 180);
  const r = 0.004 + (((h >>> 9) % 100) / 100) * 0.006; // ~0.4–1.1 km
  return { lat: Math.sin(a) * r, lng: Math.cos(a) * r };
}

export function getPropertyCoordinates(property: PropertyRecord): LatLng {
  const key = (s?: string) => (s ?? "").trim().toLowerCase();

  const base =
    SUBURB_COORDS[key(property.suburb)] ??
    CITY_COORDS[key(property.city)] ??
    SUBURB_COORDS[key(property.location.split(",")[0])] ??
    CITY_COORDS[key(property.location.split(",")[1])] ??
    PROVINCE_COORDS[key(property.province)] ??
    SA_CENTRE;

  const off = jitter(property.id);
  return { lat: base.lat + off.lat, lng: base.lng + off.lng };
}

/** Metro jump targets used by the map's quick-nav pills. */
export const METRO_VIEWS: { label: string; centre: LatLng; zoom: number }[] = [
  { label: "All SA", centre: SA_CENTRE, zoom: 5 },
  { label: "Johannesburg", centre: { lat: -26.1076, lng: 28.0473 }, zoom: 11 },
  { label: "Pretoria", centre: CITY_COORDS.pretoria, zoom: 11 },
  { label: "Cape Town", centre: CITY_COORDS["cape town"], zoom: 11 },
  { label: "Durban", centre: CITY_COORDS.durban, zoom: 10 },
];

/** Compact price for a map marker: "R 2.4m", "R 13.5k/m". */
export function formatMarkerPrice(property: PropertyRecord): string {
  const n = property.numericPrice;
  if (!n) return "POA";
  if (property.listingType === "rent") {
    return n >= 1000 ? `R ${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `R ${n}`;
  }
  if (n >= 1_000_000) return `R ${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}m`;
  if (n >= 1000) return `R ${Math.round(n / 1000)}k`;
  return `R ${n}`;
}

/* -------------------------------------------------------------------------
   Suburb price intelligence
   Portals show "asking price vs area median" on the listing page. Dynasty
   shows it spatially instead: every pin can be read against its own suburb.
------------------------------------------------------------------------- */

export type SuburbStats = { median: number; perSqm: number; count: number };

function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function areaOf(p: PropertyRecord): number {
  const digits = (p.area ?? "").replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

/**
 * Medians are computed per suburb *and* per listing type — mixing a R13k rental
 * into a suburb of R8m sales would make every comparison meaningless.
 */
export type PriceStats = { suburb: Map<string, SuburbStats>; city: Map<string, SuburbStats> };

function group(properties: PropertyRecord[], keyOf: (p: PropertyRecord) => string) {
  const groups = new Map<string, PropertyRecord[]>();
  for (const p of properties) {
    const k = keyOf(p);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(p);
  }
  const out = new Map<string, SuburbStats>();
  for (const [k, list] of groups) {
    const prices = list.map((x) => x.numericPrice).filter(Boolean);
    const rates = list.map((x) => (areaOf(x) ? x.numericPrice / areaOf(x) : 0)).filter(Boolean);
    out.set(k, { median: median(prices), perSqm: Math.round(median(rates)), count: list.length });
  }
  return out;
}

export function suburbKey(p: PropertyRecord): string {
  return `${(p.suburb ?? p.location.split(",")[0] ?? "").trim().toLowerCase()}|${p.listingType ?? "sale"}`;
}

export function cityKey(p: PropertyRecord): string {
  return `${(p.city ?? p.location.split(",")[1] ?? p.province ?? "").trim().toLowerCase()}|${p.listingType ?? "sale"}`;
}

/**
 * Medians per suburb *and* per city, each split by listing type — mixing a
 * R13k rental into a suburb of R8m sales would make every comparison
 * meaningless. Most suburbs here hold a single listing, so the city tier is
 * what makes the comparison usable at all.
 */
export function buildSuburbStats(properties: PropertyRecord[]): PriceStats {
  return {
    suburb: group(properties, suburbKey),
    city: group(properties, cityKey),
  };
}

export type ValueBand = "below" | "par" | "above" | "unknown";

/**
 * How this listing prices against comparable homes nearby. Prefers the suburb
 * and falls back to the city, because a median drawn from one listing is just
 * that listing's own price.
 */
export function getValueBand(
  p: PropertyRecord,
  stats: PriceStats
): {
  band: ValueBand;
  deltaPct: number;
  median: number;
  basis: "suburb" | "city" | "none";
  metric: "rate" | "price";
} {
  const sub = stats.suburb.get(suburbKey(p));
  const cty = stats.city.get(cityKey(p));

  const chosen = sub && sub.count >= 2 ? sub : cty && cty.count >= 2 ? cty : null;
  const basis: "suburb" | "city" | "none" = chosen === sub ? "suburb" : chosen === cty ? "city" : "none";

  if (!chosen || !p.numericPrice) {
    return { band: "unknown", deltaPct: 0, median: 0, basis: "none", metric: "price" };
  }

  // Compare rate per m² wherever floor area is known. Measuring a one-bed flat
  // against a mansion on total price produces true but useless numbers like
  // "-69%"; per-m² normalises for size and is what the portals actually quote.
  const sqm = areaOf(p);
  const useRate = sqm > 0 && chosen.perSqm > 0;
  const mine = useRate ? p.numericPrice / sqm : p.numericPrice;
  const benchmark = useRate ? chosen.perSqm : chosen.median;

  if (!benchmark) {
    return { band: "unknown", deltaPct: 0, median: 0, basis: "none", metric: "price" };
  }

  const deltaPct = Math.round(((mine - benchmark) / benchmark) * 100);
  const band: ValueBand = deltaPct <= -5 ? "below" : deltaPct >= 5 ? "above" : "par";
  return { band, deltaPct, median: benchmark, basis, metric: useRate ? "rate" : "price" };
}

/* ------------------------------ geometry ------------------------------- */

/** Ray-casting point-in-polygon, for the draw-your-own-area search. */
export function pointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    const intersects =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** Load-shedding and water resilience — a South African buying factor. */
export function getResilience(property: PropertyRecord): { solar: boolean; water: boolean } {
  const f = property.features ?? [];
  return {
    solar: f.some((x) => /solar|inverter|battery|generator/.test(x)),
    water: f.some((x) => /borehole|water_tank|water/.test(x)),
  };
}
