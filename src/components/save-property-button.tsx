"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { auth } from "@/lib/firebase";
import { HeartIcon } from "@/components/icons";
import { isPropertySaved, setPropertySaved } from "@/lib/saved-properties";
import { trackListing } from "@/lib/track-client";

/**
 * Saves live in Firestore under the signed-in account, nowhere else. A signed-out
 * visitor is sent to sign in. This used to keep a browser-only list for
 * signed-out visitors (and as a silent fallback when a write failed), so a
 * "saved" home could vanish on another device or after clearing the browser.
 * Lists left in browsers by that version are moved into the account by /saved.
 */
export default function SavePropertyButton({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [saved, setSaved] = useState(false);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!auth) return;

    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setSaved(false);
        return;
      }
      try {
        setSaved(await isPropertySaved(currentUser.uid, propertyId));
      } catch (error) {
        console.error("Could not read whether this home is saved:", error);
      }
    });
  }, [propertyId]);

  async function handleSave() {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    setLoading(true);
    const nextSaved = !saved;

    try {
      await setPropertySaved(user.uid, propertyId, nextSaved);
      setSaved(nextSaved);
    } catch (error) {
      console.error("Could not update the saved home:", error);
      setToast("Couldn't save. Try again.");
      setTimeout(() => setToast(""), 2500);
      setLoading(false);
      return;
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
        title={!user ? "Sign in to save homes" : saved ? "Remove from saved" : "Save property"}
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
