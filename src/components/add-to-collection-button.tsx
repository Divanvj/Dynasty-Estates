"use client";

import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useRef, useState } from "react";

import { auth } from "@/lib/firebase";
import { CheckIcon, FolderIcon } from "@/components/icons";
import {
  addPropertyToCollection,
  getUserCollections,
  type PropertyCollection,
} from "@/lib/collections";

/**
 * Add this listing to one of the viewer's collections.
 *
 * This replaces a link that read "Add to Collection" and did nothing of the
 * sort: it navigated to /collections, which renders whatever is already in
 * `propertyIds` and has no way to put anything there. `addPropertyToCollection`
 * has been sitting in `src/lib/collections.ts` fully written — Firestore path,
 * in-memory fallback, error reporting — with no caller anywhere in the app.
 * This is that caller; the service is unchanged.
 *
 * Shaped like its neighbours in the listing header (PropertyShareButton,
 * SavePropertyButton): a `.pill` trigger whose label drops below `sm`, a
 * popover anchored to it, and a short toast for confirmation.
 */
export default function AddToCollectionButton({
  propertyId,
  propertyTitle,
}: {
  propertyId: string;
  propertyTitle: string;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<PropertyCollection[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Close on Escape or on a click outside. Both, not just the backdrop: the
  // popover sits inside a header that already owns several stacking contexts,
  // and a full-screen backdrop there would cover the controls beside it.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointerDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  async function handleOpen() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setError("");

    if (!user) return;

    setLoading(true);
    try {
      setCollections(await getUserCollections(user.uid));
    } catch (loadError) {
      // getUserCollections throws rather than substituting demo collections,
      // so a denied read has to be reported instead of showing an empty list
      // that reads as "you have no collections".
      console.error("Could not load collections:", loadError);
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load your collections.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handlePick(target: PropertyCollection) {
    setSavingId(target.id);
    setError("");
    try {
      await addPropertyToCollection(target.id, propertyId);
      setOpen(false);
      setToast(`Added to ${target.title}`);
      setTimeout(() => setToast(""), 2500);
    } catch (saveError) {
      console.error("Could not add to collection:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save the property to this collection.",
      );
    } finally {
      setSavingId(null);
    }
  }

  const alreadyIn = (target: PropertyCollection) => target.propertyIds.includes(propertyId);

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => void handleOpen()}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={`Add ${propertyTitle} to a collection`}
        aria-label={`Add ${propertyTitle} to a collection`}
        className="pill border border-slate-300/80 bg-white/60 font-semibold text-slate-700 transition-all hover:border-slate-400 hover:bg-white cursor-pointer dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:bg-surface-panel dark:hover:text-emerald-300"
      >
        <FolderIcon className="h-4 w-4 text-slate-700 dark:text-slate-300" />
        <span className="hidden sm:inline">Collection</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Add to a collection"
          className="absolute right-0 top-12 z-30 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-surface-panel dark:shadow-[0_20px_45px_rgba(0,0,0,0.6)]"
        >
          {!user ? (
            <div className="p-2 text-xs">
              <p className="font-semibold text-slate-900 dark:text-white">Sign in to save this</p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                Collections are tied to your account.
              </p>
              <Link
                href="/auth/login"
                className="pill-sm mt-2.5 w-full bg-slate-950 font-bold text-white hover:bg-slate-800 dark:bg-emerald-700 dark:hover:bg-emerald-800"
              >
                Sign in
              </Link>
            </div>
          ) : loading ? (
            <p className="p-3 text-xs font-medium text-slate-600 dark:text-slate-400">
              Loading your collections…
            </p>
          ) : error ? (
            <p role="alert" className="p-3 text-xs font-medium text-rose-700 dark:text-rose-300">
              {error}
            </p>
          ) : collections && collections.length > 0 ? (
            <ul className="max-h-64 overflow-y-auto">
              {collections.map((item) => {
                const inAlready = alreadyIn(item);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={inAlready || savingId !== null}
                      onClick={() => void handlePick(item)}
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent dark:text-slate-200 dark:hover:bg-white/10"
                    >
                      <span className="truncate">{item.title}</span>
                      {inAlready ? (
                        <CheckIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      ) : savingId === item.id ? (
                        <span className="shrink-0 text-slate-600">…</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-2 text-xs">
              <p className="font-semibold text-slate-900 dark:text-white">No collections yet</p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                Create one, then add homes to it.
              </p>
              <Link
                href="/collections"
                className="pill-sm mt-2.5 w-full border border-slate-300 bg-white font-bold text-slate-800 hover:bg-slate-50 dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-200 dark:hover:bg-white/10"
              >
                Open Collections
              </Link>
            </div>
          )}
        </div>
      )}

      {toast && (
        <span className="absolute right-0 top-12 z-20 whitespace-nowrap rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-bold text-white shadow-xl animate-in fade-in duration-200 dark:border-white/10 dark:bg-surface-panel dark:text-emerald-300 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]">
          {toast}
        </span>
      )}
    </div>
  );
}
