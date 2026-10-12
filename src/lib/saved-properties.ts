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
