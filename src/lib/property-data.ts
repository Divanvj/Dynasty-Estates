import { collection, getDocs, query, where } from "firebase/firestore";
import { showDateLabel } from "./on-show";
import { parseTourUrl } from "./virtual-tour";

import { db, isFirebaseConfigured } from "./firebase";
import { formatListingPrice } from "./formatters";
import { ACTIVE_CATALOGUE_STATUSES, PUBLIC_LISTING_STATUSES } from "./types/domain";
export * from "./types/domain";

export type PropertyType =
  | "House"
  | "Villa"
  | "Apartment"
  | "Penthouse"
  | "Estate Home"
  | "Townhouse";

export type ListingType = "sale" | "rent";

export type PropertyRecord = {
  id: string;
  slug: string;
  /**
   * The practitioner handling this listing. Set explicitly rather than inferred:
   * guessing by area meant a private seller's listing could display a random
   * agency's phone number. An unknown or missing id shows no direct-contact
   * channel at all, which is the correct answer when nobody is assigned.
   */
  agentId?: string;
  /**
   * The account that filed the listing (stored listings only; the sample
   * catalogue has none). Enquiries carry it so the owner can read them in the
   * seller portal.
   */
  ownerId?: string;
  title: string;
  location: string;
  suburb?: string;
  city?: string;
  province?: string;
  price: string;
  numericPrice: number;
  type: PropertyType;
  listingType?: ListingType;
  leaseTerm?: string;
  depositRequired?: number;
  furnishedStatus?: "Unfurnished" | "Semi-Furnished" | "Fully Furnished";
  beds: number;
  baths: number;
  tag: string;
  image: string;
  category: string;
  description: string;
  area: string;
  erfSize?: string;
  parking: number;
  rating: number;
  status: string;
  /**
   * Set when the listing was marked Sold or Rented on Dynasty (lib/sales.ts).
   * `price` only when the seller agreed to show it.
   */
  sale?: { soldOn: string; price?: number };
  /**
   * A made-up home shown so the catalogue is not empty before real listings
   * arrive. Set only in Firestore (`example: true`); the page labels it and
   * offers no way to enquire, since there is nobody to reach.
   */
  example?: boolean;
  gallery: string[];
  features: string[];
  onShow?: {
    /** Display text, e.g. "Sunday, 14 Sep". Not comparable to today. */
    date: string;
    /**
     * `YYYY-MM-DD`. The banner needs this to decide whether the viewing is
     * still ahead; without it the banner does not render, which is deliberate.
     */
    isoDate?: string;
    time: string;
    directionsNote?: string;
  };
  isDevelopment?: boolean;
  developmentInfo?: {
    developerName: string;
    phase: string;
    estimatedCompletion: string;
    unitsAvailable: number;
    noTransferDuty: boolean;
  };
  floorPlanImage?: string;
  virtualTourUrl?: string;
  ratesAndTaxes?: number;
  levies?: number;
};

export const southAfricanProvinces = [
  "All Provinces",
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
];

export const southAfricanCitiesByProvince: Record<string, string[]> = {
  "Eastern Cape": [
    "Bathurst",
    "Bhisho",
    "Cradock",
    "East London",
    "Gqeberha (Port Elizabeth)",
    "Graaff-Reinet",
    "Grahamstown (Makhanda)",
    "Jeffreys Bay",
    "Kenton-on-Sea",
    "Port Alfred",
    "Queenstown (Komani)",
    "St Francis Bay",
    "Summerstrand",
    "Uitenhage (Kariega)",
  ],
  "Free State": [
    "Bethlehem",
    "Bloemfontein",
    "Clarens",
    "Ficksburg",
    "Harrismith",
    "Kroonstad",
    "Parys",
    "Phuthaditjhaba",
    "Sasolburg",
    "Welkom",
    "Woodland Hills",
  ],
  Gauteng: [
    "Alberton",
    "Bedfordview",
    "Benoni",
    "Boksburg",
    "Brakpan",
    "Bryanston",
    "Centurion",
    "Dainfern",
    "Fourways",
    "Germiston",
    "Heidelberg",
    "Johannesburg",
    "Kempton Park",
    "Krugersdorp",
    "Menlyn Maine",
    "Midrand",
    "Morningside",
    "Pretoria",
    "Randburg",
    "Roodepoort",
    "Rosebank",
    "Sandton",
    "Silver Lakes",
    "Soweto",
    "Springs",
    "Vanderbijlpark",
    "Vereeniging",
    "Waterfall City",
    "Waterkloof",
  ],
  "KwaZulu-Natal": [
    "Amanzimtoti",
    "Ballito",
    "Dolphin Coast",
    "Drakensberg",
    "Dundee",
    "Durban",
    "Empangeni",
    "Hillcrest",
    "Howick",
    "Kloof",
    "Kokstad",
    "Ladysmith",
    "Margate",
    "Newcastle",
    "Pietermaritzburg",
    "Pinetown",
    "Port Shepstone",
    "Richards Bay",
    "Salt Rock",
    "Umhlanga",
    "Vryheid",
  ],
  Limpopo: [
    "Bela-Bela (Warmbaths)",
    "Giyani",
    "Hoedspruit",
    "Lephalale (Ellisras)",
    "Louis Trichardt (Makhado)",
    "Mokopane (Potgietersrus)",
    "Musina",
    "Phalaborwa",
    "Polokwane (Pietersburg)",
    "Thabazimbi",
    "Tzaneen",
  ],
  Mpumalanga: [
    "Barberton",
    "Dullstroom",
    "eMalahleni (Witbank)",
    "Graskop",
    "Hazyview",
    "Lydenburg (Mashishing)",
    "Malelane",
    "Mbombela (Nelspruit)",
    "Middelburg",
    "Sabie",
    "Secunda",
    "Standerton",
    "White River",
  ],
  "North West": [
    "Brits",
    "Hartbeespoort",
    "Klerksdorp",
    "Lichtenburg",
    "Mahikeng (Mafikeng)",
    "Orkney",
    "Potchefstroom",
    "Rustenburg",
    "Schweizer-Reneke",
    "Sun City",
    "Vryburg",
    "Zeerust",
  ],
  "Northern Cape": [
    "Calvinia",
    "Colesberg",
    "De Aar",
    "Douglas",
    "Kakamas",
    "Kathu",
    "Kimberley",
    "Kuruman",
    "Port Nolloth",
    "Springbok",
    "Upington",
  ],
  "Western Cape": [
    "Camps Bay",
    "Cape Town",
    "Century City",
    "Ceres",
    "Claremont",
    "Constantia",
    "Franschhoek",
    "George",
    "Hermanus",
    "Knysna",
    "Langebaan",
    "Mossel Bay",
    "Oudtshoorn",
    "Paarl",
    "Plettenberg Bay",
    "Robertson",
    "Saldanha",
    "Sea Point",
    "Somerset West",
    "Stellenbosch",
    "Swellendam",
    "Worcester",
  ],
};

export function matchProvinceName(input: string): string | null {
  if (!input || !input.trim()) return null;
  const clean = input.trim().toLowerCase();
  if (clean === "all" || clean === "all provinces") return null;

  const aliases: Record<string, string> = {
    gp: "Gauteng",
    gauteng: "Gauteng",
    wc: "Western Cape",
    "western cape": "Western Cape",
    "western-cape": "Western Cape",
    kzn: "KwaZulu-Natal",
    "kwazulu-natal": "KwaZulu-Natal",
    "kwazulu natal": "KwaZulu-Natal",
    natal: "KwaZulu-Natal",
    ec: "Eastern Cape",
    "eastern cape": "Eastern Cape",
    "eastern-cape": "Eastern Cape",
    fs: "Free State",
    "free state": "Free State",
    "free-state": "Free State",
    freestate: "Free State",
    lp: "Limpopo",
    limpopo: "Limpopo",
    mp: "Mpumalanga",
    mpumalanga: "Mpumalanga",
    nw: "North West",
    "north west": "North West",
    "north-west": "North West",
    northwest: "North West",
    nc: "Northern Cape",
    "northern cape": "Northern Cape",
    "northern-cape": "Northern Cape",
  };

  if (aliases[clean]) return aliases[clean];

  const standardProvinces = [
    "Gauteng",
    "Western Cape",
    "KwaZulu-Natal",
    "Eastern Cape",
    "Free State",
    "Limpopo",
    "Mpumalanga",
    "North West",
    "Northern Cape",
  ];

  const found = standardProvinces.find(
    (p) => p.toLowerCase() === clean || p.toLowerCase().startsWith(clean) || clean.startsWith(p.toLowerCase())
  );

  return found ?? null;
}

export function getCitiesForProvince(provinceInput: string): string[] {
  const matched = matchProvinceName(provinceInput);
  if (matched && southAfricanCitiesByProvince[matched]) {
    return [...southAfricanCitiesByProvince[matched]].sort((a, b) => a.localeCompare(b));
  }

  // Fallback: If no province is matched or provided, return all major cities in alphabetical order
  const allCities = new Set<string>();
  Object.values(southAfricanCitiesByProvince).forEach((cities) => {
    cities.forEach((c) => allCities.add(c));
  });
  return Array.from(allCities).sort((a, b) => a.localeCompare(b));
}

export const amenityTaxonomy = [
  { id: "solar_system", label: "Solar PV System" },
  { id: "inverter_battery", label: "Inverter & Battery Backup" },
  { id: "security_estate", label: "24h Guarded Security Estate" },
  { id: "braai_area", label: "Built-in Braai & Entertainment Patio" },
  { id: "swimming_pool", label: "Swimming Pool" },
  { id: "borehole", label: "Borehole & Filtration" },
  { id: "water_tanks", label: "JoJo Water Backup Tanks" },
  { id: "garden", label: "Landscaped Garden" },
  { id: "pet_friendly", label: "Pet Friendly" },
  { id: "fibre_ready", label: "High-Speed Fibre Ready" },
  { id: "staff_quarters", label: "Domestic Staff Quarters (SQ)" },
  { id: "flatlet", label: "Separate Self-Contained Flatlet" },
];

// Mirror the public statuses allowed by firestore.rules ("Published", "Under offer", "Sold", "Rented").
// This allows sold and rented listings to resolve their canonical URLs and preserve SEO authority.
const publicStatuses: readonly string[] = PUBLIC_LISTING_STATUSES;

/**
 * The marketing tag to show beside a listing's transaction badge, or null when
 * there is nothing worth showing.
 *
 * A card already states "To Rent" or "For Sale"; a tag repeating it renders the
 * same words twice. That happens because `tag` and `status` were conflated for a
 * long time, so plenty of records carry a tag that is really a transaction
 * label. Guarding at the display layer means it stays fixed regardless of what
 * any individual record holds.
 *
 * Review states are never shown either. A listing is saved with the tag "Under
 * Review" when it is submitted, and approving it changes its status but not
 * its tag, so every approved listing told buyers it was still under review.
 * Where a listing stands in review is its `status`, shown to its owner in
 * their own portal; a public card has nothing to say about it.
 */
const REVIEW_LABELS: ReadonlySet<string> = new Set(["under review", "submitted", "pending review", "needs changes", "draft"]);

export function getDisplayTag(property: Pick<PropertyRecord, "tag" | "listingType">): string | null {
  const tag = property.tag?.trim();
  if (!tag) return null;
  const label = tag.toLowerCase();
  if (REVIEW_LABELS.has(label)) return null;
  const transactionLabel = property.listingType === "rent" ? "to rent" : "for sale";
  return label === transactionLabel ? null : tag;
}

/**
 * Ids and slugs of the twenty sample homes that used to be built into this file
 * and mixed into every catalogue (removed 19 Nov 2026, S1-1). Old enquiries and
 * saved lists can still point at them; the data-integrity scan uses this to
 * report those separately from listings that were deleted.
 */
export const RETIRED_SAMPLE_LISTING_IDS: readonly string[] = [
  "rosebank-vantage", "stellenbosch-cottage", "sandton-skye", "century-city-waterside", "menlyn-maine",
  "ballito-breeze", "midrand-waterfall", "umhlanga-pearl", "harbor-view", "constantia-manor",
  "oak-terrace", "summerstrand-beachfront", "bloemfontein-woodland-hills", "juniper-ridge", "silver-lakes",
  "waterkloof-crest", "simbithi-eco-estate", "crescent-villa", "dainfern-golf-estate", "steenberg-golf-estate",
];

/** Shown for a stored listing that has no photo. A neutral graphic, never a stand-in house. */
export const NO_PHOTO_IMAGE = "/listing-no-photo.png";

export async function getPropertyList(): Promise<PropertyRecord[]> {
  // Only stored listings. The built-in sample homes that used to fill an empty
  // or unconfigured catalogue are gone (S1-1): an empty site now says so.
  if (!isFirebaseConfigured || !db) {
    return [];
  }

  try {
    const propertiesRef = collection(db, "properties");
    const q = query(propertiesRef, where("status", "in", publicStatuses));
    const snapshot = await getDocs(q);

    const firestoreItems: PropertyRecord[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const rawPrice = data.price ?? "0";
      const cleanNum = Number(String(rawPrice).replace(/[^0-9.]/g, "")) || 0;
      const features = Array.isArray(data.features) ? data.features : ["security_estate"];

      return {
        id: docSnap.id,
        slug: data.slug ?? docSnap.id,
        agentId: data.agentId ?? undefined,
        ownerId: typeof data.ownerId === "string" && data.ownerId ? data.ownerId : undefined,
        title: data.title ?? "Untitled property",
        location: data.location ?? "South Africa",
        suburb: data.suburb ?? "",
        city: data.city ?? "Pretoria",
        province: data.province ?? "Gauteng",
        price: formatListingPrice(data.price, data.listingType),
        numericPrice: cleanNum,
        type: (data.type as PropertyType) ?? "House",
        listingType: (data.listingType as "sale" | "rent") ?? "sale",
        leaseTerm: data.leaseTerm,
        depositRequired: data.depositRequired ? Number(data.depositRequired) : undefined,
        furnishedStatus: data.furnishedStatus,
        beds: Number(data.beds ?? 0),
        baths: Number(data.baths ?? 0),
        tag: data.tag ?? "Featured",
        image: typeof data.image === "string" && data.image ? data.image : NO_PHOTO_IMAGE,
        category: data.category ?? "Premium home",
        description: data.description ?? "A beautiful property from Dynasty Estates.",
        area: data.area ?? (data.erfSizeSqm ? `${data.erfSizeSqm} m²` : "Available on request"),
        parking: Number(data.parking ?? 2),
        rating: Number(data.rating ?? 4.8),
        status: data.status ?? "Published",
        sale:
          data.sale && typeof data.sale.soldOn === "string"
            ? { soldOn: data.sale.soldOn, ...(typeof data.sale.price === "number" ? { price: data.sale.price } : {}) }
            : undefined,
        example: data.example === true ? true : undefined,
        gallery: Array.isArray(data.gallery) && data.gallery.length > 0
          ? data.gallery
          : [typeof data.image === "string" && data.image ? data.image : NO_PHOTO_IMAGE],
        features,
        // Attached by the agent in the listing wizard. Absent means the page
        // shows no Floor Plan tab, never a stand-in image.
        floorPlanImage: typeof data.floorPlanUrl === "string" && data.floorPlanUrl ? data.floorPlanUrl : undefined,
        // The agent's tour link from the wizard. Absent means no tour tab.
        virtualTourUrl: typeof data.virtualTourUrl === "string" ? parseTourUrl(data.virtualTourUrl)?.url : undefined,
        // Set by the agent in the listing wizard; only an ISO date can be
        // checked against today, so a show without one is not advertised.
        onShow:
          data.onShow && typeof data.onShow.isoDate === "string" && data.onShow.isoDate
            ? {
                isoDate: data.onShow.isoDate,
                date: showDateLabel(data.onShow.isoDate),
                time: String(data.onShow.time ?? ""),
                directionsNote: data.onShow.directionsNote ? String(data.onShow.directionsNote) : undefined,
              }
            : undefined,
      };
    });

    return firestoreItems;
  } catch (error) {
    // No fallback on error. Returning the old sample catalogue here made a denied
    // or misconfigured query look like a healthy catalogue of twenty listings,
    // which is how the publish-path bug stayed invisible. Demo data is still
    // returned above when Firebase is absent or the collection is genuinely empty.
    console.error("Property catalogue query failed:", error);
    throw new Error("Unable to load the property catalogue.", { cause: error });
  }
}

export async function getPropertyBySlug(slug: string): Promise<PropertyRecord | null> {
  const properties = await getPropertyList();
  return properties.find((property) => property.slug === slug || property.id === slug) ?? null;
}
