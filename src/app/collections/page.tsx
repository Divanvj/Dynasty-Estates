"use client";

import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";

import AccountActions from "@/components/account-actions";
import {
  AreaIcon,
  BathIcon,
  BedIcon,
  CarIcon,
  CheckIcon,
  CopyIcon,
  FolderIcon,
  HeartIcon,
  ThumbsUpIcon,
  XMarkIcon,
} from "@/components/icons";
import { auth } from "@/lib/firebase";
import {
  addCollectionComment,
  castVote,
  createCollection,
  getPropertiesForCollection,
  getUserCollections,
  type PropertyCollection,
  type VoteType,
} from "@/lib/collections";

export default function CollectionsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [collections, setCollections] = useState<PropertyCollection[]>([]);
  const [selectedColId, setSelectedColId] = useState<string>("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNotice, setInviteNotice] = useState("");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState("");

  function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteNotice(`Invite dispatched to ${inviteEmail}!`);
    setTimeout(() => {
      setInviteNotice("");
      setInviteEmail("");
      setShowInviteModal(false);
    }, 2000);
  }

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

    if (!auth) {
      void load("demo-user-1");
      return;
    }

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      void load(currentUser?.uid ?? "demo-user-1");
    });
  }, [selectedColId]);

  const activeCollection = collections.find((c) => c.id === selectedColId) ?? collections[0];
  const activeProperties = activeCollection ? getPropertiesForCollection(activeCollection.propertyIds) : [];

  async function handleCreateCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle) return;

    try {
      const newId = await createCollection({
        ownerId: user?.uid ?? "demo-user-1",
        ownerEmail: user?.email ?? "buyer@dynastyestates.co.za",
        title: newTitle,
        description: newDesc,
        isPrivate: true,
      });

      setCollections(await getUserCollections(user?.uid ?? "demo-user-1"));
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
    if (!activeCollection) return;
    const currentUid = user?.uid ?? "demo-user-1";

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

    const currentUid = user?.uid ?? "demo-user-1";
    const authorName = user?.displayName ?? "Me";

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
        <header className="relative z-50 mb-6 flex items-center justify-between rounded-[26px] border border-white/75 bg-white/45 px-3.5 sm:px-5 py-3 shadow-[0_12px_28px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <BrandLogo markOnly />
            <div>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-slate-500 hidden sm:block dark:text-slate-400">Collaborative Discovery</p>
              <h1 className="text-xs sm:text-sm font-semibold tracking-wide text-slate-900 dark:text-white">Collections</h1>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 gap-y-2 sm:gap-2.5">
            <Link
              href="/compare"
              className="rounded-full border border-slate-300/80 bg-white/60 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 hover:bg-white transition-all whitespace-nowrap shrink-0 dark:bg-[#060d0e]/60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
            >
              <span className="hidden sm:inline">Side-by-Side </span>Compare →
            </Link>
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-full bg-slate-950 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-white shadow-md hover:bg-slate-800 transition-all whitespace-nowrap shrink-0 cursor-pointer dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
            >
              <span className="hidden sm:inline">+ New Collection</span>
              <span className="sm:hidden">+ New</span>
            </button>
            <AccountActions />
          </div>
        </header>

        {loadError && (
          <p
            role="alert"
            className="mb-6 rounded-2xl border border-rose-300/80 bg-rose-50/80 p-3 text-xs font-medium text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300"
          >
            {loadError}
          </p>
        )}

        {/* Modal: Create Collection */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-2xl backdrop-blur-2xl dark:bg-[#0c1a1c] dark:border-white/10 dark:shadow-[0_25px_60px_rgba(0,0,0,0.8)]">
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Create Property Collection</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Create a shared shortlist for you and your partner, family, or property co-investors.
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
                    className="w-full rounded-2xl border border-slate-300/80 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
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
                    className="w-full rounded-2xl border border-slate-300/80 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
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
          </div>
        )}

        {/* Collection Selector Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {collections.map((col) => (
            <button
              key={col.id}
              onClick={() => setSelectedColId(col.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2.5 text-xs font-medium transition-all ${
                (activeCollection?.id === col.id)
                  ? "border border-slate-900 bg-slate-900 text-white shadow-md dark:border-emerald-500/50 dark:bg-emerald-600 dark:text-white dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                  : "border border-white/70 bg-white/45 text-slate-700 hover:bg-white/80 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:text-white"
              }`}
            >
              <FolderIcon className="h-4 w-4" />
              <span>{col.title}</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold dark:bg-[#0c1a1c] dark:border dark:border-white/10">
                {col.propertyIds.length}
              </span>
            </button>
          ))}
        </div>

        {/* Active Collection View */}
        {activeCollection ? (
          <div className="space-y-6">
            {/* Collection Metadata Card */}
            <div className="rounded-[30px] border border-white/80 bg-white/50 p-6 shadow-[0_16px_36px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400">Collaborative Shortlist</span>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950 md:text-3xl dark:text-white">{activeCollection.title}</h2>
                  <p className="mt-1 text-xs text-slate-600 md:text-sm dark:text-slate-300">{activeCollection.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {activeCollection.members.map((m, idx) => (
                      <span
                        key={idx}
                        title={`${m.email} (${m.role})`}
                        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-800 text-[10px] font-bold text-white shadow-sm dark:border-white/10"
                      >
                        {m.email.substring(0, 2).toUpperCase()}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{activeCollection.members.length} Collaborators</span>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(true)}
                    className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 cursor-pointer dark:bg-emerald-950/60 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-950/80"
                  >
                    + Invite Partner
                  </button>
                </div>
              </div>
            </div>

            {/* Invite Partner Modal */}
            {showInviteModal && (
              <div
                role="dialog"
                aria-modal="true"
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                onClick={() => setShowInviteModal(false)}
              >
                <div
                  className="w-full max-w-md rounded-3xl border border-white/80 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl text-slate-900 dark:bg-[#0c1a1c] dark:border-white/10 dark:shadow-[0_25px_60px_rgba(0,0,0,0.8)] dark:text-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between border-b border-slate-200 pb-3 dark:border-white/10">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider dark:text-emerald-400">
                        Shared Collaboration
                      </span>
                      <h3 className="text-base font-bold text-slate-950 dark:text-white">Invite to {activeCollection.title}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(false)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 hover:bg-slate-200 cursor-pointer dark:bg-[#060d0e]/80 dark:border dark:border-white/10 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:text-white"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>

                  {inviteNotice ? (
                    <div className="py-6 text-center">
                      <CheckIcon className="h-8 w-8 text-emerald-600 mx-auto" />
                      <p className="mt-2 text-xs font-bold text-emerald-800">{inviteNotice}</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSendInvite} className="mt-4 space-y-3 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 dark:text-slate-400">
                          Partner / Collaborator Email
                        </label>
                        <input
                          type="email"
                          required
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="partner@family.co.za"
                          className="w-full rounded-xl border border-slate-300 bg-white p-2.5 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof window !== "undefined") {
                              void navigator.clipboard?.writeText(window.location.href);
                              setInviteNotice("Direct invite link copied to clipboard!");
                              setTimeout(() => {
                                setInviteNotice("");
                                setShowInviteModal(false);
                              }, 2000);
                            }
                          }}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-white/10"
                        >
                          <CopyIcon className="h-3.5 w-3.5" />
                          <span>Copy Link</span>
                        </button>
                        <button
                          type="submit"
                          className="flex-1 rounded-xl bg-slate-950 py-2 text-xs font-bold text-white shadow-md hover:bg-slate-800 cursor-pointer dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                        >
                          Send Invite →
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
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
                    className="overflow-hidden rounded-[30px] border border-white/80 bg-white/55 shadow-[0_14px_34px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]"
                  >
                    <div
                      className="relative h-56 w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${prop.image})` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-4 left-4">
                        <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md dark:bg-[#0c1a1c]/90 dark:border dark:border-white/15">
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
                          <BedIcon className="h-3.5 w-3.5 text-slate-400 dark:text-emerald-400" />
                          <span>{prop.beds} Beds</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <BathIcon className="h-3.5 w-3.5 text-slate-400 dark:text-emerald-400" />
                          <span>{prop.baths} Baths</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <CarIcon className="h-3.5 w-3.5 text-slate-400 dark:text-emerald-400" />
                          <span>{prop.parking} Garages</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <AreaIcon className="h-3.5 w-3.5 text-slate-400 dark:text-emerald-400" />
                          <span>{prop.area}</span>
                        </span>
                      </div>

                      {/* Collaborative Voting Controls */}
                      <div className="mt-4 rounded-2xl border border-white/60 bg-white/40 p-3 dark:bg-[#060d0e]/60 dark:border-white/10">
                        <p className="mb-2 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Group Decision Votes</p>
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => void handleVote(prop.id, "love")}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:border-rose-500/25 dark:text-rose-300 dark:hover:bg-rose-950/60 cursor-pointer"
                          >
                            <HeartIcon className="h-3.5 w-3.5 text-rose-600 fill-current dark:text-rose-400" />
                            <span>Love</span>
                            <span className="rounded-full bg-rose-200/80 px-1.5 text-[10px] dark:bg-rose-900/50 dark:text-rose-200">{loves}</span>
                          </button>
                          <button
                            onClick={() => void handleVote(prop.id, "like")}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-500/30 cursor-pointer"
                          >
                            <ThumbsUpIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Like</span>
                            <span className="rounded-full bg-emerald-200/80 px-1.5 text-[10px] dark:bg-emerald-500/30 dark:text-emerald-200">{likes}</span>
                          </button>
                          <button
                            onClick={() => void handleVote(prop.id, "reject")}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100/70 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:text-white cursor-pointer"
                          >
                            <XMarkIcon className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                            <span>Reject</span>
                            <span className="rounded-full bg-slate-200/80 px-1.5 text-[10px] dark:bg-[#060d0e]/80 dark:text-slate-300">{rejects}</span>
                          </button>
                        </div>
                      </div>

                      {/* Threaded Discussion Comments */}
                      <div className="mt-4 space-y-2">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Shared Notes ({propComments.length})</p>
                        <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
                          {propComments.map((comm) => (
                            <div key={comm.id} className="rounded-xl border border-white/70 bg-white/70 p-2.5 text-xs dark:bg-[#060d0e]/60 dark:border-white/10">
                              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                                <span className="font-semibold text-slate-800 dark:text-slate-300">{comm.userName}</span>
                                <span>{new Date(comm.createdAt).toLocaleDateString()}</span>
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
                            className="flex-1 rounded-xl border border-slate-300/80 bg-white/80 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
                          />
                          <button
                            onClick={() => void handleSendComment(prop.id)}
                            className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer"
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
                          View Full Property Experience →
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

