/**
 * Seeds the four Dynasty Estates role accounts into Firebase Auth and stamps
 * each one with a `role` custom claim.
 *
 * The claim is what `firestore.rules` authorises against
 * (`request.auth.token.role`), so it is the source of truth. The mirrored
 * `users/{uid}` document exists only so the UI can show a name and profile.
 *
 * Usage:
 *   node scripts/seed-firebase-roles.mjs --key ./service-account.json
 *   # or, if GOOGLE_APPLICATION_CREDENTIALS is already exported:
 *   node scripts/seed-firebase-roles.mjs
 *
 * Re-running is safe: existing users are updated in place, not duplicated.
 */
import { readFileSync } from "node:fs";
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const PROJECT_ID = "dynasty-estates";

const ACCOUNTS = [
  {
    email: "demo.buyer@dynastyestates-demo.com",
    password: "DynastyBuyer2026!",
    displayName: "Thabo Mokoena (Buyer Demo)",
    role: "buyer",
  },
  {
    email: "demo.seller@dynastyestates-demo.com",
    password: "DynastySeller2026!",
    displayName: "Sarah Jenkins (Seller Demo)",
    role: "seller",
  },
  {
    email: "demo.agent@dynastyestates-demo.com",
    password: "DynastyAgent2026!",
    displayName: "Liam van der Merwe (Agent Demo)",
    role: "agent",
    agencyName: "Dynasty Estates Sandton",
  },
  {
    email: "demo.admin@dynastyestates-demo.com",
    password: "DynastyAdmin2026!",
    displayName: "Platform Moderator (Admin Demo)",
    role: "admin",
  },
];

function credentialFromArgs() {
  const keyIndex = process.argv.indexOf("--key");
  if (keyIndex !== -1 && process.argv[keyIndex + 1]) {
    const path = process.argv[keyIndex + 1];
    return cert(JSON.parse(readFileSync(path, "utf8")));
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return applicationDefault();
  }
  console.error(
    "No credentials. Pass --key <service-account.json>, or export GOOGLE_APPLICATION_CREDENTIALS.\n" +
      "Download a key from:\n" +
      `  https://console.firebase.google.com/project/${PROJECT_ID}/settings/serviceaccounts/adminsdk`,
  );
  process.exit(1);
}

initializeApp({ credential: credentialFromArgs(), projectId: PROJECT_ID });

const auth = getAuth();
const db = getFirestore();

for (const account of ACCOUNTS) {
  const { email, password, displayName, role, agencyName } = account;

  let user;
  try {
    user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { password, displayName, emailVerified: true });
    console.log(`updated  ${email}`);
  } catch (error) {
    if (error.code !== "auth/user-not-found") throw error;
    user = await auth.createUser({ email, password, displayName, emailVerified: true });
    console.log(`created  ${email}`);
  }

  // The claim the security rules read.
  await auth.setCustomUserClaims(user.uid, { role });

  await db.doc(`users/${user.uid}`).set(
    {
      uid: user.uid,
      email,
      displayName,
      role,
      isVerified: true,
      ...(agencyName ? { agencyName } : {}),
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  console.log(`         role=${role} uid=${user.uid}`);
}

console.log(
  "\nDone. Note: a claim is baked into the ID token, so anyone already signed in " +
    "keeps their old role until the token refreshes (up to 1 hour) or they sign out and back in.",
);
process.exit(0);
