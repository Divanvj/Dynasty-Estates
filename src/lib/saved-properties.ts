import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";

import { db, isFirebaseConfigured } from "./firebase";

export async function isPropertySaved(userId: string, propertyId: string) {
  if (!isFirebaseConfigured || !db) {
    return false;
  }

  const savedProperty = await getDoc(doc(db, "users", userId, "savedProperties", propertyId));
  return savedProperty.exists();
}

export async function setPropertySaved(userId: string, propertyId: string, saved: boolean) {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase database is not configured.");
  }

  const savedPropertyRef = doc(db, "users", userId, "savedProperties", propertyId);

  if (saved) {
    await setDoc(savedPropertyRef, {
      propertyId,
      savedAt: serverTimestamp(),
    });
  } else {
    await deleteDoc(savedPropertyRef);
  }
}

export async function getSavedPropertyIds(userId: string) {
  if (!isFirebaseConfigured || !db) {
    return [];
  }

  const savedProperties = await getDocs(collection(db, "users", userId, "savedProperties"));
  return savedProperties.docs.map((savedProperty) => savedProperty.id);
}

/** Where the old signed-out list lived (before 19 Nov 2026). Read once, then removed. */
const BROWSER_SAVES_KEY = "dynasty_saved_properties";

/**
 * Moves a shortlist saved in this browser by the old signed-out list into the
 * account, then clears it. Best effort: if a write fails the browser copy is
 * kept for the next visit.
 */
export async function importBrowserSaves(userId: string): Promise<void> {
  if (typeof window === "undefined") return;
  let ids: string[] = [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(BROWSER_SAVES_KEY) ?? "[]");
    if (Array.isArray(parsed)) ids = parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return;
  }
  if (ids.length === 0) {
    try { localStorage.removeItem(BROWSER_SAVES_KEY); } catch { /* storage blocked */ }
    return;
  }
  try {
    await Promise.all(ids.slice(0, 100).map((id) => setPropertySaved(userId, id, true)));
    localStorage.removeItem(BROWSER_SAVES_KEY);
  } catch (error) {
    console.error("Could not move this browser's saved homes into the account:", error);
  }
}
