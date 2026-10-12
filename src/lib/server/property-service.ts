import {
  Agency,
  Agent,
  EnrichedListing,
  type ListingLifecycleStatus,
  PhysicalProperty,
  PropertyListing,
} from "@/lib/types/domain";
import {
  fallbackProperties,
  PropertyRecord,
  PropertyType,
} from "@/lib/property-data";

/**
 * Normalizes an address string for deterministic duplicate matching and indexing.
 * Strips punctuation, collapses whitespace, standardizes street suffixes.
 */
export function normalizeAddress(rawAddress: string): string {
  if (!rawAddress) return "";
  return rawAddress
    .toLowerCase()
    .replace(/[.,#\-/\\]/g, " ")
    .replace(/\bstreet\b/g, "st")
    .replace(/\broad\b/g, "rd")
    .replace(/\bavenue\b/g, "ave")
    .replace(/\bdrive\b/g, "dr")
    .replace(/\blane\b/g, "ln")
    .replace(/\bclose\b/g, "cl")
    .replace(/\bextension\b/g, "ext")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Standard agencies operating in Dynasty Estates
 */
export const authoritativeAgencies: Agency[] = [
  {
    id: "agency-prestige",
    name: "Dynasty Prestige Mandates",
    slug: "dynasty-prestige-mandates",
    registrationNumber: "2018/149201/07",
    ffcNumber: "PPRA-F-110294",
    logoUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=200&q=80",
    phone: "+27 12 460 8000",
    email: "prestige@dynastyestates.co.za",
    isVerified: true,
    areasServed: ["Waterkloof", "Pretoria East", "Sandton", "Bryanston"],
  },
  {
    id: "agency-coastal",
    name: "Dynasty Atlantic Seaboard & Coastal",
    slug: "dynasty-atlantic-seaboard",
    registrationNumber: "2020/284910/07",
    ffcNumber: "PPRA-F-229401",
    logoUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=200&q=80",
    phone: "+27 21 438 1200",
    email: "coastal@dynastyestates.co.za",
    isVerified: true,
    areasServed: ["Camps Bay", "Clifton", "Bantry Bay", "V&A Waterfront", "Franschhoek"],
  },
  {
    id: "agency-commercial",
    name: "Dynasty Commercial & Developments",
    slug: "dynasty-commercial-developments",
    registrationNumber: "2019/339481/07",
    ffcNumber: "PPRA-F-338201",
    logoUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=200&q=80",
    phone: "+27 11 884 9000",
    email: "commercial@dynastyestates.co.za",
    isVerified: true,
    areasServed: ["Sandton CBD", "Rosebank", "Waterfall City", "Umhlanga"],
  },
];

/**
 * Standard verified agents
 */
export const authoritativeAgents: Agent[] = [
  {
    id: "agent-sherry",
    agencyId: "agency-prestige",
    name: "Sherry Gallagher",
    email: "sherry.g@dynastyestates.co.za",
    phone: "+27 82 890 1234",
    ffcNumber: "PPRA-2026-781920",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
    bio: "Specializing in prime Pretoria East and diplomatic estates with 14 years experience.",
    isVerified: true,
  },
  {
    id: "agent-marcus",
    agencyId: "agency-coastal",
    name: "Marcus van der Merwe",
    email: "marcus.v@dynastyestates.co.za",
    phone: "+27 83 456 7890",
    ffcNumber: "PPRA-2026-554219",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80",
    bio: "Head of prime Atlantic Seaboard transactions across Camps Bay and Clifton.",
    isVerified: true,
  },
];

/**
 * Converts a legacy PropertyRecord into the authoritative relational domain model:
 * PhysicalProperty + PropertyListing
 */
export function decomposePropertyRecord(record: PropertyRecord): {
  property: PhysicalProperty;
  listing: PropertyListing;
} {
  const suburb = record.suburb || record.location.split(",")[0]?.trim() || "Suburban";
  const city = record.city || record.location.split(",")[1]?.trim() || "Pretoria";
  const province = record.province || record.location.split(",")[2]?.trim() || "Gauteng";

  const streetName = record.title.replace(/Villa|Estate|Penthouse|Apartment|House|Modern|Luxury/gi, "").trim() || "Main Road";
  const fullAddress = `${streetName}, ${suburb}, ${city}, ${province}, South Africa`;
  const normalized = normalizeAddress(fullAddress);

  // Approximate coordinate mapping per city/suburb
  const coordMap: Record<string, { lat: number; lng: number }> = {
    Waterkloof: { lat: -25.7828, lng: 28.2415 },
    "Camps Bay": { lat: -33.9513, lng: 18.3781 },
    Rosebank: { lat: -26.1466, lng: 28.0416 },
    Bryanston: { lat: -26.0567, lng: 28.0245 },
    Umhlanga: { lat: -29.7282, lng: 31.0858 },
    Franschhoek: { lat: -33.9137, lng: 19.1228 },
    Sandton: { lat: -26.1076, lng: 28.0567 },
  };

  const coords = coordMap[suburb] || { lat: -26.1076, lng: 28.0567 };

  // Parse numeric areas
  const floorNum = parseInt(record.area.replace(/[^0-9]/g, ""), 10) || 350;
  const erfNum = record.erfSize ? parseInt(record.erfSize.replace(/[^0-9]/g, ""), 10) : undefined;

  const physicalProperty: PhysicalProperty = {
    id: `phys-${record.id}`,
    normalizedAddress: normalized,
    address: {
      streetName,
      suburb,
      city,
      province,
      country: "South Africa",
      normalizedAddress: normalized,
    },
    coordinates: {
      latitude: coords.lat,
      longitude: coords.lng,
    },
    propertyType: record.type,
    bedrooms: record.beds,
    bathrooms: record.baths,
    parkingSpaces: record.parking,
    floorAreaSqm: floorNum,
    erfSizeSqm: erfNum,
    features: record.features,
    createdAt: "2026-01-15T08:00:00Z",
    updatedAt: "2026-09-10T12:00:00Z",
  };

  const agencyId = record.isDevelopment
    ? "agency-commercial"
    : province === "Western Cape"
      ? "agency-coastal"
      : "agency-prestige";

  const agentId = province === "Western Cape" ? "agent-marcus" : "agent-sherry";

  const propertyListing: PropertyListing = {
    id: record.id,
    slug: record.slug,
    propertyId: physicalProperty.id,
    agencyId,
    agentId,
    transactionType: record.listingType ?? "sale",
    askingPriceZAR: record.numericPrice,
    priceFormatted: record.price,
    rentalPeriod: record.listingType === "rent" ? "monthly" : undefined,
    depositRequiredZAR: record.depositRequired,
    leaseTerm: record.leaseTerm,
    furnishedStatus: record.furnishedStatus,
    monthlyLevyZAR: record.levies,
    ratesAndTaxesZAR: record.ratesAndTaxes,
    title: record.title,
    description: record.description,
    // Demo records carry their own status; fall back to Published so the
    // decomposed listing matches what the catalogue would return.
    status: (record.status as ListingLifecycleStatus | undefined) ?? "Published",
    qualityScore: Math.round((record.rating / 5) * 100),
    isFeatured: record.tag === "Featured" || record.tag === "Premier",
    publishedAt: "2026-01-20T10:00:00Z",
    onShow: record.onShow,
    isDevelopment: record.isDevelopment,
    developmentInfo: record.developmentInfo,
    media: (record.gallery && record.gallery.length > 0 ? record.gallery : [record.image]).map(
      (url, index) => ({
        id: `media-${record.id}-${index}`,
        url,
        mediaType: "photo",
        displayOrder: index,
      })
    ),
    virtualTourUrl: record.virtualTourUrl,
    floorPlanUrl: record.floorPlanImage,
    createdAt: "2026-01-20T10:00:00Z",
    updatedAt: "2026-09-10T12:00:00Z",
  };

  return { property: physicalProperty, listing: propertyListing };
}

/**
 * Re-assembles a PropertyListing and its PhysicalProperty into an EnrichedListing
 */
export function assembleEnrichedListing(
  listing: PropertyListing,
  property: PhysicalProperty
): EnrichedListing {
  const agency = authoritativeAgencies.find((a) => a.id === listing.agencyId);
  const agent = authoritativeAgents.find((a) => a.id === listing.agentId);
  return {
    ...listing,
    property,
    agency,
    agent,
  };
}

/**
 * Converts an EnrichedListing back to the legacy PropertyRecord for 100% backward compatibility
 */
export function enrichedListingToPropertyRecord(enriched: EnrichedListing): PropertyRecord {
  const primaryImage = enriched.media[0]?.url || "";
  const gallery = enriched.media.map((m) => m.url);

  return {
    id: enriched.id,
    slug: enriched.slug,
    title: enriched.title,
    location: `${enriched.property.address.suburb}, ${enriched.property.address.city}, ${enriched.property.address.province}`,
    suburb: enriched.property.address.suburb,
    city: enriched.property.address.city,
    province: enriched.property.address.province,
    price: enriched.priceFormatted,
    numericPrice: enriched.askingPriceZAR,
    type: enriched.property.propertyType as PropertyType,
    listingType: enriched.transactionType,
    leaseTerm: enriched.leaseTerm,
    depositRequired: enriched.depositRequiredZAR,
    furnishedStatus: enriched.furnishedStatus,
    beds: enriched.property.bedrooms,
    baths: enriched.property.bathrooms,
    tag: enriched.isFeatured ? "Featured" : "Verified",
    image: primaryImage,
    category: enriched.isDevelopment ? "Developments" : "Residential",
    description: enriched.description,
    area: `${enriched.property.floorAreaSqm} m²`,
    erfSize: enriched.property.erfSizeSqm ? `${enriched.property.erfSizeSqm} m²` : undefined,
    parking: enriched.property.parkingSpaces,
    rating: (enriched.qualityScore / 100) * 5,
    status: enriched.status,
    gallery,
    features: enriched.property.features,
    onShow: enriched.onShow,
    isDevelopment: enriched.isDevelopment,
    developmentInfo: enriched.developmentInfo,
    floorPlanImage: enriched.floorPlanUrl,
    virtualTourUrl: enriched.virtualTourUrl,
    ratesAndTaxes: enriched.ratesAndTaxesZAR,
    levies: enriched.monthlyLevyZAR,
  };
}

// In-memory cache of enriched listings derived from fallback data
let cachedEnrichedListings: EnrichedListing[] | null = null;

export function getEnrichedListings(): EnrichedListing[] {
  if (cachedEnrichedListings) return cachedEnrichedListings;

  cachedEnrichedListings = fallbackProperties.map((p) => {
    const { property, listing } = decomposePropertyRecord(p);
    return assembleEnrichedListing(listing, property);
  });

  return cachedEnrichedListings;
}

/**
 * Query listings by slug
 */
export async function getEnrichedListingBySlug(slug: string): Promise<EnrichedListing | null> {
  const listings = getEnrichedListings();
  return (
    listings.find(
      (item) => item.slug.toLowerCase() === slug.toLowerCase() || item.id.toLowerCase() === slug.toLowerCase()
    ) || null
  );
}

/**
 * Returns all listings for a physical property
 * Supports multiple agencies advertising the same property!
 */
export function getMultiAgencyListingsForProperty(propertyId: string): EnrichedListing[] {
  const listings = getEnrichedListings();
  return listings.filter((l) => l.propertyId === propertyId);
}

/**
 * Returns listings filtered by location (province and optional city) and transaction type
 * Used for SEO-driven location landing pages!
 */
export function getListingsByLocation({
  province,
  city,
  transactionType,
}: {
  province: string;
  city?: string;
  transactionType?: "sale" | "rent";
}): EnrichedListing[] {
  const listings = getEnrichedListings();
  const normalizedProv = province.toLowerCase().replace(/[-_]/g, " ");
  const normalizedCity = city ? city.toLowerCase().replace(/[-_]/g, " ") : undefined;

  return listings.filter((item) => {
    const matchProv = item.property.address.province.toLowerCase().includes(normalizedProv);
    const matchCity = normalizedCity
      ? item.property.address.city.toLowerCase().includes(normalizedCity)
      : true;
    const matchType = transactionType ? item.transactionType === transactionType : true;

    return matchProv && matchCity && matchType;
  });
}

