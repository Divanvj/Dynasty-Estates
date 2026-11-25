/**
 * Prints the .env.local line for the Firebase service-account key:
 *
 *   node scripts/key-to-env.mjs ./service-account.json
 *   FIREBASE_SERVICE_ACCOUNT=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50Ii...
 *
 * The app reads the key only from FIREBASE_SERVICE_ACCOUNT (audit item 2.12);
 * a path to the key file is no longer read, because the bundler then packed
 * the whole project folder into every server function. Base64 keeps the key on
 * one line. Paste the output into .env.local (never commit it).
 */
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/key-to-env.mjs <service-account.json>");
  process.exit(1);
}

const raw = readFileSync(file, "utf8");
const key = JSON.parse(raw);
if (key.type !== "service_account" || !key.private_key || !key.client_email) {
  console.error("That file doesn't look like a Firebase service-account key.");
  process.exit(1);
}
console.log(`FIREBASE_SERVICE_ACCOUNT=${Buffer.from(JSON.stringify(key)).toString("base64")}`);
