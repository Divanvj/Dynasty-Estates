/**
 * Creates a developer account for testing: an email/password sign-in with the
 * developer claim. From the site or the console it can then switch itself to
 * Buyer, Seller, Agent or Admin (the real claim changes, so the security rules
 * apply as that role) and back. This replaces the four shared test accounts.
 *
 * Usage:
 *   node scripts/create-dev-account.mjs <email> "<display name>" --key ./service-account.json
 *   # or with FIREBASE_SERVICE_ACCOUNT_PATH / GOOGLE_APPLICATION_CREDENTIALS exported
 *
 * A random password is generated and printed once. Put it in TEST_ACCOUNTS.md
 * (gitignored) and nowhere else: the repository is public. Create one account
 * per machine or agent, so two testers never switch the same account's role
 * under each other. Refuses to touch an email that already exists.
 */
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const [email, displayName] = process.argv.slice(2).filter((a, i, all) => !a.startsWith("--") && all[i - 1] !== "--key");

if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !displayName) {
  console.error('usage: node scripts/create-dev-account.mjs <email> "<display name>" [--key <service-account.json>]');
  process.exit(1);
}

const keyIndex = process.argv.indexOf("--key");
const keyPath = keyIndex !== -1 ? process.argv[keyIndex + 1] : process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const credential = keyPath ? cert(JSON.parse(readFileSync(keyPath, "utf8"))) : applicationDefault();

initializeApp({ credential, projectId: "dynasty-estates" });
const auth = getAuth();
const db = getFirestore();

try {
  await auth.getUserByEmail(email);
  console.error(`${email} already exists. Use scripts/set-role.mjs to change its role.`);
  process.exit(1);
} catch (error) {
  if (error?.code !== "auth/user-not-found") throw error;
}

// 24 characters from a URL-safe alphabet; meets any password policy Firebase applies.
const password = `${randomBytes(18).toString("base64url")}!a1`;
const user = await auth.createUser({ email, password, displayName, emailVerified: false });
await auth.setCustomUserClaims(user.uid, { role: "developer", developer: true });

const now = new Date().toISOString();
await db.doc(`users/${user.uid}`).set({
  uid: user.uid,
  email,
  displayName,
  role: "developer",
  isVerified: false,
  createdAt: now,
  updatedAt: now,
});
await db.collection("console_events").add({
  actorId: "script",
  actorEmail: null,
  actorRole: "system",
  action: "users.createDeveloper",
  summary: `scripts/create-dev-account.mjs created developer account ${email}`,
  details: { uid: user.uid },
  createdAt: new Date(),
});

console.log(`Created ${email} (uid ${user.uid}) with the developer role.`);
console.log(`Password (shown once; store it in TEST_ACCOUNTS.md only): ${password}`);
process.exit(0);
