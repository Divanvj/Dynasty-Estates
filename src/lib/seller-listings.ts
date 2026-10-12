import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { db, isFirebaseConfigured } from "./firebase";
import { addPhotoFingerprints, type ListingPhoto } from "./photo-intake";
import type { ListingLifecycleStatus } from "./types/domain";

// Re-exported for the call sites that already import it from here. The single
// definition lives in ./types/domain — do not redeclare it in this file.
export type { ListingLifecycleStatus };

export type SellerListing = {
  id: string;
  propertyId?: string;
  title: string;
  price: string;
  numericPrice?: number;
  status: ListingLifecycleStatus;
  views: number;
  location?: string;
  type?: string;
  listingType?: "sale" | "rent";
  leaseTerm?: string;
  depositRequired?: string;
  furnishedStatus?: string;
  beds?: number;
  baths?: number;
  erfSizeSqm?: number;
  floorSizeSqm?: number;
  features?: string[];
  qualityScore?: number;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ListingFormData = {
  ownerId: string;
  ownerEmail: string | null;
  title: string;
  location: string;
  suburb?: string;
  city?: string;
  province?: string;
  price: string;
  type: string;
  listingType?: "sale" | "rent";
  leaseTerm?: string;
  depositRequired?: string;
  furnishedStatus?: string;
  beds: number;
  baths: number;
  parking?: number;
  erfSizeSqm?: number;
  floorSizeSqm?: number;
  monthlyLevy?: string;
  ratesAndTaxes?: string;
  features?: string[];
  description: string;
  image: string;
  gallery?: string[];
  /** Checked, uploaded photos; the first is the cover. Supersedes image/gallery. */
  photos?: ListingPhoto[];
  status?: ListingLifecycleStatus;
};

export function calculateListingQualityScore(data: Partial<ListingFormData>): {
  score: number;
  recommendations: string[];
} {
  let score = 0;
  const recommendations: string[] = [];

  if (data.title && data.title.length > 8) score += 15;
  else recommendations.push("Add a descriptive property headline");

  if (data.location && data.location.length > 4) score += 15;
  else recommendations.push("Specify exact suburb and city");

  if (data.price) score += 15;
  else recommendations.push("Provide asking price or rental amount");

  if (data.beds && data.baths) score += 10;
  else recommendations.push("Provide bedroom and bathroom counts");

  if (data.description && data.description.length > 60) score += 20;
  else recommendations.push("Write a comprehensive description (> 60 characters)");

  if (data.image && data.image.startsWith("http")) score += 15;
  else recommendations.push("Upload at least one high-resolution photograph");

  if (data.features && data.features.length >= 3) score += 10;
  else recommendations.push("Select at least 3 amenities (e.g. Solar, Inverter, Security)");

  return { score: Math.min(score, 100), recommendations };
}

export async function getSellerListings(ownerId: string): Promise<SellerListing[]> {
  if (!isFirebaseConfigured || !db) {
    return [];
  }

  const snapshot = await getDocs(query(collection(db, "properties"), where("ownerId", "==", ownerId)));
  return snapshot.docs.map((item) => {
    const data = item.data();
    return {
      id: item.id,
      propertyId: data.propertyId ?? item.id,
      title: data.title ?? "Untitled property",
      price: data.price ?? "Price on request",
      status: (data.status as ListingLifecycleStatus) ?? "Draft",
      views: Number(data.views ?? 0),
      location: data.location ?? "South Africa",
      type: data.type ?? "House",
      listingType: (data.listingType as "sale" | "rent") ?? "sale",
      leaseTerm: data.leaseTerm,
      depositRequired: data.depositRequired,
      furnishedStatus: data.furnishedStatus,
      beds: Number(data.beds ?? 0),
      baths: Number(data.baths ?? 0),
      erfSizeSqm: data.erfSizeSqm ? Number(data.erfSizeSqm) : undefined,
      floorSizeSqm: data.floorSizeSqm ? Number(data.floorSizeSqm) : undefined,
      features: Array.isArray(data.features) ? data.features : [],
      qualityScore: Number(data.qualityScore ?? 75),
      image: data.image ?? "",
    };
  });
}

export async function createSellerListing(formData: ListingFormData): Promise<string> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase database is not configured.");
  }

  const slug = formData.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const photos = formData.photos ?? [];
  const image = photos[0]?.url ?? formData.image;
  const gallery = photos.length > 0 ? photos.map((photo) => photo.url) : formData.gallery ?? (image ? [image] : []);

  const { score: qualityScore } = calculateListingQualityScore({ ...formData, image });
  const status = formData.status ?? "Submitted";
  if (status === "Submitted" && !image) {
    throw new Error("Add at least one photo before submitting for moderation.");
  }

  // Create or associate Physical Property entity reference
  const physicalPropertyRef = await addDoc(collection(db, "physical_properties"), {
    // Carry ownership onto the physical entity too, so security rules can scope
    // it to the person who created it rather than leaving it world-writable.
    ownerId: formData.ownerId,
    erfSizeSqm: formData.erfSizeSqm ?? 0,
    floorSizeSqm: formData.floorSizeSqm ?? 0,
    bedrooms: formData.beds,
    bathrooms: formData.baths,
    parkingSpaces: formData.parking ?? 0,
    propertyType: formData.type,
    location: formData.location,
    city: formData.city ?? "",
    province: formData.province ?? "Gauteng",
    createdAt: serverTimestamp(),
  });

  // Create commercial Listing entity referencing Physical Property. Written in
  // one batch with its photo fingerprints, so a listing can never exist without
  // them (its photos would then escape duplicate detection) or vice versa.
  const listing = doc(collection(db, "properties"));
  const batch = writeBatch(db);
  batch.set(listing, {
    propertyId: physicalPropertyRef.id,
    ownerId: formData.ownerId,
    ownerEmail: formData.ownerEmail,
    title: formData.title,
    slug,
    location: formData.location,
    city: formData.city ?? "",
    province: formData.province ?? "",
    price: formData.price,
    listingType: formData.listingType ?? "sale",
    leaseTerm: formData.leaseTerm ?? "",
    depositRequired: formData.depositRequired ?? "",
    furnishedStatus: formData.furnishedStatus ?? "",
    monthlyLevy: formData.monthlyLevy ?? "",
    ratesAndTaxes: formData.ratesAndTaxes ?? "",
    type: formData.type,
    beds: formData.beds,
    baths: formData.baths,
    parking: formData.parking ?? 0,
    erfSizeSqm: formData.erfSizeSqm ?? 0,
    floorSizeSqm: formData.floorSizeSqm ?? 0,
    features: formData.features ?? [],
    description: formData.description,
    image,
    gallery,
    // What each photo measured when it passed the checks, for moderators.
    photoChecks: photos.map((photo) => ({ url: photo.url, width: photo.width, height: photo.height, ...photo.checks })),
    category: `${formData.type} listing`,
    // `tag` is the marketing label shown on a card; `status` is the lifecycle.
    // These used to be the same string, which is how display labels ended up in
    // the rules' status list.
    tag: status === "Submitted" ? "Under Review" : "New listing",
    area: formData.erfSizeSqm ? `${formData.erfSizeSqm} m²` : "Available on request",
    rating: 5.0,
    qualityScore,
    status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  addPhotoFingerprints(batch, listing.id, formData.ownerId, photos);
  await batch.commit();

  return listing.id;
}

export async function updateListingStatus(listingId: string, status: ListingLifecycleStatus): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase database is not configured.");
  }

  await updateDoc(doc(db, "properties", listingId), {
    status,
    updatedAt: serverTimestamp(),
  });
}
