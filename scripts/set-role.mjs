/**
 * Sets the `role` custom claim on one existing account, and mirrors it into
 * users/{uid}.role. For bootstrapping the first developer; after that, roles are
 * changed from the developer console (/console/users), which logs who did it.
 *
 * Usage:
 *   node scripts/set-role.mjs <email> <buyer|seller|agent|admin|developer> --key ./service-account.json
 *   # or with FIREBASE_SERVICE_ACCOUNT_PATH / GOOGLE_APPLICATION_CREDENTIALS exported
 *
 * The account must already exist (sign up on the site first). Nothing is created.
 */
import { readFileSync } from "node:fs";
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const ROLES = ["buyer", "seller", "agent", "admin", "developer"];
const [email, role] = process.argv.slice(2).filter((a, i, all) => !a.startsWith("--") && all[i - 1] !== "--key");

if (!email || !ROLES.includes(role)) {
  console.error(`usage: node scripts/set-role.mjs <email> <${ROLES.join("|")}> [--key <service-account.json>]`);
  process.exit(1);
}

const keyIndex = process.argv.indexOf("--key");
const keyPath = keyIndex !== -1 ? process.argv[keyIndex + 1] : process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const credential = keyPath ? cert(JSON.parse(readFileSync(keyPath, "utf8"))) : applicationDefault();

initializeApp({ credential, projectId: "dynasty-estates" });

const user = await getAuth().getUserByEmail(email);
const before = user.customClaims?.role ?? "none";
await getAuth().setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), role });
await getFirestore().doc(`users/${user.uid}`).set({ role, updatedAt: new Date().toISOString() }, { merge: true });
await getFirestore().collection("console_events").add({
  actorId: "script",
  actorEmail: null,
  actorRole: "system",
  action: "users.setRole",
  summary: `scripts/set-role.mjs changed ${email} from ${before} to ${role}`,
  details: { uid: user.uid, from: before, to: role },
  createdAt: new Date(),
});

console.log(`${email}: role ${before} -> ${role}. Sign out and back in for it to take effect.`);
process.exit(0);
