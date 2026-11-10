"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState, useSyncExternalStore } from "react";

import { auth } from "@/lib/firebase";
import { HeartIcon } from "@/components/icons";
import { isPropertySaved, setPropertySaved } from "@/lib/saved-properties";
import { trackListing } from "@/lib/track-client";

const SAVED_STORAGE_KEY = "dynasty_saved_properties";
const SAVED_EVENT_NAME = "dynasty_saved_change";

function subscribeSaved(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(SAVED_EVENT_NAME, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SAVED_EVENT_NAME, callback);
  };
}

function isLocalSaved(propertyId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem(SAVED_STORAGE_KEY);
    if (stored) {
      const ids: unknown = JSON.parse(stored);
      return Array.isArray(ids) && ids.includes(propertyId);
    }
  } catch {
    return false;
  }
  return false;
}

export default function SavePropertyButton({ propertyId }: { propertyId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbSaved, setDbSaved] = useState<boolean | null>(null);
  const localSaved = useSyncExternalStore(
    subscribeSaved,
    () => isLocalSaved(propertyId),
    () => false
  );
  const saved = dbSaved !== null ? dbSaved : localSaved;

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!auth) return;

    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const isDb = await isPropertySaved(currentUser.uid, propertyId);
          setDbSaved(isDb);
        } catch {
          // fallback to local
        }
      } else {
        setDbSaved(null);
      }
    });
  }, [propertyId]);

  async function handleSave() {
    setLoading(true);
    const nextSaved = !saved;

    // Save to localStorage for instant client experience
    try {
      const stored = localStorage.getItem(SAVED_STORAGE_KEY);
      let ids: string[] = [];
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          ids = parsed.filter((id): id is string => typeof id === "string");
        }
      }
      if (nextSaved) {
        if (!ids.includes(propertyId)) ids.push(propertyId);
      } else {
        ids = ids.filter((id) => id !== propertyId);
      }
      localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(ids));
      window.dispatchEvent(new Event(SAVED_EVENT_NAME));
      window.dispatchEvent(new Event("storage"));
    } catch {
      // Continue
    }

    // Sync to Firestore if authenticated
    if (user) {
      try {
        await setPropertySaved(user.uid, propertyId, nextSaved);
        setDbSaved(nextSaved);
      } catch {
        // Fallback already in localStorage
      }
    }

    // One anonymous "save" on the listing owner's statistics. Removing a save
    // is not subtracted: the figure is "times saved", not "currently saved".
    if (nextSaved) trackListing(propertyId, "save");

    setToast(nextSaved ? "Saved to your shortlist!" : "Removed from shortlist");
    setTimeout(() => setToast(""), 2000);
    setLoading(false);
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={loading}
        title={saved ? "Remove from saved" : "Save property"}
        aria-label={saved ? "Saved property" : "Save property"}
        // `.pill` owns the geometry. Hand-rolled, this rendered 32px below sm
        // and 38px above it, so in the listing header it sat 2px short of the
        // Book a Viewing button beside it and 4px short of the back link, and
        // on a card it was a third size again. One class, one height, every
        // surface it appears on.
        //
        // `tap-44` stays: .pill is 40px, still under the 44px touch floor, and
        // it grows the hit area without changing the rendered size.
        className={`pill tap-44 relative font-bold transition-all cursor-pointer ${
          saved
            ? "border border-rose-400 bg-rose-50 text-rose-700 shadow-sm"
            : "border border-slate-300/80 bg-white/70 text-slate-700 hover:bg-white hover:border-slate-400"
        }`}
      >
        <HeartIcon
          className={`h-4 w-4 transition-transform active:scale-125 ${
            saved ? "fill-rose-600 text-rose-600" : "text-slate-600"
          }`}
          filled={saved}
        />
        <span className="hidden sm:inline">{saved ? "Saved" : "Save"}</span>
      </button>

      {toast && (
        <div className="absolute right-0 top-10 z-20 whitespace-nowrap rounded-xl border border-slate-200 bg-slate-950 px-2.5 py-1 text-xs font-bold text-white shadow-xl animate-in fade-in duration-200">
          {toast}
        </div>
      )}
    </div>
  );
}
