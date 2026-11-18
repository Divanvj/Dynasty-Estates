import {
  addDoc,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { deleteObject, ref } from "firebase/storage";

import { db, isFirebaseConfigured, storage } from "./firebase";
import { formatListingPrice } from "./formatters";
import { addPhotoFingerprints, type ListingFloorPlan, type ListingPhoto } from "./photo-intake";
import type { ListingLifecycleStatus } from "./types/domain";
import { parseTourUrl } from "./virtual-tour";

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
  /** The moderator's note when a listing is sent back or rejected. */
  moderationFeedback?: string;
  city?: string;
  publishedAt?: string;
  /** Listing-quality facts for the health checklist (Phase B). */
  photoCount?: number;
  hasFloorPlan?: boolean;
  hasTour?: boolean;
  hasShowDay?: boolean;
  descriptionLength?: number;
  /** Agent compliance (PLAN.md F3): the mandate held and when the seller signed the disclosure form. */
  mandateType?: MandateType;
  /** "YYYY-MM-DD", self-attested by the agent; no document is stored. */
  disclosureSignedOn?: string;
};

export type MandateType = "sole" | "open";
export const MANDATE_LABEL: Record<MandateType, string> = { sole: "Sole mandate", open: "Open mandate" };

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
  /** Optional plan attached by the agent; shown as the listing's Floor Plan tab. */
  floorPlan?: ListingFloorPlan;
  /** Optional show day, entered by the agent. */
  onShow?: { isoDate: string; time: string; directionsNote?: string };
  /** Optional Matterport / YouTube / Vimeo link; shown as the listing's tour tab. */
  virtualTourUrl?: string;
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
      price: formatListingPrice(data.price, data.listingType),
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
      createdAt: data.createdAt?.toDate?.()?.toISOString(),
      moderationFeedback: typeof data.moderationFeedback === "string" && data.moderationFeedback ? data.moderationFeedback : undefined,
      // Stored as display text ("R 1 250 000"); the digits are the number.
      numericPrice: Number(String(data.price ?? "").replace(/[^0-9]/g, "")) || undefined,
      city: typeof data.city === "string" ? data.city : undefined,
      publishedAt: data.publishedAt?.toDate?.()?.toISOString(),
      photoCount: Array.isArray(data.gallery) ? data.gallery.length : data.image ? 1 : 0,
      hasFloorPlan: typeof data.floorPlanUrl === "string" && data.floorPlanUrl.length > 0,
      hasTour: typeof data.virtualTourUrl === "string" && data.virtualTourUrl.length > 0,
      hasShowDay: Boolean(data.onShow?.isoDate),
      descriptionLength: typeof data.description === "string" ? data.description.trim().length : 0,
      mandateType: data.mandateType === "sole" || data.mandateType === "open" ? data.mandateType : undefined,
      disclosureSignedOn: typeof data.disclosureSignedOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.disclosureSignedOn) ? data.disclosureSignedOn : undefined,
    };
  });
}

/**
 * Records the agent's mandate on one of their listings (PLAN.md F3). Only
 * these fields and updatedAt change; agents may update listings under the
 * existing properties rule. Nothing about it is public.
 */
export async function setListingMandate(
  listingId: string,
  mandate: { mandateType: MandateType; disclosureSignedOn: string },
): Promise<void> {
  if (!isFirebaseConfigured || !db) throw new Error("Firebase database is not configured.");
  await updateDoc(doc(db, "properties", listingId), {
    mandateType: mandate.mandateType,
    disclosureSignedOn: mandate.disclosureSignedOn,
    updatedAt: serverTimestamp(),
  });
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * The listing fields the owner fills in through the wizard. Shared by create
 * and edit, so an edited listing is stored exactly as a new one would be.
 */
function editableListingFields(formData: ListingFormData, status: ListingLifecycleStatus) {
  const photos = formData.photos ?? [];
  const image = photos[0]?.url ?? formData.image;
  const gallery = photos.length > 0 ? photos.map((photo) => photo.url) : formData.gallery ?? (image ? [image] : []);
  const { score: qualityScore } = calculateListingQualityScore({ ...formData, image });
  return {
    title: formData.title,
    slug: slugify(formData.title),
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
    floorPlanUrl: formData.floorPlan?.url ?? "",
    // Only a link the listing page can actually use is stored.
    virtualTourUrl: parseTourUrl(formData.virtualTourUrl)?.url ?? "",
    onShow: formData.onShow?.isoDate
      ? {
          isoDate: formData.onShow.isoDate,
          time: formData.onShow.time,
          directionsNote: formData.onShow.directionsNote ?? "",
        }
      : null,
    // What each photo measured when it passed the checks, for moderators.
    photoChecks: photos.map((photo) => ({ url: photo.url, width: photo.width, height: photo.height, ...photo.checks })),
    category: `${formData.type} listing`,
    // `tag` is the marketing label shown on a card; `status` is the lifecycle.
    // These used to be the same string, which is how display labels ended up in
    // the rules' status list.
    tag: status === "Submitted" ? "Under Review" : "New listing",
    area: formData.erfSizeSqm ? `${formData.erfSizeSqm} m²` : "Available on request",
    qualityScore,
    status,
  };
}

export async function createSellerListing(formData: ListingFormData): Promise<string> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase database is not configured.");
  }

  const photos = formData.photos ?? [];
  const image = photos[0]?.url ?? formData.image;
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
    // Who a buyer contacts about this listing. The creator is the contact, so
    // it starts as the owner. It only resolves to a callable practitioner once
    // that account is a registered agent — a private seller's listing correctly
    // shows no phone number rather than someone else's.
    agentId: formData.ownerId,
    ...editableListingFields(formData, status),
    rating: 5.0,
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

/** Statuses an owner may no longer edit: the home is gone or the listing is closed. */
export const CLOSED_LISTING_STATUSES: readonly ListingLifecycleStatus[] = ["Sold", "Rented", "Archived"];

export type ListingForEdit = {
  form: ListingFormData;
  status: ListingLifecycleStatus;
  /** The physical_properties document holding the home's specs, if any. */
  physicalPropertyId: string | null;
  /** Photos already saved with fingerprints; only new ones get fingerprinted on save. */
  existingPhotoIds: string[];
  moderationFeedback?: string;
};

function storagePathFromUrl(url: string): string {
  const encoded = url.split("/o/")[1]?.split("?")[0];
  return encoded ? decodeURIComponent(encoded) : "";
}

/**
 * Loads one of the account's own listings back into the wizard's shape.
 * Photos are rebuilt from the gallery, their fingerprints (id + hash) and the
 * measurements stored when they were checked. A photo without a fingerprint
 * (older listings) keeps an empty hash and is simply not re-registered.
 */
export async function loadListingForEdit(listingId: string, uid: string): Promise<ListingForEdit> {
  if (!isFirebaseConfigured || !db) throw new Error("Firebase database is not configured.");
  const snapshot = await getDoc(doc(db, "properties", listingId));
  if (!snapshot.exists()) throw new Error("This listing no longer exists.");
  const data = snapshot.data();
  if (data.ownerId !== uid) throw new Error("This listing isn't one of yours, so you can't edit it.");

  const fingerprints = await getDocs(query(collection(db, "photo_fingerprints"), where("listingId", "==", listingId)));
  const hashById = new Map(fingerprints.docs.map((item) => [item.id, String(item.data().hash ?? "")]));
  const checksByUrl = new Map<string, Record<string, unknown>>(
    (Array.isArray(data.photoChecks) ? data.photoChecks : []).map((check: Record<string, unknown>) => [String(check.url), check]),
  );
  const urls: string[] = Array.isArray(data.gallery) && data.gallery.length ? data.gallery : data.image ? [data.image] : [];
  const existingPhotoIds: string[] = [];
  const photos: ListingPhoto[] = urls.map((url) => {
    const storagePath = storagePathFromUrl(url);
    const fileId = storagePath.split("/").pop()?.replace(/\.jpg$/, "") ?? "";
    const id = fileId || url;
    if (hashById.has(id)) existingPhotoIds.push(id);
    const check = checksByUrl.get(url) ?? {};
    return {
      id,
      url,
      storagePath,
      hash: hashById.get(id) ?? "",
      width: Number(check.width ?? 0),
      height: Number(check.height ?? 0),
      checks: {
        sharpness: Number(check.sharpness ?? 0),
        screenshotScore: Number(check.screenshotScore ?? 0),
        ...(typeof check.cameraMake === "string" ? { cameraMake: check.cameraMake } : {}),
        ...(typeof check.cameraModel === "string" ? { cameraModel: check.cameraModel } : {}),
      },
    };
  });

  // Stored as "Suburb, City, Province"; the suburb has no field of its own.
  const parts = String(data.location ?? "").split(",").map((part) => part.trim()).filter(Boolean);
  const suburb = parts.length >= 3 ? parts[0] : "";
  const floorPlanUrl = typeof data.floorPlanUrl === "string" ? data.floorPlanUrl : "";

  return {
    status: (data.status as ListingLifecycleStatus) ?? "Draft",
    physicalPropertyId: typeof data.propertyId === "string" && data.propertyId ? data.propertyId : null,
    existingPhotoIds,
    moderationFeedback: typeof data.moderationFeedback === "string" && data.moderationFeedback ? data.moderationFeedback : undefined,
    form: {
      ownerId: uid,
      ownerEmail: data.ownerEmail ?? null,
      title: data.title ?? "",
      location: data.location ?? "",
      suburb,
      city: data.city ?? "",
      province: data.province ?? "",
      price: data.price ?? "",
      type: data.type ?? "House",
      listingType: data.listingType === "rent" ? "rent" : "sale",
      leaseTerm: data.leaseTerm || "12 Months",
      depositRequired: data.depositRequired ?? "",
      furnishedStatus: data.furnishedStatus || "Unfurnished",
      beds: Number(data.beds ?? 0),
      baths: Number(data.baths ?? 0),
      parking: Number(data.parking ?? 0),
      erfSizeSqm: data.erfSizeSqm ? Number(data.erfSizeSqm) : undefined,
      floorSizeSqm: data.floorSizeSqm ? Number(data.floorSizeSqm) : undefined,
      monthlyLevy: data.monthlyLevy ?? "",
      ratesAndTaxes: data.ratesAndTaxes ?? "",
      features: Array.isArray(data.features) ? data.features : [],
      description: data.description ?? "",
      image: urls[0] ?? "",
      gallery: [],
      photos,
      floorPlan: floorPlanUrl
        ? {
            url: floorPlanUrl,
            storagePath: storagePathFromUrl(floorPlanUrl),
            contentType: /\.pdf$/i.test(storagePathFromUrl(floorPlanUrl)) ? "application/pdf" : "image/jpeg",
            name: "Current floor plan",
          }
        : undefined,
      onShow: data.onShow?.isoDate
        ? { isoDate: data.onShow.isoDate, time: data.onShow.time ?? "", directionsNote: data.onShow.directionsNote ?? "" }
        : undefined,
      virtualTourUrl: data.virtualTourUrl ?? "",
      status: (data.status as ListingLifecycleStatus) ?? "Draft",
    },
  };
}

/**
 * Saves the owner's edits. The caller picks the resulting status: a private
 * seller's changes go back to moderation (the rules don't let them publish),
 * an agent's or admin's keep the listing's status. Only photos added in this
 * edit get fingerprints; they commit in one batch with the listing.
 */
export async function updateSellerListing(
  listingId: string,
  edit: Pick<ListingForEdit, "physicalPropertyId" | "existingPhotoIds"> & { form?: Pick<ListingFormData, "photos" | "floorPlan"> },
  formData: ListingFormData,
  status: ListingLifecycleStatus,
): Promise<void> {
  if (!isFirebaseConfigured || !db) throw new Error("Firebase database is not configured.");
  const photos = formData.photos ?? [];
  if (status === "Submitted" && photos.length === 0) {
    throw new Error("Add at least one photo before submitting for moderation.");
  }

  const batch = writeBatch(db);
  batch.update(doc(db, "properties", listingId), {
    ...editableListingFields(formData, status),
    // A fresh submission is reviewed on its own merits, not against old notes.
    ...(status === "Submitted" ? { moderationFeedback: deleteField() } : {}),
    updatedAt: serverTimestamp(),
  });
  const known = new Set(edit.existingPhotoIds);
  addPhotoFingerprints(batch, listingId, formData.ownerId, photos.filter((photo) => !known.has(photo.id) && photo.hash));
  await batch.commit();

  // Photos and a floor plan taken off the listing are deleted from storage now
  // that the listing no longer points at them (storage.rules lets the owner).
  // Best effort: the nightly clean-up catches anything left behind.
  if (edit.form && storage) {
    const kept = new Set([...photos.map((p) => p.storagePath), formData.floorPlan?.storagePath].filter(Boolean));
    const removed = [...(edit.form.photos ?? []).map((p) => p.storagePath), edit.form.floorPlan?.storagePath]
      .filter((p): p is string => Boolean(p) && /^(listing-photos|floor-plans)\/[^/]+\/[^/]+$/.test(p as string) && !kept.has(p as string));
    const bucket = storage;
    await Promise.all(
      removed.map((path) =>
        deleteObject(ref(bucket, path)).catch((error) => console.warn("[listing edit] old file not deleted:", path, error)),
      ),
    );
  }

  // The specs are copied onto the physical record as on create. Nothing reads
  // them back yet, so a failure here must not undo the saved edit.
  if (edit.physicalPropertyId) {
    try {
      await updateDoc(doc(db, "physical_properties", edit.physicalPropertyId), {
        erfSizeSqm: formData.erfSizeSqm ?? 0,
        floorSizeSqm: formData.floorSizeSqm ?? 0,
        bedrooms: formData.beds,
        bathrooms: formData.baths,
        parkingSpaces: formData.parking ?? 0,
        propertyType: formData.type,
        location: formData.location,
        city: formData.city ?? "",
        province: formData.province ?? "",
      });
    } catch (error) {
      console.warn("[listing edit] physical property not updated:", error);
    }
  }
}
