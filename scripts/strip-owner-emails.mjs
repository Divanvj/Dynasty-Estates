/**
 * Removes the owner's e-mail address (ownerEmail) from every listing in
 * /properties (audit item 1.5). Listings filed before that change carry it,
 * and a published listing is readable by anyone.
 *
 *   node scripts/strip-owner-emails.mjs --key ./service-account.json            # dry run: counts only
 *   node scripts/strip-owner-emails.mjs --key ./service-account.json --apply    # removes the field
 *
 * Nothing else on a listing changes. The address is not lost: it is the
 * account's own e-mail in Firebase Auth, where the enquiry e-mails and the
 * admin "Contact seller" button read it. This writes to the LIVE project:
 * run it with the owner's OK, after the code that stops writing the field
 * has been deployed (or new listings bring it back).
 */
import { readFileSync } from "node:fs";
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const apply = process.argv.includes("--apply");
const keyIndex = process.argv.indexOf("--key");
const keyPath = keyIndex !== -1 ? process.argv[keyIndex + 1] : process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const credential = keyPath ? cert(JSON.parse(readFileSync(keyPath, "utf8"))) : applicationDefault();

initializeApp({ credential, projectId: "dynasty-estates" });
const db = getFirestore();

const listings = await db.collection("properties").select("ownerEmail").get();
const carrying = listings.docs.filter((doc) => doc.get("ownerEmail") !== undefined);
console.log(`${listings.size} listing(s); ${carrying.length} carry an owner e-mail address.`);

if (!apply) {
  console.log("Dry run: nothing changed. Add --apply to remove the field.");
  process.exit(0);
}

const writer = db.bulkWriter();
for (const doc of carrying) void writer.update(doc.ref, { ownerEmail: FieldValue.delete() });
await writer.close();
console.log(`Removed ownerEmail from ${carrying.length} listing(s).`);
