"use client";

import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { formatDate } from "@/lib/formatters";
import {
  AreaIcon,
  BathIcon,
  BedIcon,
  CarIcon,
  FolderIcon,
  HeartIcon,
  ThumbsUpIcon,
  XMarkIcon,
} from "@/components/icons";
import { auth } from "@/lib/firebase";
import { getPropertyList, type PropertyRecord } from "@/lib/property-data";
import {
  addCollectionComment,
  castVote,
  createCollection,
  getPropertiesForCollection,
  getUserCollections,
  type PropertyCollection,
  type VoteType,
} from "@/lib/collections";
import { useAuthHref } from "@/lib/use-return-path";

export default function CollectionsPage() {
  // Sign-in returns to this page (S1-7).
  const signInHref = useAuthHref();
  const [user, setUser] = useState<User | null>(null);
  const [collections, setCollections] = useState<PropertyCollection[]>([]);
  const [selectedColId, setSelectedColId] = useState<string>("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  // With Firebase off there is no sign-in to wait for.
  const [authReady, setAuthReady] = useState(!auth);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState("");
  // Homes in a collection are looked up in the live catalogue. They used to be
  // looked up in the built-in sample homes only, so a real listing added to a
  // collection never showed.
  const [catalogue, setCatalogue] = useState<PropertyRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    getPropertyList()
      .then((list) => {
        if (!cancelled) setCatalogue(list);
      })
      .catch((error) => console.error("Collections could not load the catalogue:", error));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    async function load(userId: string) {
      try {
        const cols = await getUserCollections(userId);
        setCollections(cols);
        setLoadError("");
        if (cols.length > 0 && !selectedColId) {
          setSelectedColId(cols[0].id);
        }
      } catch (error) {
        setCollections([]);
        setLoadError(
          error instanceof Error ? error.message : "Unable to load your collections.",
        );
      }
    }

    // Collections belong to an account. Signed out (or with Firebase off) the
    // page asks the visitor to sign in; it used to load a "demo-user-1" owner.
    if (!auth) return;

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (currentUser) void load(currentUser.uid);
      else setCollections([]);
    });
  }, [selectedColId]);

  const activeCollection = collections.find((c) => c.id === selectedColId) ?? collections[0];
  const activeProperties = activeCollection ? getPropertiesForCollection(activeCollection.propertyIds, catalogue) : [];

  async function handleCreateCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle || !user) return;

    try {
      const newId = await createCollection({
        ownerId: user.uid,
        ownerEmail: user.email ?? "",
        title: newTitle,
        description: newDesc,
        isPrivate: true,
      });

      setCollections(await getUserCollections(user.uid));
      setSelectedColId(newId);
      setNewTitle("");
      setNewDesc("");
      setShowCreateModal(false);
      setLoadError("");
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Could not create the collection.",
      );
    }
  }

  async function handleVote(propertyId: string, vote: VoteType) {
    if (!activeCollection || !user) return;
    const currentUid = user.uid;

    // The optimistic update below used to run even when the write was denied, so
    // a vote appeared to stick and vanished on reload.
    try {
      await castVote(activeCollection.id, propertyId, currentUid, vote);
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not record your vote.");
      return;
    }

    // Optimistic update
    setCollections((prev) =>
      prev.map((col) => {
        if (col.id !== activeCollection.id) return col;
        return {
          ...col,
          votes: {
            ...col.votes,
            [propertyId]: {
              ...(col.votes[propertyId] ?? {}),
              [currentUid]: vote,
            },
          },
        };
      })
    );
  }

  async function handleSendComment(propertyId: string) {
    if (!activeCollection) return;
    const text = commentInputs[propertyId]?.trim();
    if (!text) return;

    if (!user) return;
    const currentUid = user.uid;
    const authorName = user.displayName ?? "Me";

    let added;
    try {
      added = await addCollectionComment(activeCollection.id, propertyId, currentUid, authorName, text);
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not post your comment.");
      return;
    }

    setCollections((prev) =>
      prev.map((col) => {
        if (col.id !== activeCollection.id) return col;
        return {
          ...col,
          comments: [...col.comments, added],
        };
      })
    );

    setCommentInputs((prev) => ({ ...prev, [propertyId]: "" }));
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-3 py-4 text-slate-900 md:px-8 dark:text-white">
      <div className="mx-auto max-w-6xl">
        {/* Navigation Header */}
        <div className="relative z-50 mb-6 flex items-center justify-between rounded-card border border-white/75 bg-white/45 px-3.5 sm:px-5 py-3 shadow-[0_12px_28px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-600 hidden sm:block dark:text-slate-400">Your shortlists</p>
              <h1 className="text-xs sm:text-sm font-semibold tracking-wide text-slate-900 dark:text-white">Collections</h1>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 gap-y-2 sm:gap-2.5">
            <Link
              href="/compare"
              className="pill border border-slate-300/80 bg-white/60 font-semibold text-slate-700 hover:bg-white transition-all dark:bg-surface-ink/60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
            >
              Compare
            </Link>
            {user && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="pill border border-slate-300/80 bg-white/60 font-semibold text-slate-700 hover:bg-white transition-all cursor-pointer dark:bg-surface-ink/60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
            >
              <span className="hidden sm:inline">+ New Collection</span>
              <span className="sm:hidden">+ New</span>
            </button>
            )}
          </div>
        </div>

        {loadError && (
          <p
            role="alert"
            className="mb-6 rounded-2xl border border-rose-300/80 bg-rose-50/80 p-3 text-xs font-medium text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300"
          >
            {loadError}
          </p>
        )}

        {/* Modal: Create Collection */}
        {showCreateModal && createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-panel border border-white/80 bg-white/90 p-6 shadow-2xl backdrop-blur-2xl dark:bg-surface-panel dark:border-white/10 dark:shadow-[0_25px_60px_rgba(0,0,0,0.8)]">
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Create Property Collection</h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Group homes into a shortlist and mark each one Love, Like or Reject. Sharing a collection with someone else isn’t available yet.
              </p>
              <form onSubmit={handleCreateCollection} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="col-title" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Collection Name
                  </label>
                  <input
                    id="col-title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                    placeholder="e.g. Cape Town Waterfront Search"
                    className="w-full rounded-2xl border border-slate-300/80 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-white/10 dark:bg-surface-ink/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label htmlFor="col-desc" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Goal or Criteria
                  </label>
                  <textarea
                    id="col-desc"
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="e.g. 3+ bedrooms, mountain views, solar backup..."
                    className="w-full rounded-2xl border border-slate-300/80 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-white/10 dark:bg-surface-ink/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-full px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-500 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

        {/* Collection Selector Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {collections.map((col) => (
            <button
              key={col.id}
              onClick={() => setSelectedColId(col.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2.5 text-xs font-medium transition-all ${
                (activeCollection?.id === col.id)
                  ? "border border-slate-900 bg-slate-900 text-white shadow-md dark:border-emerald-500/50 dark:bg-emerald-700 dark:text-white dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                  : "border border-white/70 bg-white/45 text-slate-700 hover:bg-white/80 dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300 dark:hover:bg-surface-panel dark:hover:text-white"
              }`}
            >
              <FolderIcon className="h-4 w-4" />
              <span>{col.title}</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold dark:bg-surface-panel dark:border dark:border-white/10">
                {col.propertyIds.length}
              </span>
            </button>
          ))}
        </div>

        {/* Active Collection View */}
        {activeCollection ? (
          <div className="space-y-6">
            {/* Collection Metadata Card */}
            <div className="rounded-panel border border-white/80 bg-white/50 p-6 shadow-[0_16px_36px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <span className="text-xs uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400">Shortlist</span>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950 md:text-3xl dark:text-white">{activeCollection.title}</h2>
                  <p className="mt-1 text-xs text-slate-600 md:text-sm dark:text-slate-300">{activeCollection.description}</p>
                </div>
                {/* Sharing is not built: the rules let only the owner read a
                    collection. The "+ Invite Partner" dialog here showed
                    "Invite dispatched" and "Direct invite link copied" without
                    sending or sharing anything, so it is gone until sharing is. */}
                <p className="text-xs text-slate-600 dark:text-slate-400">Only you can see this collection.</p>
              </div>
            </div>

            {activeProperties.length === 0 && (
              <p className="rounded-card border border-white/70 bg-white/45 p-6 text-center text-sm text-slate-600 dark:border-white/10 dark:bg-surface-panel/60 dark:text-slate-300">
                No homes here yet. Use <span className="font-semibold">Collection</span> on any listing to add one.
              </p>
            )}

            {/* Property Cards in Collection */}
            <div className="grid gap-6 md:grid-cols-2">
              {activeProperties.map((prop) => {
                const propVotes = activeCollection.votes[prop.id] ?? {};
                const loves = Object.values(propVotes).filter((v) => v === "love").length;
                const likes = Object.values(propVotes).filter((v) => v === "like").length;
                const rejects = Object.values(propVotes).filter((v) => v === "reject").length;
                const propComments = activeCollection.comments.filter((c) => c.propertyId === prop.id);

                return (
                  <article
                    key={prop.id}
                    className="overflow-hidden rounded-panel border border-white/80 bg-white/55 shadow-[0_14px_34px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]"
                  >
                    <div
                      className="relative h-56 w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${prop.image})` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-4 left-4">
                        <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md dark:bg-surface-panel/90 dark:border dark:border-white/15">
                          {prop.price}
                        </span>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <h3 className="text-lg font-bold">{prop.title}</h3>
                        <p className="text-xs text-slate-200">{prop.location}</p>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300">
                        <span className="flex items-center gap-1">
                          <BedIcon className="h-3.5 w-3.5 text-slate-600 dark:text-emerald-400" />
                          <span>{prop.beds} Beds</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <BathIcon className="h-3.5 w-3.5 text-slate-600 dark:text-emerald-400" />
                          <span>{prop.baths} Baths</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <CarIcon className="h-3.5 w-3.5 text-slate-600 dark:text-emerald-400" />
                          <span>{prop.parking} Garages</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <AreaIcon className="h-3.5 w-3.5 text-slate-600 dark:text-emerald-400" />
                          <span>{prop.area}</span>
                        </span>
                      </div>

                      {/* Collaborative Voting Controls */}
                      <div className="mt-4 rounded-2xl border border-white/60 bg-white/40 p-3 dark:bg-surface-ink/60 dark:border-white/10">
                        <p className="mb-2 text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">Group Decision Votes</p>
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => void handleVote(prop.id, "love")}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:border-rose-500/25 dark:text-rose-300 dark:hover:bg-rose-950/60 cursor-pointer"
                          >
                            <HeartIcon className="h-3.5 w-3.5 text-rose-600 fill-current dark:text-rose-400" />
                            <span>Love</span>
                            <span className="rounded-full bg-rose-200/80 px-1.5 text-xs dark:bg-rose-900/50 dark:text-rose-200">{loves}</span>
                          </button>
                          <button
                            onClick={() => void handleVote(prop.id, "like")}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-500/30 cursor-pointer"
                          >
                            <ThumbsUpIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Like</span>
                            <span className="rounded-full bg-emerald-200/80 px-1.5 text-xs dark:bg-emerald-500/30 dark:text-emerald-200">{likes}</span>
                          </button>
                          <button
                            onClick={() => void handleVote(prop.id, "reject")}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100/70 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300 dark:hover:bg-surface-panel dark:hover:text-white cursor-pointer"
                          >
                            <XMarkIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                            <span>Reject</span>
                            <span className="rounded-full bg-slate-200/80 px-1.5 text-xs dark:bg-surface-ink/80 dark:text-slate-300">{rejects}</span>
                          </button>
                        </div>
                      </div>

                      {/* Threaded Discussion Comments */}
                      <div className="mt-4 space-y-2">
                        <p className="text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">Shared Notes ({propComments.length})</p>
                        <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
                          {propComments.map((comm) => (
                            <div key={comm.id} className="rounded-xl border border-white/70 bg-white/70 p-2.5 text-xs dark:bg-surface-ink/60 dark:border-white/10">
                              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                                <span className="font-semibold text-slate-800 dark:text-slate-300">{comm.userName}</span>
                                <span>{formatDate(comm.createdAt)}</span>
                              </div>
                              <p className="mt-1 text-slate-700 dark:text-slate-300">{comm.text}</p>
                            </div>
                          ))}
                        </div>

                        {/* Comment Input */}
                        <div className="flex gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Add your note or inquiry..."
                            value={commentInputs[prop.id] ?? ""}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({ ...prev, [prop.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                void handleSendComment(prop.id);
                              }
                            }}
                            className="flex-1 rounded-xl border border-slate-300/80 bg-white/80 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-white/10 dark:bg-surface-ink/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
                          />
                          <button
                            onClick={() => void handleSendComment(prop.id)}
                            className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-emerald-700 dark:hover:bg-emerald-800 dark:shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer"
                          >
                            Post
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-slate-200/50 pt-3 dark:border-white/10">
                        <Link
                          href={`/property/${prop.slug}`}
                          className="block text-center text-xs font-semibold text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300"
                        >
                          View home
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : authReady ? (
          <div className="rounded-panel border border-white/80 bg-white/50 p-12 text-center shadow-sm backdrop-blur-xl dark:bg-surface-panel/80 dark:border-white/10">
            <FolderIcon className="mx-auto h-8 w-8 text-slate-600 dark:text-emerald-400" />
            <h2 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
              {user ? "No collections yet" : "Sign in to see your collections"}
            </h2>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-600 dark:text-slate-300">
              {user
                ? "Group homes you are weighing up, vote on them and keep notes."
                : "Collections are kept with your account, so they are there on every device."}
            </p>
            {user ? (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="pill-lg mt-5 cursor-pointer bg-slate-950 px-6 font-bold text-white shadow-md hover:bg-slate-800 dark:bg-emerald-700 dark:hover:bg-emerald-800"
              >
                Create a collection
              </button>
            ) : (
              <Link
                href={signInHref}
                className="pill-lg mt-5 inline-flex bg-slate-950 px-6 font-bold text-white shadow-md hover:bg-slate-800 dark:bg-emerald-700 dark:hover:bg-emerald-800"
              >
                Sign in
              </Link>
            )}
          </div>
        ) : null}
      </div>
    </main>
  );
}

