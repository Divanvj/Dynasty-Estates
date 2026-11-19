import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db, isFirebaseConfigured } from "./firebase";
import { type PropertyRecord } from "./property-data";

export type VoteType = "like" | "love" | "reject";

export type CollectionMember = {
  userId: string;
  email: string;
  role: "owner" | "collaborator" | "viewer";
};

export type CollectionVote = {
  userId: string;
  propertyId: string;
  vote: VoteType;
  createdAt: string;
};

export type CollectionComment = {
  id: string;
  userId: string;
  userName: string;
  propertyId: string;
  text: string;
  createdAt: string;
};

export type PropertyCollection = {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  isPrivate: boolean;
  propertyIds: string[];
  members: CollectionMember[];
  votes: Record<string, Record<string, VoteType>>; // propertyId -> (userId -> vote)
  comments: CollectionComment[];
  createdAt: string;
};

export async function getUserCollections(userId: string): Promise<PropertyCollection[]> {
  // A made-up "Pretoria East Shortlist" (with comments from "Sarah" and
  // "David") used to be returned when Firebase was off or the account had no
  // collections. An account with none now has none.
  if (!isFirebaseConfigured || !db) {
    return [];
  }

  try {
    const q = query(collection(db, "collections"), where("ownerId", "==", userId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title ?? "Untitled Collection",
        description: data.description ?? "",
        ownerId: data.ownerId ?? userId,
        isPrivate: Boolean(data.isPrivate),
        propertyIds: Array.isArray(data.propertyIds) ? data.propertyIds : [],
        members: Array.isArray(data.members) ? data.members : [],
        votes: data.votes ?? {},
        comments: Array.isArray(data.comments) ? data.comments : [],
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
      };
    });
  } catch (error) {
    // The rule for `collections` is owner-scoped, so this query must keep
    // filtering on ownerId == the signed-in uid or it is denied wholesale.
    // Returning demo collections on failure hid that completely.
    console.error("Collections query failed:", error);
    throw new Error("Unable to load your collections.", { cause: error });
  }
}

export async function createCollection({
  ownerId,
  ownerEmail,
  title,
  description,
  isPrivate = true,
}: {
  ownerId: string;
  ownerEmail: string;
  title: string;
  description: string;
  isPrivate?: boolean;
}): Promise<string> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase database is not configured.");
  }

  const docRef = await addDoc(collection(db, "collections"), {
    ownerId,
    title,
    description,
    isPrivate,
    propertyIds: [],
    members: [{ userId: ownerId, email: ownerEmail, role: "owner" }],
    votes: {},
    comments: [],
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function addPropertyToCollection(collectionId: string, propertyId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "collections", collectionId);
      // arrayUnion, not a rebuilt array: this used to write `[propertyId]` for
      // every stored collection, replacing the homes already in it.
      await updateDoc(docRef, {
        propertyIds: arrayUnion(propertyId),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      // Swallowing this left the property added to the in-memory array only, so
      // the UI showed it while the write had been denied.
      console.error("Failed to add property to collection:", error);
      throw new Error("Could not save the property to this collection.", { cause: error });
    }
  }
}

export async function castVote(
  collectionId: string,
  propertyId: string,
  userId: string,
  vote: VoteType,
): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "collections", collectionId);
      await updateDoc(docRef, {
        [`votes.${propertyId}.${userId}`]: vote,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to record vote:", error);
      throw new Error("Could not record your vote.", { cause: error });
    }
  }
}

export async function addCollectionComment(
  collectionId: string,
  propertyId: string,
  userId: string,
  userName: string,
  text: string,
): Promise<CollectionComment> {
  const newComment: CollectionComment = {
    id: `comm-${Date.now()}`,
    userId,
    userName,
    propertyId,
    text,
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "collections", collectionId);
      // arrayUnion: writing `[newComment]` here replaced every earlier comment.
      await updateDoc(docRef, {
        comments: arrayUnion(newComment),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to save comment:", error);
      throw new Error("Could not post your comment.", { cause: error });
    }
  }

  return newComment;
}

export function getPropertiesForCollection(propertyIds: string[], catalogue: PropertyRecord[]): PropertyRecord[] {
  return catalogue.filter((p) => propertyIds.includes(p.id) || propertyIds.includes(p.slug));
}

