import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
  type Auth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

const app = isFirebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

/**
 * Auth without the popup/redirect resolver (U2). getAuth() attaches
 * browserPopupRedirectResolver, which loads Firebase's sign-in iframe
 * (auth/iframe.js, ~93 KB from firebaseapp.com) and Google's gapi scripts on
 * EVERY page — PageSpeed put them on the home page's critical path. Only
 * "Continue with Google" needs them, so signInWithGoogle passes the resolver
 * itself and they load on that click. The persistence list is getAuth()'s own
 * default, in the same order, so existing sessions carry on.
 *
 * On the server getAuth() is unchanged (its Node build has no popup resolver).
 * initializeAuth throws if Auth already exists for this app (hot reload in
 * dev), and getAuth() then returns that instance.
 */
function createAuth(firebaseApp: FirebaseApp): Auth {
  if (typeof window === "undefined") return getAuth(firebaseApp);
  try {
    return initializeAuth(firebaseApp, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
    });
  } catch {
    return getAuth(firebaseApp);
  }
}

export const auth = app ? createAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;

export default app;
