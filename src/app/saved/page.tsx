"use client";

import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";

import PropertyCardPhotos from "@/components/property-card-photos";
import {
  AreaIcon,
  BathIcon,
  BedIcon,
  HeartIcon,
  LocationPinIcon,
  XMarkIcon,
} from "@/components/icons";
import { auth } from "@/lib/firebase";
import { fallbackProperties, getPropertyList, type PropertyRecord } from "@/lib/property-data";
import { getSavedPropertyIds, setPropertySaved } from "@/lib/saved-properties";

export default function SavedPropertiesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadSavedHomes(currentUser: User | null) {
      setLoading(true);
      try {
        const allProperties = await getPropertyList();
        let savedIds: string[] = [];

        if (currentUser) {
          try {
            savedIds = await getSavedPropertyIds(currentUser.uid);
          } catch (savedIdsError) {
            // Non-fatal: fall through to the localStorage copy below, but do not
            // hide the failure — a denied read here is a rules problem.
            console.error("Could not read saved property ids from Firestore:", savedIdsError);
          }
        }

        // Check local storage if no user or no db saved
        if (savedIds.length === 0 && typeof window !== "undefined") {
          try {
            const stored = localStorage.getItem("dynasty_saved_properties");
            if (stored) savedIds = JSON.parse(stored);
          } catch {
            // ignore
          }
        }

        const matched = allProperties.filter((p) => savedIds.includes(p.id));
        // If empty on first visit, seed with first 2 properties for easy testing
        if (matched.length === 0 && savedIds.length === 0) {
          setProperties(fallbackProperties.slice(0, 2));
        } else {
          setProperties(matched);
        }
      } catch (err) {
        // Showing two demo homes here made a failed catalogue load look like a
        // saved list. Report it instead.
        console.error("Error loading saved properties:", err);
        setProperties([]);
        setMessage(
          err instanceof Error
            ? `${err.message} Please reload the page.`
            : "Unable to load your saved properties. Please reload the page.",
        );
      } finally {
        setLoading(false);
      }
    }

    if (!auth) {
      void loadSavedHomes(null);
      return;
    }

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      void loadSavedHomes(currentUser);
    });
  }, []);

  async function removeProperty(id: string) {
    try {
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("dynasty_saved_properties");
          if (stored) {
            const ids: string[] = JSON.parse(stored);
            localStorage.setItem(
              "dynasty_saved_properties",
              JSON.stringify(ids.filter((item) => item !== id))
            );
          }
        } catch {
          // ignore
        }
      }

      if (user) {
        try {
          await setPropertySaved(user.uid, id, false);
        } catch {
          // ignore
        }
      }

      setProperties((prev) => prev.filter((p) => p.id !== id));
      setMessage("Property removed from your shortlist.");
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setMessage("Failed to remove property.");
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-3 py-4 text-slate-900 md:px-8 dark:text-white">
      <div className="mx-auto max-w-6xl">
        {/* Navigation Header */}
        <div className="relative z-50 mb-6 flex items-center justify-between rounded-card border border-white/75 bg-white/45 px-3.5 sm:px-5 py-3 shadow-[0_12px_28px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_12px_28px_rgba(0,0,0,0.3)]">
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 gap-y-2 sm:gap-2.5">
            {/* The stray `hidden` on these two is gone.
                `.pill` is declared inside `@layer components` and Tailwind's
                utilities sit in a later layer, so a bare `hidden` beat the
                class's `display: inline-flex` outright — both of these, the
                page's only primary among them, rendered at NO width. The inner
                label spans show what was meant: the buttons always show, the
                wording shortens below sm. */}
            <Link
              href="/compare"
              className="pill border border-slate-300/80 bg-white/60 font-semibold text-slate-700 hover:bg-white transition-all dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-200 dark:hover:bg-surface-panel dark:hover:border-emerald-500/40 dark:hover:text-emerald-300"
            >
              <span className="hidden sm:inline">Compare Shortlist</span>
              <span className="sm:hidden">Compare</span> →
            </Link>
            <Link
              href="/search"
              className="pill bg-slate-950 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white dark:shadow-[0_0_15px_rgba(16,185,129,0.3)] font-bold text-white shadow-md hover:bg-slate-800 transition-all"
            >
              <span className="hidden sm:inline">Browse Catalogue</span>
              <span className="sm:hidden">Catalogue</span>
            </Link>
          </div>
        </div>

        {/* Hero Title */}
        <section className="rounded-panel border border-white/80 bg-white/55 p-6 shadow-[0_20px_45px_rgba(36,48,50,0.08)] backdrop-blur-xl mb-6 dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-500/30 px-3 py-1 text-xs uppercase font-bold tracking-widest text-emerald-800 dark:text-emerald-300">
            Buyer Shortlist
          </span>
          <h1 className="mt-2 text-3xl font-light tracking-tight text-slate-950 md:text-4xl dark:text-white">
            Your Saved Residences
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            Compare specs, review energy resilience, or add directly to your collaborative shortlists.
          </p>
        </section>

        {message && (
          <p className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{message}</p>
        )}

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 rounded-panel border border-white/60 bg-white/40 animate-pulse dark:bg-surface-panel/60 dark:border-white/10" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="rounded-panel border border-white/80 bg-white/50 p-12 text-center shadow-sm backdrop-blur-xl dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 dark:bg-surface-ink/80 shadow-md mb-3 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-white/10">
              <HeartIcon className="h-8 w-8 text-slate-600 dark:text-emerald-400" />
            </div>
            <h3 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">Your shortlist is empty</h3>
            <p className="mt-1 text-xs text-slate-600 max-w-md mx-auto dark:text-slate-300">
              Click the heart &ldquo;Save&rdquo; icon on any property in the catalogue to keep track of it here.
            </p>
            <Link
              href="/search"
              className="pill-lg mt-5 bg-slate-950 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white dark:shadow-[0_0_15px_rgba(16,185,129,0.3)] font-bold text-white shadow-md hover:bg-slate-800"
            >
              Explore Properties →
            </Link>
          </div>
        ) : (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <article
                key={property.id}
                // `relative` anchors the .card-link overlay on the title below;
                // `group` lets the button at the foot react to a hover anywhere
                // on the card, since the whole card is now the target.
                className="group relative overflow-hidden rounded-panel border border-white/80 bg-white/60 shadow-[0_16px_36px_rgba(36,48,50,0.08)] backdrop-blur-xl transition-all hover:shadow-xl dark:bg-surface-panel/75 dark:border-white/10 dark:shadow-[0_16px_36px_rgba(0,0,0,0.4)]"
              >
                <div className="relative h-56 bg-slate-200 dark:bg-surface-ink">
                  <PropertyCardPhotos
                    images={property.gallery?.length ? property.gallery : [property.image]}
                    title={property.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {/* z-30: removing is a different action from opening the
                      listing, so it has to stay above the card overlay. */}
                  <div className="absolute top-3 right-3 z-30">
                    <button
                      type="button"
                      onClick={() => void removeProperty(property.id)}
                      title="Remove from saved"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-rose-600 transition-colors cursor-pointer"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3 text-white">
                    <p className="text-xl font-extrabold">{property.price}</p>
                  </div>
                </div>

                <div className="p-5">
                  <span className="badge border border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-surface-ink/80 dark:text-slate-200">
                    {property.type}
                  </span>
                  {/* The card's one real link; `card-link` stretches it over
                      the whole card. See globals.css. */}
                  <h3 className="text-base font-bold text-slate-950 mt-1 dark:text-white">
                    <Link className="card-link" href={`/property/${property.slug || property.id}`}>
                      {property.title}
                    </Link>
                  </h3>
                  <p className="flex items-center gap-1 text-xs text-slate-600 mt-0.5 dark:text-slate-400">
                    <LocationPinIcon className="h-3.5 w-3.5 text-slate-600 shrink-0 dark:text-slate-400" />
                    <span>{property.location}</span>
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-200/70 dark:border-white/10 pt-3 text-xs text-slate-600 font-medium dark:text-slate-300">
                    <span className="flex items-center gap-1">
                      <BedIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                      <span>{property.beds} Beds</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <BathIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                      <span>{property.baths} Baths</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <AreaIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                      <span>{property.area}</span>
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-2">
                    {/* z-30 for the same reason as Remove: comparing is not
                        opening. */}
                    <Link
                      href="/compare"
                      className="relative z-30 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-emerald-300 transition-colors"
                    >
                      Compare →
                    </Link>
                    {/* A span, not a link: same destination as the title, so as
                        a link it duplicated the tab stop. */}
                    <span
                      aria-hidden="true"
                      className="rounded-full bg-slate-950 dark:bg-emerald-600 dark:group-hover:bg-emerald-500 dark:text-white dark:shadow-[0_0_15px_rgba(16,185,129,0.3)] px-4 py-1.5 text-xs font-bold text-white shadow-md group-hover:bg-slate-800 transition-all"
                    >
                      View Home →
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
