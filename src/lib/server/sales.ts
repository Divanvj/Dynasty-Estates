import { FieldValue } from "firebase-admin/firestore";

import { AdminUnavailableError, adminApp, adminAuth, adminDb } from "./firebase-admin";
import {
  DATE_PATTERN,
  median,
  MIN_SALES,
  SALES_MONTHS,
  type PublicSale,
  type SaleInput,
  type SaleKind,
  type SaleRecord,
  type SalesSummary,
} from "@/lib/sales";

/** See lib/sales.ts for what is stored where and why. */

export const SALES = "sales";
const OPEN_STATUSES = ["Published", "Under offer"];
const CLOSED_STATUSES = ["Sold", "Rented"];
const DAY_MS = 86_400_000;

export class SaleError extends Error {
  constructor(
    message: string,
    public status: 400 | 401 | 403 | 404 | 409 | 503,
  ) {
    super(message);
  }
}

type Caller = { uid: string; admin: boolean };

export async function saleCaller(request: Request): Promise<Caller> {
  if (!adminApp()) throw new SaleError("The server isn't connected right now. Try again in a moment.", 503);
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new SaleError("Sign in first.", 401);
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    return { uid: decoded.uid, admin: decoded.role === "admin" };
  } catch (error) {
    if (error instanceof AdminUnavailableError) throw new SaleError("The server isn't connected right now. Try again in a moment.", 503);
    throw new SaleError("Your session has expired. Sign in again.", 401);
  }
}

function sastToday(now = Date.now()): string {
  return new Date(now + 2 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function toIso(value: unknown): string | null {
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === "string" && value ? value : null;
}

function rands(value: unknown): number | null {
  const n = Number(String(value ?? "").replace(/[^0-9]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** "Testvale, Pretoria, Gauteng" → "Testvale" when the listing has no suburb field. */
function suburbOf(data: FirebaseFirestore.DocumentData): string {
  if (typeof data.suburb === "string" && data.suburb.trim()) return data.suburb.trim();
  const parts = String(data.location ?? "").split(",").map((p) => p.trim()).filter(Boolean);
  return parts.length >= 2 && parts[0] !== data.city ? parts[0] : "";
}

function validate(input: unknown): SaleInput {
  const body = (input ?? {}) as Record<string, unknown>;
  const price = typeof body.price === "number" ? Math.round(body.price) : Number(String(body.price ?? "").replace(/[^0-9]/g, ""));
  if (!Number.isFinite(price) || price < 100 || price > 10_000_000_000) throw new SaleError("Enter the price in rand, for example R 2 450 000.", 400);
  const soldOn = typeof body.soldOn === "string" ? body.soldOn : "";
  if (!DATE_PATTERN.test(soldOn) || Number.isNaN(Date.parse(`${soldOn}T12:00:00Z`))) throw new SaleError("Choose the date the offer was accepted.", 400);
  if (soldOn > sastToday()) throw new SaleError("The date can't be in the future.", 400);
  if (soldOn < "2000-01-01") throw new SaleError("Check the date: it is before 2000.", 400);
  return { price, soldOn, pricePublic: body.pricePublic === true };
}

async function ownListing(caller: Caller, listingId: string) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(listingId)) throw new SaleError("Not found.", 404);
  const ref = adminDb().collection("properties").doc(listingId);
  const snap = await ref.get();
  if (!snap.exists) throw new SaleError("This listing no longer exists.", 404);
  const data = snap.data()!;
  if (data.ownerId !== caller.uid && !caller.admin) throw new SaleError("Only the listing's agent or seller can record its sale.", 403);
  return { ref, data };
}

function toRecord(listingId: string, d: FirebaseFirestore.DocumentData): SaleRecord {
  return {
    listingId,
    kind: d.kind === "rental" ? "rental" : "sale",
    price: Number(d.price),
    soldOn: String(d.soldOn),
    pricePublic: d.pricePublic === true,
    askingPrice: typeof d.askingPrice === "number" ? d.askingPrice : null,
    daysOnMarket: typeof d.daysOnMarket === "number" ? d.daysOnMarket : null,
    recordedAt: String(d.recordedAt ?? ""),
  };
}

export async function getSale(caller: Caller, listingId: string): Promise<SaleRecord | null> {
  await ownListing(caller, listingId);
  const snap = await adminDb().collection(SALES).doc(listingId).get();
  return snap.exists ? toRecord(listingId, snap.data()!) : null;
}

/**
 * Marks a live listing Sold (or Rented) and records the sale, or corrects an
 * already recorded one. The listing keeps its asking price; the sale price
 * goes on it only when the seller agreed.
 */
export async function recordSale(caller: Caller, listingId: string, body: unknown): Promise<SaleRecord> {
  const input = validate(body);
  const { ref, data } = await ownListing(caller, listingId);
  const saleRef = adminDb().collection(SALES).doc(listingId);
  const kind: SaleKind = data.listingType === "rent" ? "rental" : "sale";
  const now = new Date().toISOString();

  return adminDb().runTransaction(async (tx) => {
    const [listing, existing] = await Promise.all([tx.get(ref), tx.get(saleRef)]);
    const status = String(listing.data()?.status ?? "");
    if (!existing.exists && !OPEN_STATUSES.includes(status)) {
      throw new SaleError(`Only a live listing can be marked ${kind === "rental" ? "rented" : "sold"}; this one is ${status.toLowerCase() || "not live"}.`, 409);
    }
    if (existing.exists && !CLOSED_STATUSES.includes(status)) {
      throw new SaleError("This listing's status changed since the sale was recorded. Refresh the page.", 409);
    }
    const publishedAt = toIso(data.publishedAt) ?? toIso(data.createdAt);
    const days = publishedAt ? Math.max(0, Math.round((Date.parse(`${input.soldOn}T12:00:00Z`) - Date.parse(publishedAt)) / DAY_MS)) : null;
    const record = {
      listingId,
      kind,
      price: input.price,
      soldOn: input.soldOn,
      pricePublic: input.pricePublic,
      askingPrice: existing.exists ? (existing.data()!.askingPrice ?? null) : rands(data.price),
      daysOnMarket: days,
      // Kept for the area figures, as they were when it sold.
      ownerId: String(data.ownerId ?? ""),
      title: String(data.title ?? ""),
      location: String(data.location ?? ""),
      suburb: suburbOf(data),
      city: String(data.city ?? ""),
      province: String(data.province ?? ""),
      type: String(data.type ?? ""),
      beds: Number(data.beds ?? 0),
      floorSizeSqm: Number(data.floorSizeSqm ?? 0) || null,
      source: "dynasty",
      previousStatus: existing.exists ? (existing.data()!.previousStatus ?? "Published") : status,
      recordedBy: caller.uid,
      recordedAt: existing.exists ? (existing.data()!.recordedAt ?? now) : now,
      ...(existing.exists ? { correctedAt: now } : {}),
    };
    tx.set(saleRef, record);
    tx.update(ref, {
      status: kind === "rental" ? "Rented" : "Sold",
      sale: { soldOn: input.soldOn, ...(input.pricePublic ? { price: input.price } : {}) },
      updatedAt: FieldValue.serverTimestamp(),
    });
    return toRecord(listingId, record);
  });
}

/** "Not sold after all": the listing goes back to the status it had, and the record is removed. */
export async function undoSale(caller: Caller, listingId: string): Promise<{ status: string }> {
  const { ref } = await ownListing(caller, listingId);
  const saleRef = adminDb().collection(SALES).doc(listingId);
  return adminDb().runTransaction(async (tx) => {
    const sale = await tx.get(saleRef);
    if (!sale.exists) throw new SaleError("No sale is recorded on this listing.", 404);
    const previous = OPEN_STATUSES.includes(String(sale.data()!.previousStatus)) ? String(sale.data()!.previousStatus) : "Published";
    tx.delete(saleRef);
    tx.update(ref, { status: previous, sale: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() });
    return { status: previous };
  });
}

const norm = (s: unknown) => String(s ?? "").trim().toLowerCase();

/**
 * Area figures from recorded sales over the last SALES_MONTHS. `area` matches
 * the sale's suburb or city. Anyone may read these: prices that weren't agreed
 * to be shown only ever appear inside a median of MIN_SALES or more.
 */
export async function salesSummary(filter: { kind: SaleKind; area?: string; type?: string; now?: number }): Promise<SalesSummary> {
  const now = filter.now ?? Date.now();
  const since = new Date(now - SALES_MONTHS * 30.44 * DAY_MS).toISOString().slice(0, 10);
  const snap = await adminDb().collection(SALES).where("kind", "==", filter.kind).get();
  const area = norm(filter.area);
  const type = norm(filter.type);
  const rows = snap.docs
    .map((d) => d.data())
    .filter((d) => String(d.soldOn) >= since)
    .filter((d) => !area || norm(d.suburb) === area || norm(d.city) === area)
    .filter((d) => !type || norm(d.type) === type);

  const enough = rows.length >= MIN_SALES;
  const ratios = rows.filter((d) => d.askingPrice > 0).map((d) => d.price / d.askingPrice);
  const days = rows.filter((d) => typeof d.daysOnMarket === "number").map((d) => d.daysOnMarket as number);
  const perSqm = rows.filter((d) => d.floorSizeSqm > 0).map((d) => d.price / d.floorSizeSqm);
  const publicSales: PublicSale[] = rows
    .filter((d) => d.pricePublic === true)
    .sort((a, b) => String(b.soldOn).localeCompare(String(a.soldOn)))
    .slice(0, 20)
    .map((d) => ({
      listingId: String(d.listingId),
      title: String(d.title),
      location: String(d.location),
      type: String(d.type),
      beds: Number(d.beds ?? 0),
      price: Number(d.price),
      soldOn: String(d.soldOn),
    }));

  return {
    kind: filter.kind,
    count: rows.length,
    figures: enough
      ? {
          medianPrice: Math.round(median(rows.map((d) => Number(d.price)))!),
          medianRatio: ratios.length >= MIN_SALES ? median(ratios) : null,
          medianDays: days.length >= MIN_SALES ? Math.round(median(days)!) : null,
          medianPerSqm: perSqm.length >= MIN_SALES ? Math.round(median(perSqm)!) : null,
        }
      : null,
    publicSales,
  };
}
