/**
 * Dynasty Estates - Authoritative Domain Model
 * 
 * Strict separation between:
 * 1. PhysicalProperty - The enduring physical real-world asset (address, coordinates, erf size, built area)
 * 2. PropertyListing - A commercial advertisement created by an agency/agent for that property
 */

export type PropertyType =
  | "House"
  | "Villa"
  | "Apartment"
  | "Penthouse"
  | "Estate Home"
  | "Townhouse"
  | "Commercial"
  | "Farm"
  | "Smallholding";

export type ListingTransactionType = "sale" | "rent";

/**
 * The one listing lifecycle vocabulary. This used to exist three times — once
 * here in lowercase, once in seller-listings.ts in Title Case, and a third set of
 * display labels inside firestore.rules — which is why an approved listing could
 * never be read by the public. Every write path, the moderation flow and the
 * rules' create/update lists already spoke Title Case, so Title Case won.
 *
 * `status` is lifecycle only. Marketing labels ("Featured", "Open house") belong
 * in a listing's `tag` field and must never appear here.
 */
export type ListingLifecycleStatus =
  | "Draft"
  | "Submitted"
  | "Needs changes"
  | "Approved"
  | "Published"
  | "Under offer"
  | "Sold"
  | "Rented"
  | "Paused"
  | "Archived";

/**
 * Readable by anyone, signed in or not. This array and the `allow read` list in
 * firestore.rules must stay identical — if they drift, the catalogue query is
 * denied and the site silently loses its listings. Sold and Rented stay readable
 * so a listing's page still resolves after the sale, which is also what the
 * property-history work will build on.
 */
export const PUBLIC_LISTING_STATUSES = [
  "Published",
  "Under offer",
  "Sold",
  "Rented",
] as const satisfies readonly ListingLifecycleStatus[];

/** Publicly readable AND still on the market, so shown in search results. */
export const ACTIVE_CATALOGUE_STATUSES = [
  "Published",
  "Under offer",
] as const satisfies readonly ListingLifecycleStatus[];

/** Statuses an owner may set themselves. Publishing is a moderator action. */
export const OWNER_SETTABLE_STATUSES = [
  "Draft",
  "Submitted",
  "Paused",
  "Archived",
] as const satisfies readonly ListingLifecycleStatus[];

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface PhysicalAddress {
  streetNumber?: string;
  streetName: string;
  suburb: string;
  city: string;
  province: string;
  postalCode?: string;
  country: string; // Default: 'South Africa'
  normalizedAddress: string;
}

export interface PhysicalProperty {
  id: string; // Unique UUID
  normalizedAddress: string;
  address: PhysicalAddress;
  coordinates: GeoCoordinates;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  floorAreaSqm: number;
  erfSizeSqm?: number;
  yearBuilt?: number;
  features: string[]; // ['solar_system', 'borehole', 'backup_water', 'security_estate', etc.]
  createdAt: string;
  updatedAt: string;
}

export interface Agency {
  id: string;
  name: string;
  slug: string;
  registrationNumber?: string; // CIPC
  ffcNumber?: string; // PPRA Fidelity Fund Certificate
  logoUrl?: string;
  website?: string;
  phone?: string;
  email?: string;
  isVerified: boolean;
  areasServed: string[];
}

export interface Agent {
  id: string;
  agencyId: string;
  name: string;
  email: string;
  phone: string;
  ffcNumber: string; // PPRA registration
  avatarUrl: string;
  bio?: string;
  isVerified: boolean;
}

export interface ListingMediaItem {
  id: string;
  url: string;
  thumbnailUrl?: string;
  mediaType: "photo" | "floorplan" | "video" | "virtual_tour_360";
  title?: string;
  displayOrder: number;
  perceptualHash?: string; // For duplicate image detection
}

export interface OnShowSchedule {
  date: string;
  time: string; // e.g. "14:00 - 17:00"
  directionsNote?: string;
  contactAgentPhone?: string;
}

export interface DevelopmentSpecs {
  developerName: string;
  phase: string;
  estimatedCompletion: string;
  unitsAvailable: number;
  noTransferDuty: boolean; // VAT inclusive
}

export interface PropertyListing {
  id: string; // Unique Listing ID
  slug: string;
  propertyId: string; // Reference to physical property
  agencyId?: string;
  agentId?: string;
  transactionType: ListingTransactionType; // 'sale' | 'rent'
  askingPriceZAR: number;
  priceFormatted: string; // e.g. "R 4,850,000" or "R 45,000 / month"
  rentalPeriod?: "monthly" | "weekly" | "annual";
  depositRequiredZAR?: number;
  leaseTerm?: string;
  furnishedStatus?: "Unfurnished" | "Semi-Furnished" | "Fully Furnished";
  monthlyLevyZAR?: number;
  ratesAndTaxesZAR?: number;
  title: string;
  description: string;
  status: ListingLifecycleStatus;
  qualityScore: number; // 0 to 100
  isFeatured: boolean;
  publishedAt?: string;
  onShow?: OnShowSchedule;
  isDevelopment?: boolean;
  developmentInfo?: DevelopmentSpecs;
  media: ListingMediaItem[];
  virtualTourUrl?: string;
  floorPlanUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Composite view of a Listing joined with its underlying PhysicalProperty
 * (backward-compatible with existing frontend components)
 */
export interface EnrichedListing extends PropertyListing {
  property: PhysicalProperty;
  agency?: Agency;
  agent?: Agent;
}

