// Storage security-rule tests (audit item 1.6).
//
// Runs against the Storage emulator, which loads ./storage.rules from
// firebase.json:
//
//   npm run test:storage-rules
//
// Nothing here touches the live project: the "demo-" project id keeps the
// emulator offline. Each check says whether the rules should allow or refuse
// one request, made as a particular person.
import { initializeApp } from "firebase/app";
import {
  connectStorageEmulator,
  deleteObject,
  getBytes,
  getMetadata,
  getStorage,
  list,
  listAll,
  ref,
  uploadBytes,
} from "firebase/storage";

const PROJECT = process.env.GCLOUD_PROJECT || "demo-dynasty-rules";
const BUCKET = `${PROJECT}.appspot.com`;
// "localhost" (what emulators:exec sets) resolves to IPv6 first in Node on
// Windows, where the emulator is not listening.
const [HOST, PORT] = (process.env.FIREBASE_STORAGE_EMULATOR_HOST || "127.0.0.1:9199").replace(/^localhost:/, "127.0.0.1:").split(":");
const TIMEOUT_MS = 10000;

let appCount = 0;
/** A Storage client signed in as `uid` with these custom claims, or signed out when `uid` is null. */
function as(uid, claims = {}) {
  const app = initializeApp({ projectId: PROJECT, apiKey: "test", storageBucket: BUCKET }, `storage-rules-${appCount++}`);
  const storage = getStorage(app);
  connectStorageEmulator(storage, HOST, Number(PORT), uid ? { mockUserToken: { sub: uid, user_id: uid, ...claims } } : undefined);
  return storage;
}

const results = [];

async function attempt(fn) {
  try {
    await Promise.race([
      fn(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timed out")), TIMEOUT_MS)),
    ]);
    return { allowed: true };
  } catch (error) {
    const code = String(error?.code ?? error);
    if (code !== "storage/unauthorized") return { allowed: false, unexpected: `${code}: ${error?.message ?? ""}` };
    return { allowed: false };
  }
}

/** The rules should allow (`true`) or refuse (`false`) this. */
async function check(label, shouldAllow, fn) {
  const r = await attempt(fn);
  const ok = r.allowed === shouldAllow && !r.unexpected;
  results.push({ ok, label: `${shouldAllow ? "allow" : "deny "}  ${label}`, note: r.unexpected });
}

// ---------------------------------------------------------------- people and files

const stranger = as(null);
const seller = as("seller1", { role: "seller" });
const seller2 = as("seller2", { role: "seller" });
const admin = as("admin1", { role: "admin" });

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0xff, 0xd9]);
const PDF = new TextEncoder().encode("%PDF-1.4\n%%EOF\n");
const jpeg = { contentType: "image/jpeg" };
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const photo = (owner, n) => `listing-photos/${owner}/${id(n)}.jpg`;
const plan = (owner, n, ext) => `floor-plans/${owner}/${id(n)}.${ext}`;

// ================================================================= listing photos: create

await check("owner uploads a JPEG photo to their own folder", true, () => uploadBytes(ref(seller, photo("seller1", 1)), JPEG, jpeg));
await check("owner uploads a second photo", true, () => uploadBytes(ref(seller, photo("seller1", 2)), JPEG, jpeg));
await check("signed-out visitor uploads a photo", false, () => uploadBytes(ref(stranger, photo("seller1", 3)), JPEG, jpeg));
await check("user uploads into someone else's folder", false, () => uploadBytes(ref(seller2, photo("seller1", 4)), JPEG, jpeg));
await check("photo with a non-JPEG content type", false, () => uploadBytes(ref(seller, photo("seller1", 5)), JPEG, { contentType: "image/png" }));
await check("photo whose name is not a UUID .jpg", false, () => uploadBytes(ref(seller, `listing-photos/seller1/holiday.jpg`), JPEG, jpeg));
await check("photo of 10 MB or more", false, () => uploadBytes(ref(seller, photo("seller1", 6)), new Uint8Array(10 * 1024 * 1024), jpeg));
await check("owner overwrites an existing photo in place", false, () => uploadBytes(ref(seller, photo("seller1", 1)), JPEG, jpeg));

// ================================================================= listing photos: read and list (D6)

await check("signed-out visitor fetches a photo by its address", true, () => getBytes(ref(stranger, photo("seller1", 1))));
await check("signed-out visitor reads a photo's metadata", true, () => getMetadata(ref(stranger, photo("seller1", 1))));
await check("signed-out visitor lists a seller's photo folder", false, () => listAll(ref(stranger, "listing-photos/seller1")));
await check("signed-out visitor pages through a seller's photo folder", false, () => list(ref(stranger, "listing-photos/seller1"), { maxResults: 10 }));
await check("another user lists a seller's photo folder", false, () => listAll(ref(seller2, "listing-photos/seller1")));
await check("owner lists their own photo folder (the app never needs to)", false, () => listAll(ref(seller, "listing-photos/seller1")));
await check("anyone lists every seller's folder", false, () => listAll(ref(stranger, "listing-photos")));

// ================================================================= floor plans

await check("owner uploads a PDF floor plan", true, () => uploadBytes(ref(seller, plan("seller1", 11, "pdf")), PDF, { contentType: "application/pdf" }));
await check("owner uploads a PNG floor plan", true, () => uploadBytes(ref(seller, plan("seller1", 12, "png")), JPEG, { contentType: "image/png" }));
await check("floor plan of a type that is not allowed", false, () => uploadBytes(ref(seller, plan("seller1", 13, "gif")), JPEG, { contentType: "image/gif" }));
await check("floor plan in someone else's folder", false, () => uploadBytes(ref(seller2, plan("seller1", 14, "pdf")), PDF, { contentType: "application/pdf" }));
await check("signed-out visitor fetches a floor plan by its address", true, () => getBytes(ref(stranger, plan("seller1", 11, "pdf"))));
await check("signed-out visitor lists a seller's floor plans", false, () => listAll(ref(stranger, "floor-plans/seller1")));

// ================================================================= delete

await check("another user deletes a seller's photo", false, () => deleteObject(ref(seller2, photo("seller1", 2))));
await check("signed-out visitor deletes a photo", false, () => deleteObject(ref(stranger, photo("seller1", 2))));
await check("owner deletes their own photo", true, () => deleteObject(ref(seller, photo("seller1", 2))));
await check("admin deletes a seller's photo", true, () => deleteObject(ref(admin, photo("seller1", 1))));
await check("admin deletes a seller's floor plan", true, () => deleteObject(ref(admin, plan("seller1", 12, "png"))));

// ================================================================= everything else

await check("upload outside the two folders", false, () => uploadBytes(ref(seller, "uploads/seller1/file.jpg"), JPEG, jpeg));
await check("read outside the two folders", false, () => getMetadata(ref(stranger, "uploads/seller1/file.jpg")));

// ---------------------------------------------------------------- report

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}${r.note ? `  — ${r.note}` : ""}`);
console.log(`\n${results.length - failed.length}/${results.length} passed.`);
process.exit(failed.length > 0 ? 1 : 0);
