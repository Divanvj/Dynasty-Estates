import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db, isFirebaseConfigured } from "./firebase";
import { fallbackProperties, type PropertyRecord } from "./property-data";

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

const fallbackCollections: PropertyCollection[] = [
  {
    id: "col-family-shortlist",
    title: "Our Pretoria East Shortlist",
    description: "Homes with solar resilience, large gardens for dogs, and secure estate perimeter.",
    ownerId: "demo-user-1",
    isPrivate: false,
    propertyIds: ["juniper-ridge", "silver-lakes"],
    members: [
      { userId: "demo-user-1", email: "sarah@dynastyestates.co.za", role: "owner" },
      { userId: "demo-user-2", email: "david@dynastyestates.co.za", role: "collaborator" },
    ],
    votes: {
      "juniper-ridge": {
        "demo-user-1": "love",
        "demo-user-2": "like",
      },
      "silver-lakes": {
        "demo-user-1": "like",
        "demo-user-2": "love",
      },
    },
    comments: [
      {
        id: "c1",
        userId: "demo-user-1",
        userName: "Sarah",
        propertyId: "juniper-ridge",
        text: "The kitchen island and natural light on the patio are perfect for weekends.",
        createdAt: "2026-09-02T10:15:00Z",
      },
      {
        id: "c2",
        userId: "demo-user-2",
        userName: "David",
        propertyId: "juniper-ridge",
        text: "Confirmed 8kW inverter and battery is included in the asking price!",
        createdAt: "2026-09-02T11:42:00Z",
      },
    ],
    createdAt: "2026-09-01T08:00:00Z",
  },
];

export async function getUserCollections(userId: string): Promise<PropertyCollection[]> {
  if (!isFirebaseConfigured || !db) {
    return fallbackCollections;
  }

  try {
    const q = query(collection(db, "collections"), where("ownerId", "==", userId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return fallbackCollections;

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
    // The `collections` collection has no security rules yet, so these reads are
    // denied by default. Returning demo collections hid that completely.
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
    const newCol: PropertyCollection = {
      id: `col-${Date.now()}`,
      title,
      description,
      ownerId,
      isPrivate,
      propertyIds: [],
      members: [{ userId: ownerId, email: ownerEmail, role: "owner" }],
      votes: {},
      comments: [],
      createdAt: new Date().toISOString(),
    };
    fallbackCollections.unshift(newCol);
    return newCol.id;
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
  const local = fallbackCollections.find((c) => c.id === collectionId);
  if (local && !local.propertyIds.includes(propertyId)) {
    local.propertyIds.push(propertyId);
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "collections", collectionId);
      await updateDoc(docRef, {
        propertyIds: local?.propertyIds ?? [propertyId],
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
  const local = fallbackCollections.find((c) => c.id === collectionId);
  if (local) {
    if (!local.votes[propertyId]) local.votes[propertyId] = {};
    local.votes[propertyId][userId] = vote;
  }

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

  const local = fallbackCollections.find((c) => c.id === collectionId);
  if (local) {
    local.comments.push(newComment);
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "collections", collectionId);
      await updateDoc(docRef, {
        comments: local?.comments ?? [newComment],
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to save comment:", error);
      throw new Error("Could not post your comment.", { cause: error });
    }
  }

  return newComment;
}

export function getPropertiesForCollection(propertyIds: string[]): PropertyRecord[] {
  return fallbackProperties.filter((p) => propertyIds.includes(p.id) || propertyIds.includes(p.slug));
}

