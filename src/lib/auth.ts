import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  RecaptchaVerifier,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile,
  type ConfirmationResult,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

import { authenticateDemoUser, isDemoEmail } from "./demo-accounts";
import { auth, db, isFirebaseConfigured } from "./firebase";
import { setActiveUserRole, type UserRole as PersonaRole } from "./use-user-role";

import { useSyncExternalStore } from "react";

export const DEMO_SESSION_KEY = "dynasty_demo_session";
export const DEMO_AUTH_EVENT = "dynasty_demo_auth_change";

export type DemoSessionUser = {
  uid: string;
  email: string;
  displayName: string;
  role: PersonaRole;
};

export function getDemoSession(): DemoSessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setDemoSession(user: DemoSessionUser | null): void {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(DEMO_SESSION_KEY);
    }
  } catch {
    // Continue if storage restricted
  }
  window.dispatchEvent(new CustomEvent(DEMO_AUTH_EVENT, { detail: user }));
  window.dispatchEvent(new Event("storage"));
}

function subscribeDemoSession(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(DEMO_AUTH_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(DEMO_AUTH_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

let cachedDemoSnapshot: DemoSessionUser | null = null;
let cachedRaw: string | null = null;

function getDemoSessionSnapshot(): DemoSessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedDemoSnapshot = raw ? JSON.parse(raw) : null;
    }
    return cachedDemoSnapshot;
  } catch {
    return null;
  }
}

function getServerDemoSnapshot(): DemoSessionUser | null {
  return null;
}

export function useDemoSession(): DemoSessionUser | null {
  return useSyncExternalStore(subscribeDemoSession, getDemoSessionSnapshot, getServerDemoSnapshot);
}

export type UserRole =
  | "buyer"
  | "renter"
  | "seller"
  | "landlord"
  | "agent"
  | "agency_admin"
  | "moderator"
  | "admin";

const ROLE_TO_PERSONA: Record<string, PersonaRole> = {
  buyer: "Buyer",
  renter: "Buyer",
  seller: "Seller",
  landlord: "Seller",
  agent: "Agent",
  agency_admin: "Admin",
  admin: "Admin",
  moderator: "Admin",
};

const ROLE_LANDING: Record<PersonaRole, string> = {
  Buyer: "/search",
  Seller: "/seller/portal",
  Agent: "/agent/dashboard",
  Admin: "/admin",
};

/** Where a freshly signed-in user should land, based on their role. */
export function roleLandingPath(role: PersonaRole): string {
  return ROLE_LANDING[role];
}

/** Maps a stored domain role onto one of the four UI personas. */
export function toPersonaRole(role: string | null | undefined): PersonaRole {
  if (!role) return "Buyer";
  return ROLE_TO_PERSONA[role.toLowerCase()] ?? "Buyer";
}

/**
 * Resolves the role for a signed-in Firebase user.
 *
 * The custom claim on the ID token is the source of truth: `firestore.rules`
 * authorises against `request.auth.token.role`, and a claim cannot be forged by
 * the client. The `users/{uid}` document is only a mirror for display, so it is
 * used as a fallback for accounts that have not been stamped with a claim yet
 * (for example a brand-new Google sign-in, which defaults to Buyer).
 *
 * Claims are baked into the ID token, so a role changed server-side is not
 * visible until the token refreshes; pass forceRefresh to pick it up at once.
 */
export async function resolveUserRole(user: User, forceRefresh = false): Promise<PersonaRole> {
  try {
    const { claims } = await user.getIdTokenResult(forceRefresh);
    if (typeof claims.role === "string" && claims.role) {
      return toPersonaRole(claims.role);
    }
  } catch {
    // Fall through to the profile document.
  }

  const profile = await getUserProfile(user.uid);
  return toPersonaRole(profile?.role);
}

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  phone?: string;
  agencyName?: string;
  isVerified?: boolean;
  createdAt: string;
  lastSignInAt?: string;
};

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!isFirebaseConfigured || !db) return null;

  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) return null;
    const data = userDoc.data();
    return {
      uid,
      email: data.email ?? null,
      displayName: data.displayName ?? null,
      role: (data.role as UserRole) ?? "buyer",
      phone: data.phone ?? undefined,
      agencyName: data.agencyName ?? undefined,
      isVerified: Boolean(data.isVerified),
      createdAt: data.createdAt ?? new Date().toISOString(),
      lastSignInAt: data.lastSignInAt ?? undefined,
    };
  } catch {
    return null;
  }
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase database is not configured.");
  }

  await updateDoc(doc(db, "users", uid), {
    role,
    updatedAt: new Date().toISOString(),
  });
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
  role: UserRole = "buyer",
) {
  if (!isFirebaseConfigured || !auth) {
    throw new Error("Firebase authentication is not configured.");
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  if (fullName) {
    await updateProfile(userCredential.user, { displayName: fullName });
  }

  if (db) {
    await setDoc(
      doc(db, "users", userCredential.user.uid),
      {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: fullName,
        role,
        isVerified: false,
        createdAt: new Date().toISOString(),
      },
      { merge: true },
    );
  }

  return userCredential.user;
}

export async function signInWithEmail(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  // The local demo shim is only a stand-in for an unconfigured project. Once
  // Firebase is connected the same four addresses exist as real users (see
  // scripts/seed-firebase-roles.mjs), so real authentication must win —
  // otherwise the demo accounts would never get a genuine session or claim.
  if (!isFirebaseConfigured || !auth) {
    const demoAccount = authenticateDemoUser(normalizedEmail, password);
    if (!demoAccount) {
      if (isDemoEmail(normalizedEmail)) {
        throw new Error("Invalid demo account credentials. Please verify your password.");
      }
      throw new Error(
        "Firebase authentication is not active in this demo environment. Please use one of the dedicated demo accounts (demo.buyer@..., demo.seller@..., demo.agent@..., or demo.admin@...)."
      );
    }

    const demoUser: DemoSessionUser = {
      uid: `demo-${demoAccount.role.toLowerCase()}`,
      email: demoAccount.email,
      displayName: demoAccount.displayName,
      role: demoAccount.role,
    };

    setDemoSession(demoUser);
    setActiveUserRole(demoAccount.role);

    return {
      uid: demoUser.uid,
      email: demoUser.email,
      displayName: demoUser.displayName,
      demoRole: demoAccount.role,
      initialPath: demoAccount.initialPath,
    };
  }

  const userCredential = await signInWithEmailAndPassword(auth, email, password);

  if (db) {
    await setDoc(
      doc(db, "users", userCredential.user.uid),
      {
        lastSignInAt: new Date().toISOString(),
      },
      { merge: true },
    );
  }

  // Force a token refresh so a role claim set since the last sign-in is picked
  // up immediately, then land the user in the workspace for that role.
  const role = await resolveUserRole(userCredential.user, true);
  setActiveUserRole(role);

  return {
    uid: userCredential.user.uid,
    email: userCredential.user.email,
    displayName: userCredential.user.displayName,
    role,
    initialPath: roleLandingPath(role),
  };
}

export async function signOutUser(): Promise<void> {
  setDemoSession(null);
  setActiveUserRole("Buyer");

  if (auth) {
    try {
      await signOut(auth);
    } catch {
      // Continue if not signed in with Firebase
    }
  }
}

export async function sendPasswordReset(email: string) {
  if (!isFirebaseConfigured || !auth) {
    throw new Error("Firebase authentication is not configured. Please add your Firebase configuration to .env.local.");
  }

  await sendPasswordResetEmail(auth, email);
}

export async function signInWithGoogle(defaultRole: UserRole = "buyer") {
  if (!isFirebaseConfigured || !auth) {
    throw new Error(
      "Firebase authentication is not configured. Please add your Firebase credentials to .env.local to enable Google Sign-In."
    );
  }

  const userCredential = await signInWithPopup(auth, new GoogleAuthProvider());

  if (db) {
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    const existingData = userDoc.exists() ? userDoc.data() : null;

    await setDoc(
      doc(db, "users", userCredential.user.uid),
      {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        role: existingData?.role ?? defaultRole,
        isVerified: existingData?.isVerified ?? false,
        lastSignInAt: new Date().toISOString(),
        ...(existingData ? {} : { createdAt: new Date().toISOString() }),
      },
      { merge: true },
    );
  }

  return userCredential.user;
}

/**
 * Phone sign-in is a two-step flow. Step one needs a reCAPTCHA verifier bound to
 * a DOM node; "invisible" solves itself unless Firebase decides to challenge.
 *
 * The verifier must be torn down (`clear()`) before a retry, otherwise the
 * container keeps a spent widget and the next send silently fails.
 */
export function createPhoneRecaptcha(containerId: string): RecaptchaVerifier {
  if (!isFirebaseConfigured || !auth) {
    throw new Error("Firebase authentication is not configured. Add your Firebase keys to .env.local.");
  }

  return new RecaptchaVerifier(auth, containerId, { size: "invisible" });
}

/** Step one: send the SMS. Returns the handle needed to confirm the code. */
export async function startPhoneSignIn(
  phoneNumber: string,
  verifier: RecaptchaVerifier,
): Promise<ConfirmationResult> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error("Firebase authentication is not configured. Add your Firebase keys to .env.local.");
  }

  // Firebase requires E.164. South African numbers are the common case here, so
  // accept the local 0XXXXXXXXX form and normalise it rather than rejecting it.
  const trimmed = phoneNumber.replace(/[\s()-]/g, "");
  const e164 = trimmed.startsWith("+")
    ? trimmed
    : trimmed.startsWith("0")
      ? `+27${trimmed.slice(1)}`
      : `+${trimmed}`;

  return signInWithPhoneNumber(auth, e164, verifier);
}

/** Step two: exchange the SMS code for a session. */
export async function confirmPhoneSignIn(confirmation: ConfirmationResult, code: string) {
  const credential = await confirmation.confirm(code);

  if (db) {
    const ref = doc(db, "users", credential.user.uid);
    const existing = await getDoc(ref);
    await setDoc(
      ref,
      {
        uid: credential.user.uid,
        phone: credential.user.phoneNumber,
        email: credential.user.email,
        displayName: credential.user.displayName ?? credential.user.phoneNumber,
        // Role is only seeded here; the custom claim remains the source of truth.
        role: existing.exists() ? (existing.data().role ?? "buyer") : "buyer",
        lastSignInAt: new Date().toISOString(),
        ...(existing.exists() ? {} : { createdAt: new Date().toISOString(), isVerified: false }),
      },
      { merge: true },
    );
  }

  return credential.user;
}

export function getFirebaseAuthErrorMessage(error: unknown): string {
  if (typeof error !== "object" || !error) return "An unexpected error occurred.";
  const err = error as { code?: string; message?: string };
  switch (err.code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password. Please try again.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in instead.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters with letters and numbers.";
    case "auth/popup-closed-by-user":
      return "Google sign-in popup was closed before completing.";
    case "auth/cancelled-popup-request":
      return "Authentication was cancelled.";
    case "auth/popup-blocked":
      return "Popup was blocked by your browser. Please allow popups for this site.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized for OAuth operations. Please add this domain to Authorized Domains in the Firebase Console.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection and try again.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please wait a moment before trying again.";
    case "auth/invalid-phone-number":
      return "Enter a valid phone number, for example 082 123 4567 or +27821234567.";
    case "auth/missing-phone-number":
      return "Please enter your phone number.";
    case "auth/invalid-verification-code":
      return "That verification code is incorrect. Please check the SMS and try again.";
    case "auth/code-expired":
      return "That verification code has expired. Request a new one.";
    case "auth/quota-exceeded":
      return "The SMS quota for this project has been exceeded. Please try again later.";
    case "auth/captcha-check-failed":
      return "reCAPTCHA verification failed. Reload the page and try again.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled for this Firebase project.";
    default:
      return err.message ?? "Authentication failed. Please try again.";
  }
}

