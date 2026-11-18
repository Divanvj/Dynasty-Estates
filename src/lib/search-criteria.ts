import { matchProvinceName } from "./property-data";

/**
 * The search page's filters as one value, shared by /search (which listings
 * to show) and the saved-search alerts (which new listings to e-mail about),
 * so the two can never disagree about what "matches" means.
 *
 * The URL stays the source of truth on /search: criteriaFromParams reads it,
 * criteriaToParams writes the same keys back.
 */

/** "All" plus every value the filter panel's type options can set. */
export const KNOWN_PROPERTY_TYPES = ["All", "All types", "House", "Villa", "Apartment", "Penthouse", "Estate Home", "Townhouse", "Land"];

export type SearchCriteria = {
  intent: "rent" | "buy";
  /** Comma-separated location tags or keywords; any one may match. */
  q: string;
  province: string;
  city: string;
  type: string;
  beds: string;
  baths: string;
  parking: string;
  furnished: string;
  minPrice: number;
  maxPrice: number;
  features: string[];
  category: string;
};

/** The fields of a listing the filters look at. */
export type SearchableListing = {
  title: string;
  location: string;
  description: string;
  suburb?: string;
  city?: string;
  province?: string;
  features: string[];
  type: string;
  listingType?: string;
  beds: number;
  baths: number;
  parking: number;
  furnishedStatus?: string;
  numericPrice: number;
};

type ParamsLike = { get(name: string): string | null };

export function criteriaFromParams(params: ParamsLike): SearchCriteria {
  const rawProv = params.get("province");
  const rawCity = params.get("city");
  // An unknown value (a hand-edited or old link such as `?type=sale`) used to
  // filter on a type no listing has and silently return zero. It falls back to
  // All, the same as a missing value.
  const rawType = params.get("type") ?? "All";
  const raw = params.get("features");
  return {
    intent: params.get("intent") === "buy" ? "buy" : "rent",
    q: params.get("q") ?? "",
    province: rawProv && rawProv !== "All Provinces" ? rawProv : "",
    city: rawCity && rawCity !== "All Towns" ? rawCity : "",
    type: KNOWN_PROPERTY_TYPES.includes(rawType) ? rawType : "All",
    beds: params.get("beds") ?? "Any",
    baths: params.get("baths") ?? "Any",
    parking: params.get("parking") ?? "Any",
    furnished: params.get("furnished") ?? "Any",
    minPrice: Number(params.get("minPrice") ?? 0) || 0,
    maxPrice: Number(params.get("maxPrice") ?? 0) || 0,
    features: raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [],
    category: params.get("category") ?? "Residential",
  };
}

/** The canonical query string for a set of criteria (no view or sort). */
export function criteriaToParams(c: SearchCriteria): URLSearchParams {
  const params = new URLSearchParams();
  params.set("intent", c.intent);
  if (c.q.trim()) params.set("q", c.q.trim());
  if (c.province) params.set("province", c.province);
  if (c.city) params.set("city", c.city);
  if (c.category && c.category !== "Residential") params.set("category", c.category);
  if (c.type !== "All" && c.type !== "All types") params.set("type", c.type);
  if (c.minPrice > 0) params.set("minPrice", String(c.minPrice));
  if (c.maxPrice > 0) params.set("maxPrice", String(c.maxPrice));
  if (c.beds !== "Any") params.set("beds", c.beds);
  if (c.baths !== "Any") params.set("baths", c.baths);
  if (c.parking !== "Any") params.set("parking", c.parking);
  if (c.furnished !== "Any") params.set("furnished", c.furnished);
  if (c.features.length) params.set("features", c.features.join(","));
  return params;
}

function atLeast(required: string, actual: number): boolean {
  if (required === "Any") return true;
  const n = parseInt(required.replace("+", ""), 10);
  return isNaN(n) || actual >= n;
}

export function matchesCriteria(property: SearchableListing, c: SearchCriteria): boolean {
  // Buy and rent never mix.
  if (c.intent === "buy" && property.listingType === "rent") return false;
  if (c.intent === "rent" && property.listingType !== "rent") return false;

  if (c.q.trim()) {
    const terms = c.q.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const haystack = `${property.title} ${property.location} ${property.description} ${property.suburb ?? ""} ${property.city ?? ""} ${
      property.province ?? ""
    } ${property.features.join(" ")}`.toLowerCase();
    if (!terms.some((term) => haystack.includes(term))) return false;
  }

  if (c.province.trim() && c.province !== "All Provinces") {
    const needle = (matchProvinceName(c.province) || c.province).toLowerCase().trim();
    if (!(property.province?.toLowerCase() ?? "").includes(needle) && !property.location.toLowerCase().includes(needle)) return false;
  }

  if (c.city && c.city !== "All Towns") {
    const needle = c.city.toLowerCase();
    if (
      !(property.city?.toLowerCase() ?? "").includes(needle) &&
      !(property.suburb?.toLowerCase() ?? "").includes(needle) &&
      !property.location.toLowerCase().includes(needle)
    ) {
      return false;
    }
  }

  if (c.type !== "All" && c.type !== "All types" && property.type !== c.type) return false;
  if (!atLeast(c.beds, property.beds)) return false;
  if (!atLeast(c.baths, property.baths)) return false;
  if (!atLeast(c.parking, property.parking)) return false;
  if (c.furnished !== "Any" && property.furnishedStatus !== c.furnished) return false;
  if (c.minPrice > 0 && property.numericPrice < c.minPrice) return false;
  if (c.maxPrice > 0 && property.numericPrice > c.maxPrice) return false;
  if (c.features.length && !c.features.every((f) => property.features.includes(f))) return false;
  return true;
}

/** Whether the criteria narrow the catalogue at all (buy/rent alone does not). */
export function hasNarrowingCriteria(c: SearchCriteria): boolean {
  return (
    Boolean(c.q.trim()) ||
    Boolean(c.province) ||
    Boolean(c.city) ||
    (c.type !== "All" && c.type !== "All types") ||
    c.beds !== "Any" ||
    c.baths !== "Any" ||
    c.parking !== "Any" ||
    c.furnished !== "Any" ||
    c.minPrice > 0 ||
    c.maxPrice > 0 ||
    c.features.length > 0
  );
}

function rand(amount: number): string {
  if (amount >= 1_000_000) return `R${Number((amount / 1_000_000).toFixed(1))}m`;
  return `R${amount.toLocaleString("en-ZA")}`;
}

/** A short name for a saved search: "3+ bed House to buy in Centurion, under R2.5m". */
export function describeCriteria(c: SearchCriteria): string {
  const what = [
    c.beds !== "Any" ? `${c.beds.replace("+", "")}+ bed` : "",
    c.type !== "All" && c.type !== "All types" ? c.type : "Homes",
  ]
    .filter(Boolean)
    .join(" ");
  const where = [c.q.trim(), c.city, c.province].filter(Boolean)[0] ?? "";
  const price =
    c.minPrice > 0 && c.maxPrice > 0
      ? `${rand(c.minPrice)}–${rand(c.maxPrice)}`
      : c.maxPrice > 0
        ? `under ${rand(c.maxPrice)}`
        : c.minPrice > 0
          ? `over ${rand(c.minPrice)}`
          : "";
  return [`${what} ${c.intent === "buy" ? "to buy" : "to rent"}${where ? ` in ${where}` : ""}`, price].filter(Boolean).join(", ").slice(0, 120);
}
