// Firestore security-rule tests (S1-4), against the local Firestore emulator.
//
//   npm run test:rules
//
// which runs this file inside `firebase emulators:exec --only firestore`, so
// the emulator loads ./firestore.rules from firebase.json. Nothing here
// touches the live project: the project id starts with "demo-", which the
// emulator treats as offline-only.
//
// Each check signs in as someone (an emulator test token carrying the same
// `role` claim the app sets), tries one read or write, and states whether the
// rules should allow it. Data is seeded over the emulator's REST API with the
// "owner" bearer token, which bypasses the rules.
//
// `gap()` records something the rules currently allow but should not. Gaps
// are printed and do not fail the run (they need a rules change and a deploy,
// which the owner decides on); set RULES_STRICT=1 to make them fail too.

import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

const PROJECT = process.env.GCLOUD_PROJECT || "demo-dynasty-rules";
// "localhost" (what emulators:exec sets) resolves to IPv6 first in Node on
// Windows, where the emulator is not listening.
const [HOST, PORT] = (process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080").replace(/^localhost:/, "127.0.0.1:").split(":");
const BASE = `http://${HOST}:${PORT}`;
const DOCS = `${BASE}/v1/projects/${PROJECT}/databases/(default)/documents`;

// ---------------------------------------------------------------- seeding

function toValue(v) {
  if (v === null) return { nullValue: null };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === "object") return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toValue(x)])) } };
  throw new Error(`cannot seed ${typeof v}`);
}

async function seed(path, data) {
  const res = await fetch(`${DOCS}/${path}`, {
    method: "PATCH",
    headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
    body: JSON.stringify({ fields: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, toValue(v)])) }),
  });
  if (!res.ok) throw new Error(`seed ${path}: ${res.status} ${await res.text()}`);
}

async function clearDatabase() {
  const res = await fetch(`${BASE}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
  if (!res.ok) throw new Error(`clear: ${res.status}`);
}

// ---------------------------------------------------------------- clients

let appCount = 0;
/** A Firestore client signed in as `uid` with optional claims; no uid = signed out. */
function as(uid, claims = {}) {
  const app = initializeApp({ projectId: PROJECT, apiKey: "test" }, `rules-${appCount++}`);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, HOST, Number(PORT), uid ? { mockUserToken: { sub: uid, user_id: uid, ...claims } } : undefined);
  return db;
}

const results = [];
const gaps = [];

const TIMEOUT_MS = 10000;
async function attempt(fn) {
  try {
    await Promise.race([
      fn(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timed out")), TIMEOUT_MS)),
    ]);
    return { allowed: true };
  } catch (error) {
    const code = String(error?.code ?? error);
    if (!code.includes("permission-denied")) return { allowed: false, unexpected: `${code}: ${error?.message ?? ""}` };
    return { allowed: false };
  }
}

/** The rules should allow (`true`) or refuse (`false`) this. */
async function check(label, shouldAllow, fn) {
  if (process.env.RULES_VERBOSE) console.log("…", label);
  const r = await attempt(fn);
  const ok = r.allowed === shouldAllow && !r.unexpected;
  results.push({ ok, label: `${shouldAllow ? "allow" : "deny "}  ${label}`, note: r.unexpected });
}

/** Should be refused, but today's rules allow it. Reported, not failed (unless RULES_STRICT=1). */
async function gap(label, fn) {
  const r = await attempt(fn);
  if (r.allowed) gaps.push(label);
  else results.push({ ok: !r.unexpected, label: `deny   ${label} (gap closed)`, note: r.unexpected });
}

// ---------------------------------------------------------------- people

const stranger = as(null);
const buyer = as("buyer1", { email: "buyer1@example.test" });
const buyer2 = as("buyer2", { email: "buyer2@example.test" });
const seller = as("seller1", { role: "seller", email: "seller1@example.test" });
const seller2 = as("seller2", { role: "seller", email: "seller2@example.test" });
const agent = as("agentA", { role: "agent", email: "agenta@example.test" });
const agentB = as("agentB", { role: "agent", email: "agentb@example.test" });
const principal = as("principal1", { role: "agent", email: "principal1@example.test" });
const member = as("member1", { role: "agent", email: "member1@example.test" });
const invitee = as("invitee1", { role: "agent", email: "invitee1@example.test" });
const admin = as("admin1", { role: "admin", email: "admin1@example.test" });
// A role claim the app never issues: it must not count as anything.
const fakeRole = as("faker1", { role: "superuser", email: "faker1@example.test" });

const now = serverTimestamp;
const past = Timestamp.fromDate(new Date("2026-01-01T00:00:00Z"));

// ---------------------------------------------------------------- seed data

await clearDatabase();

await seed("properties/pub1", { ownerId: "seller1", status: "Published", title: "Published home", price: "R 1 000 000" });
await seed("properties/draft1", { ownerId: "seller1", status: "Draft", title: "Seller draft" });
await seed("properties/sub1", { ownerId: "seller1", status: "Submitted", title: "Awaiting review" });
await seed("properties/agentPub", { ownerId: "agentA", status: "Published", title: "Agent listing" });
await seed("properties/memberPub", { ownerId: "member1", status: "Published", title: "Member listing" });
await seed("physical_properties/phys1", { ownerId: "seller1", bedrooms: 3 });

await seed("users/buyer1", { displayName: "Buyer One" });
await seed("users/buyer1/savedProperties/pub1", { propertyId: "pub1" });

await seed("applications/app1", { applicantId: "buyer1", propertyId: "pub1", creditConsent: true, status: "submitted", idNumber: "test-only" });

const enq = (ownerId, status, extra = {}) => ({ userId: "buyer1", userEmail: "buyer1@example.test", ownerId, propertyId: "pub1", status, notes: "Hello", ...extra });
await seed("inquiries/sellerNew", enq("seller1", "new"));
await seed("inquiries/sellerNew2", enq("seller1", "new"));
await seed("inquiries/agentNew", enq("agentA", "new", { propertyId: "agentPub" }));
await seed("inquiries/agentNew2", enq("agentA", "new", { propertyId: "agentPub" }));
await seed("inquiries/agentNew3", enq("agentA", "new", { propertyId: "agentPub" }));
await seed("inquiries/agentReplied", enq("agentA", "contacted", { propertyId: "agentPub", firstRespondedAt: new Date("2026-11-10T10:00:00Z") }));
await seed("inquiries/memberNew", enq("member1", "new", { propertyId: "memberPub" }));
await seed("inquiries/memberNew2", enq("member1", "new", { propertyId: "memberPub" }));
await seed("inquiries/agentBNew", enq("agentB", "new"));

await seed("photo_fingerprints/fp1", { hash: "0123456789abcdef", bands: ["a", "b", "c", "d"], ownerId: "seller1", listingId: "pub1", createdAt: new Date() });

await seed("collections/col1", { ownerId: "buyer1", title: "My shortlist", propertyIds: ["pub1"], members: [], votes: {}, comments: [] });

await seed("support_requests/sr1", { userId: "buyer1", userEmail: "buyer1@example.test", message: "Help", status: "new", createdAt: new Date() });

await seed("practitioners/agentA", { fullName: "Agent A", email: "agenta@example.test", phone: "1", ffcNumber: "FFC1", ffcExpiry: "2027-01-01", agencyName: "", status: "verified", submittedAt: new Date() });
await seed("practitioners/principal1", { fullName: "Principal", email: "principal1@example.test", phone: "1", ffcNumber: "FFC2", ffcExpiry: "2027-01-01", agencyName: "P", status: "verified", submittedAt: new Date() });
await seed("practitioners/agentB", { fullName: "Agent B", email: "agentb@example.test", phone: "1", ffcNumber: "FFC3", ffcExpiry: "2027-01-01", agencyName: "", status: "pending", submittedAt: new Date() });

await seed("agencies/principal1", { name: "Principal Realty", ppraFirmNumber: "", principalUid: "principal1", createdAt: new Date() });
await seed("agency_members/principal1_member1", { principalUid: "principal1", memberUid: "member1", name: "Member", email: "member1@example.test", joinedAt: new Date() });
await seed("agency_invites/principal1_invitee1@example.test", { principalUid: "principal1", agencyName: "Principal Realty", email: "invitee1@example.test", invitedAt: new Date() });

await seed("listing_stats/pub1_20261119", { listingId: "pub1", ownerId: "seller1", date: "2026-11-19", views: 3 });
await seed("listing_stats/memberPub_20261119", { listingId: "memberPub", ownerId: "member1", date: "2026-11-19", views: 5 });
await seed("audit_logs/log1", { actorId: "agentA", actorEmail: "agenta@example.test", action: "approve", resource: "pub1", details: "", createdAt: new Date() });

for (const c of ["saved_searches", "email_prefs", "sales", "mail_log", "platform_config"]) {
  await seed(`${c}/x1`, { ownerId: "buyer1", uid: "buyer1", note: "server only" });
}

// ================================================================= listings

await check("anyone reads a published listing", true, () => getDoc(doc(stranger, "properties/pub1")));
await check("signed-out visitor reads a draft", false, () => getDoc(doc(stranger, "properties/draft1")));
await check("another seller reads someone's draft", false, () => getDoc(doc(seller2, "properties/draft1")));
await check("owner reads their own draft", true, () => getDoc(doc(seller, "properties/draft1")));
await check("agent reads a submitted listing (moderation)", true, () => getDoc(doc(agent, "properties/sub1")));
await check("made-up role reads a draft", false, () => getDoc(doc(fakeRole, "properties/draft1")));
await check("catalogue query on Published", true, () => getDocs(query(collection(stranger, "properties"), where("status", "==", "Published"))));
await check("signed-out query over every listing", false, () => getDocs(collection(stranger, "properties")));

await check("seller files a listing for review", true, () => setDoc(doc(seller, "properties/new1"), { ownerId: "seller1", status: "Submitted", title: "New" }));
await check("seller publishes their own listing directly", false, () => setDoc(doc(seller, "properties/new2"), { ownerId: "seller1", status: "Published", title: "Sneaky" }));
await check("seller files a listing under someone else", false, () => setDoc(doc(seller, "properties/new3"), { ownerId: "seller2", status: "Submitted" }));
await check("signed-out visitor creates a listing", false, () => setDoc(doc(stranger, "properties/new4"), { ownerId: "x", status: "Submitted" }));
await check("seller publishes their own draft", false, () => updateDoc(doc(seller, "properties/draft1"), { status: "Published" }));
await check("seller pauses their own listing", true, () => updateDoc(doc(seller, "properties/pub1"), { status: "Paused" }));
await check("seller hands their listing to another owner", false, () => updateDoc(doc(seller, "properties/draft1"), { ownerId: "seller2" }));
await check("another seller edits someone's listing", false, () => updateDoc(doc(seller2, "properties/draft1"), { title: "Hijacked" }));
await check("another seller deletes someone's listing", false, () => deleteDoc(doc(seller2, "properties/sub1")));
await check("agent publishes a submitted listing", true, () => updateDoc(doc(agent, "properties/sub1"), { status: "Published" }));
await check("made-up role publishes a listing", false, () => updateDoc(doc(fakeRole, "properties/draft1"), { status: "Published" }));
await check("seller marks their own listing as a Dynasty example (example: true)", false, () => updateDoc(doc(seller, "properties/draft1"), { example: true }));
await check("seller points their listing's contact at another agent (agentId)", false, () => updateDoc(doc(seller, "properties/draft1"), { agentId: "agentA" }));
await check("seller writes their own recorded sale onto the listing (sale)", false, () => updateDoc(doc(seller, "properties/draft1"), { sale: { soldOn: "2026-11-01", price: 1 } }));
await check("seller files a new listing as an example", false, () => setDoc(doc(seller, "properties/new5"), { ownerId: "seller1", status: "Submitted", example: true }));
await check("seller files a new listing with another agent as contact", false, () => setDoc(doc(seller, "properties/new6"), { ownerId: "seller1", status: "Submitted", agentId: "agentA" }));
await check("seller files a listing with themselves as contact (what the app sends)", true, () => setDoc(doc(seller, "properties/new7"), { ownerId: "seller1", status: "Submitted", agentId: "seller1" }));
await check("seller edits their listing's title and price", true, () => updateDoc(doc(seller, "properties/draft1"), { title: "Renamed", price: "R 2 000 000" }));
await check("agent marks a listing as an example", true, () => updateDoc(doc(agent, "properties/agentPub"), { example: true }));
await gap("any agent edits another agent's listing (price, title)", () => updateDoc(doc(agentB, "properties/agentPub"), { price: "R 1" }));
await gap("any agent deletes another agent's listing", () => deleteDoc(doc(agentB, "properties/memberPub")));

await check("anyone reads a physical property", true, () => getDoc(doc(stranger, "physical_properties/phys1")));
await check("another seller edits someone's physical property", false, () => updateDoc(doc(seller2, "physical_properties/phys1"), { bedrooms: 9 }));
await check("owner edits their physical property", true, () => updateDoc(doc(seller, "physical_properties/phys1"), { bedrooms: 4 }));

// ================================================================= accounts

await check("person reads their own account doc", true, () => getDoc(doc(buyer, "users/buyer1")));
await check("person reads someone else's account doc", false, () => getDoc(doc(buyer2, "users/buyer1")));
await check("admin cannot delete an account doc from the app", false, () => deleteDoc(doc(admin, "users/buyer1")));
await check("person reads their own saved homes", true, () => getDocs(collection(buyer, "users/buyer1/savedProperties")));
await check("person reads someone else's saved homes", false, () => getDocs(collection(buyer2, "users/buyer1/savedProperties")));
await check("person saves a home for someone else", false, () => setDoc(doc(buyer2, "users/buyer1/savedProperties/x"), { propertyId: "x" }));
await check("person saves a home for themselves", true, () => setDoc(doc(buyer2, "users/buyer2/savedProperties/pub1"), { propertyId: "pub1" }));

// ================================================================= tenancy applications

await check("applicant files an application with consent", true, () => setDoc(doc(buyer2, "applications/app2"), { applicantId: "buyer2", creditConsent: true, status: "submitted" }));
await check("application without credit consent", false, () => setDoc(doc(buyer2, "applications/app3"), { applicantId: "buyer2", creditConsent: false, status: "submitted" }));
await check("applicant files as already approved", false, () => setDoc(doc(buyer2, "applications/app4"), { applicantId: "buyer2", creditConsent: true, status: "approved" }));
await check("application filed in someone else's name", false, () => setDoc(doc(buyer2, "applications/app5"), { applicantId: "buyer1", creditConsent: true, status: "submitted" }));
await check("applicant reads their own application", true, () => getDoc(doc(buyer, "applications/app1")));
await check("another buyer reads the application (ID data)", false, () => getDoc(doc(buyer2, "applications/app1")));
await check("seller of a different home reads the application", false, () => getDoc(doc(seller2, "applications/app1")));
await check("applicant approves their own application", false, () => updateDoc(doc(buyer, "applications/app1"), { status: "approved" }));
await check("admin deletes an application", false, () => deleteDoc(doc(admin, "applications/app1")));
await check("an agent reads a tenant's application (ID data)", false, () => getDoc(doc(agentB, "applications/app1")));
await check("an agent changes an application's status", false, () => updateDoc(doc(agentB, "applications/app1"), { status: "approved" }));
await check("admin reads an application", true, () => getDoc(doc(admin, "applications/app1")));

// ================================================================= enquiries

await check("buyer sends an enquiry with the listing's real owner", true, () => setDoc(doc(buyer2, "inquiries/n1"), { userId: "buyer2", ownerId: "seller1", propertyId: "pub1", status: "new" }));
await check("buyer drops an enquiry into another owner's inbox", false, () => setDoc(doc(buyer2, "inquiries/n2"), { userId: "buyer2", ownerId: "agentB", propertyId: "pub1", status: "new" }));
await check("enquiry sent in someone else's name", false, () => setDoc(doc(buyer2, "inquiries/n3"), { userId: "buyer1", ownerId: "seller1", propertyId: "pub1", status: "new" }));
await check("signed-out visitor sends an enquiry", false, () => setDoc(doc(stranger, "inquiries/n4"), { userId: "x", propertyId: "pub1", status: "new" }));
await check("buyer files an enquiry already marked won", false, () => setDoc(doc(buyer2, "inquiries/n5"), { userId: "buyer2", ownerId: "seller1", propertyId: "pub1", status: "won" }));
await check("buyer files an enquiry assigned to an agent", false, () => setDoc(doc(buyer2, "inquiries/n6"), { userId: "buyer2", ownerId: "seller1", propertyId: "pub1", status: "new", assignedTo: "agentB" }));
await check("buyer files an enquiry with a first reply", false, () => setDoc(doc(buyer2, "inquiries/n7"), { userId: "buyer2", ownerId: "seller1", propertyId: "pub1", status: "new", firstRespondedAt: now() }));
await check("enquiry exactly as the app sends it", true, () => addDoc(collection(buyer2, "inquiries"), { userId: "buyer2", userEmail: "buyer2@example.test", propertyId: "pub1", propertyTitle: "Published home", ownerId: "seller1", contactName: "B", contactPhone: "", kind: "viewing", notes: "", status: "new", createdAt: now() }));

await check("sender reads their own enquiry", true, () => getDoc(doc(buyer, "inquiries/sellerNew")));
await check("listing owner reads the enquiry", true, () => getDoc(doc(seller, "inquiries/sellerNew")));
await check("another seller reads the enquiry", false, () => getDoc(doc(seller2, "inquiries/sellerNew")));
await check("an unrelated agent reads the enquiry", false, () => getDoc(doc(agentB, "inquiries/agentNew")));
await check("admin reads any enquiry", true, () => getDoc(doc(admin, "inquiries/agentNew")));
await check("agent lists only their own enquiries", true, () => getDocs(query(collection(agent, "inquiries"), where("ownerId", "==", "agentA"))));
await check("agent lists everyone's enquiries", false, () => getDocs(collection(agent, "inquiries")));

await check("private seller: new -> contacted with first reply", true, () => updateDoc(doc(seller, "inquiries/sellerNew"), { status: "contacted", updatedAt: now(), firstRespondedAt: now() }));
await check("private seller: move to viewing (agents only)", false, () => updateDoc(doc(seller, "inquiries/sellerNew2"), { status: "viewing", updatedAt: now() }));
await check("owner edits the buyer's message", false, () => updateDoc(doc(seller, "inquiries/sellerNew2"), { notes: "changed" }));
await check("agent: new -> contacted -> viewing -> offer -> won", true, async () => {
  await updateDoc(doc(agent, "inquiries/agentNew"), { status: "contacted", updatedAt: now(), firstRespondedAt: now() });
  await updateDoc(doc(agent, "inquiries/agentNew"), { status: "viewing", updatedAt: now() });
  await updateDoc(doc(agent, "inquiries/agentNew"), { status: "offer", updatedAt: now() });
  await updateDoc(doc(agent, "inquiries/agentNew"), { status: "won", updatedAt: now() });
});
await check("agent: unknown stage", false, () => updateDoc(doc(agent, "inquiries/agentNew2"), { status: "archived", updatedAt: now() }));
await check("agent: back-dated updatedAt", false, () => updateDoc(doc(agent, "inquiries/agentNew2"), { status: "contacted", updatedAt: past }));
await check("agent: first reply with a client-chosen time", false, () => updateDoc(doc(agent, "inquiries/agentNew3"), { status: "contacted", updatedAt: now(), firstRespondedAt: past }));
await check("agent: overwrite an existing first reply", false, () => updateDoc(doc(agent, "inquiries/agentReplied"), { status: "viewing", updatedAt: now(), firstRespondedAt: now() }));
await check("agent: another agent's enquiry", false, () => updateDoc(doc(agent, "inquiries/agentBNew"), { status: "contacted" }));
await check("sender deletes their enquiry", false, () => deleteDoc(doc(buyer, "inquiries/sellerNew2")));

// ================================================================= agencies

await check("principal reads a member's enquiry", true, () => getDoc(doc(principal, "inquiries/memberNew")));
await check("principal reads an outsider's enquiry", false, () => getDoc(doc(principal, "inquiries/agentNew2")));
await check("principal assigns a member's enquiry to the member", true, () => updateDoc(doc(principal, "inquiries/memberNew"), { assignedTo: "member1", updatedAt: now() }));
await check("principal assigns an enquiry to a non-member", false, () => updateDoc(doc(principal, "inquiries/memberNew2"), { assignedTo: "agentB", updatedAt: now() }));
await check("principal changes the stage while assigning", false, () => updateDoc(doc(principal, "inquiries/memberNew2"), { assignedTo: "member1", status: "won" }));
await check("assigned agent reads the enquiry", true, () => getDoc(doc(member, "inquiries/memberNew")));
await check("principal reads a member's listing stats", true, () => getDoc(doc(principal, "listing_stats/memberPub_20261119")));
await check("an outsider reads the member's stats", false, () => getDoc(doc(agentB, "listing_stats/memberPub_20261119")));

await check("verified agent registers an agency", true, () => setDoc(doc(agent, "agencies/agentA"), { name: "Agent A Realty", ppraFirmNumber: "", principalUid: "agentA", createdAt: now() }));
await check("unverified agent registers an agency", false, () => setDoc(doc(agentB, "agencies/agentB"), { name: "B Realty", ppraFirmNumber: "", principalUid: "agentB", createdAt: now() }));
await check("seller registers an agency", false, () => setDoc(doc(seller, "agencies/seller1"), { name: "S Realty", ppraFirmNumber: "", principalUid: "seller1", createdAt: now() }));
await check("agent registers an agency under another uid", false, () => setDoc(doc(agent, "agencies/agentB"), { name: "X", ppraFirmNumber: "", principalUid: "agentB", createdAt: now() }));
await check("member reads their agency", true, () => getDoc(doc(member, "agencies/principal1")));
await check("outsider reads the agency", false, () => getDoc(doc(agentB, "agencies/principal1")));

await check("principal invites an agent", true, () => setDoc(doc(principal, "agency_invites/principal1_new@example.test"), { principalUid: "principal1", agencyName: "Principal Realty", email: "new@example.test", invitedAt: now() }));
await check("non-principal sends an agency invite", false, () => setDoc(doc(agentB, "agency_invites/agentB_new@example.test"), { principalUid: "agentB", agencyName: "B", email: "new@example.test", invitedAt: now() }));
await check("invited agent reads their invite", true, () => getDoc(doc(invitee, "agency_invites/principal1_invitee1@example.test")));
await check("someone else reads the invite", false, () => getDoc(doc(agentB, "agency_invites/principal1_invitee1@example.test")));
await check("agent joins without an invite", false, () => setDoc(doc(agentB, "agency_members/principal1_agentB"), { principalUid: "principal1", memberUid: "agentB", name: "B", email: "agentb@example.test", joinedAt: now() }));
await check("invited agent joins", true, () => setDoc(doc(invitee, "agency_members/principal1_invitee1"), { principalUid: "principal1", memberUid: "invitee1", name: "Invitee", email: "invitee1@example.test", joinedAt: now() }));
await check("agent adds someone else as a member", false, () => setDoc(doc(agentB, "agency_members/principal1_member9"), { principalUid: "principal1", memberUid: "member9", name: "M9", email: "agentb@example.test", joinedAt: now() }));

// ================================================================= practitioners (FFC)

await check("agent files their own FFC application as pending", true, () => setDoc(doc(seller2, "practitioners/seller2"), { fullName: "Seller Two", email: "seller2@example.test", phone: "1", ffcNumber: "FFC9", ffcExpiry: "2027-06-30", agencyName: "", status: "pending", submittedAt: now() }));
await check("applicant marks themselves verified", false, () => setDoc(doc(buyer2, "practitioners/buyer2"), { fullName: "Buyer Two", email: "buyer2@example.test", phone: "1", ffcNumber: "FFC8", ffcExpiry: "2027-06-30", agencyName: "", status: "verified", submittedAt: now() }));
await check("verified practitioner edits to stay verified", false, () => updateDoc(doc(agent, "practitioners/agentA"), { ffcNumber: "FFC1-NEW", status: "verified", submittedAt: now() }));
await check("someone reads another practitioner's FFC record", false, () => getDoc(doc(agentB, "practitioners/agentA")));
await check("admin reads a practitioner record", true, () => getDoc(doc(admin, "practitioners/agentA")));

// ================================================================= photos, collections, support, stats, audit

await check("owner files a fingerprint with their new listing (batch)", true, async () => {
  const b = writeBatch(seller);
  b.set(doc(seller, "properties/withPhoto"), { ownerId: "seller1", status: "Submitted", title: "With photo" });
  b.set(doc(seller, "photo_fingerprints/fp2"), { hash: "fedcba9876543210", bands: ["a", "b", "c", "d"], ownerId: "seller1", listingId: "withPhoto", createdAt: now() });
  await b.commit();
});
await check("new listing as the app writes it: physical record + listing + fingerprint in one batch", true, async () => {
  const b = writeBatch(seller);
  b.set(doc(seller, "physical_properties/physNew"), { ownerId: "seller1", bedrooms: 3, bathrooms: 2, createdAt: now() });
  b.set(doc(seller, "properties/withPhys"), { propertyId: "physNew", ownerId: "seller1", ownerEmail: "seller1@example.test", agentId: "seller1", status: "Submitted", title: "Batch", createdAt: now() });
  b.set(doc(seller, "photo_fingerprints/fp4"), { hash: "fedcba9876543212", bands: ["a", "b", "c", "d"], ownerId: "seller1", listingId: "withPhys", createdAt: now() });
  await b.commit();
});
await check("a batch whose physical record names someone else writes nothing", false, async () => {
  const b = writeBatch(seller);
  b.set(doc(seller, "physical_properties/physBad"), { ownerId: "seller2", bedrooms: 3 });
  b.set(doc(seller, "properties/withPhysBad"), { propertyId: "physBad", ownerId: "seller1", status: "Submitted" });
  await b.commit();
});
await check("…and the listing from that failed batch does not exist", false, () => getDoc(doc(admin, "properties/withPhysBad")).then((s) => { if (!s.exists()) throw Object.assign(new Error("missing"), { code: "permission-denied" }); }));
await check("fingerprint filed against someone else's listing", false, () => setDoc(doc(seller2, "photo_fingerprints/fp3"), { hash: "fedcba9876543211", bands: ["a", "b", "c", "d"], ownerId: "seller2", listingId: "pub1", createdAt: now() }));
await check("fingerprint edited after filing", false, () => updateDoc(doc(seller, "photo_fingerprints/fp1"), { hash: "0000000000000000" }));

await check("owner reads their collection", true, () => getDoc(doc(buyer, "collections/col1")));
await check("someone else reads the collection", false, () => getDoc(doc(buyer2, "collections/col1")));
await check("owner hands the collection to someone else", false, () => updateDoc(doc(buyer, "collections/col1"), { ownerId: "buyer2" }));
await check("collection created under someone else", false, () => addDoc(collection(buyer2, "collections"), { ownerId: "buyer1", title: "x" }));

await check("person files a support request", true, () => addDoc(collection(buyer2, "support_requests"), { userId: "buyer2", userEmail: "buyer2@example.test", message: "Hi", status: "new", createdAt: now() }));
await check("support request with extra fields", false, () => addDoc(collection(buyer2, "support_requests"), { userId: "buyer2", userEmail: "b", message: "Hi", status: "new", createdAt: now(), priority: "urgent" }));
await check("someone else reads the support request", false, () => getDoc(doc(buyer2, "support_requests/sr1")));
await check("sender closes their own support request", false, () => updateDoc(doc(buyer, "support_requests/sr1"), { status: "closed" }));
await check("admin updates a support request", true, () => updateDoc(doc(admin, "support_requests/sr1"), { status: "closed" }));

await check("owner reads their listing stats", true, () => getDoc(doc(seller, "listing_stats/pub1_20261119")));
await check("owner inflates their own view count", false, () => updateDoc(doc(seller, "listing_stats/pub1_20261119"), { views: 9999 }));
await check("someone else reads the listing stats", false, () => getDoc(doc(seller2, "listing_stats/pub1_20261119")));

await check("agent files an audit entry as themselves", true, () => addDoc(collection(agent, "audit_logs"), { actorId: "agentA", actorEmail: "agenta@example.test", action: "approve", resource: "sub1" }));
await check("audit entry filed in someone else's name", false, () => addDoc(collection(agent, "audit_logs"), { actorId: "agentB", actorEmail: "x", action: "approve", resource: "sub1" }));
await check("audit entry edited", false, () => updateDoc(doc(admin, "audit_logs/log1"), { action: "reject" }));
await check("seller reads the audit trail", false, () => getDoc(doc(seller, "audit_logs/log1")));

// ================================================================= server-only collections

for (const c of ["saved_searches", "email_prefs", "sales", "mail_log", "platform_config"]) {
  await check(`client reads ${c} (server only)`, false, () => getDoc(doc(buyer, `${c}/x1`)));
  await check(`admin client writes ${c} (server only)`, false, () => setDoc(doc(admin, `${c}/y1`), { uid: "admin1" }));
}

// ---------------------------------------------------------------- report

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}${r.note ? `  — ${r.note}` : ""}`);
if (gaps.length) {
  console.log(`\nKnown gaps (allowed today, should be refused) — ${gaps.length}:`);
  for (const g of gaps) console.log(`GAP   ${g}`);
}
console.log(`\n${results.length - failed.length}/${results.length} passed${gaps.length ? `, ${gaps.length} known gap(s)` : ""}.`);
const strict = process.env.RULES_STRICT === "1";
process.exit(failed.length > 0 || (strict && gaps.length > 0) ? 1 : 0);
