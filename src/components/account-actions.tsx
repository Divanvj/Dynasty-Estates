"use client";

import Link from "next/link";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BriefcaseIcon,
  ChevronDownIcon,
  FolderIcon,
  HeartIcon,
  HomeIcon,
  InfoCircleIcon,
  ShieldIcon,
  TagIcon,
  UserIcon,
  XMarkIcon,
} from "@/components/icons";
import ThemeToggle from "@/components/theme-toggle";
import { useAuth } from "@/components/auth-provider";
import { accountCan, useIsDeveloperAccount, useUserRole, type UserRole } from "@/lib/use-user-role";
import { createSupportRequest } from "@/lib/support-requests";

const ROLE_BADGES: Record<UserRole, { label: string; icon: typeof UserIcon; tone: string }> = {
  Buyer: { label: "Buyer / Renter", icon: UserIcon, tone: "text-slate-600" },
  Seller: { label: "Private Seller", icon: HomeIcon, tone: "text-slate-600" },
  Agent: { label: "Property Practitioner", icon: BriefcaseIcon, tone: "text-emerald-600" },
  Admin: { label: "Platform Moderator", icon: ShieldIcon, tone: "text-purple-600" },
  Developer: { label: "Platform Developer", icon: ShieldIcon, tone: "text-sky-700" },
};

/** Dispatched on `window` by the phone tab bar's Account tab. */
export const OPEN_ACCOUNT_MENU_EVENT = "dynasty:open-account-menu";

export default function AccountActions({ showOnMobile = false }: { showOnMobile?: boolean } = {}) {
  const { user: firebaseUser, demoUser, profile, signOut } = useAuth();
  const { role: activeRole } = useUserRole();
  const developerAccount = useIsDeveloperAccount();

  const [isOpen, setIsOpen] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSent, setSupportSent] = useState(false);
  const [supportSending, setSupportSending] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  /** Set when the menu is opened from the keyboard, so focus follows it in.
   *  Opening with the mouse deliberately does not move focus. */
  const focusFirstOnOpenRef = useRef(false);

  /** Everything focusable in the panel: the links, the theme switch, Support,
   *  and the sign in / out control at the foot. */
  function panelItems() {
    const panel = panelRef.current;
    return panel
      ? Array.from(panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"))
      : [];
  }

  function closeAndRestoreFocus() {
    const trigger = triggerRef.current;
    setIsOpen(false);
    trigger?.focus();
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusFirstOnOpenRef.current = true;
      setIsOpen(true);
    } else if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      closeAndRestoreFocus();
    }
  }

  /** Roving focus inside the open panel. Tab still works and still leaves. */
  function handlePanelKeyDown(event: React.KeyboardEvent) {
    const items = panelItems();
    if (items.length === 0) return;

    const index = items.indexOf(document.activeElement as HTMLElement);
    const focusAt = (next: number) => {
      event.preventDefault();
      items[(next + items.length) % items.length]?.focus();
    };

    if (event.key === "ArrowDown") focusAt(index + 1);
    else if (event.key === "ArrowUp") focusAt(index - 1);
    else if (event.key === "Home") focusAt(0);
    else if (event.key === "End") focusAt(items.length - 1);
    else if (event.key === "Escape") {
      event.preventDefault();
      closeAndRestoreFocus();
    }
  }

  // Focus the first item when the panel was opened from the keyboard, before
  // paint rather than as a visible jump.
  useLayoutEffect(() => {
    if (!isOpen || !focusFirstOnOpenRef.current) return;
    focusFirstOnOpenRef.current = false;
    panelItems()[0]?.focus();
  }, [isOpen]);

  const user = firebaseUser || demoUser;
  const userDisplayName =
    profile?.displayName ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Account";

  // Capabilities need the auth state as well as the role — selling privately
  // turns on having an account, not on holding a claim.
  const can = (capability: Parameters<typeof accountCan>[0]) =>
    accountCan(capability, { role: activeRole, signedIn: Boolean(user), developer: developerAccount });

  const userEmail = user?.email || (demoUser ? `${demoUser.email}` : "Guest Explorer");
  const roleBadge = ROLE_BADGES[activeRole];
  const RoleBadgeIcon = roleBadge.icon;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // The tab bar's Account tab toggles this menu itself; closing it here
      // first would make every tap on an open menu close-then-reopen.
      if ((event.target as Element | null)?.closest?.("[data-account-tab]")) return;
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      // The modal sits above the menu, so it gets the first Escape. Closing the
      // menu instead would leave the dialog stranded over the page.
      if (showSupportModal) {
        setShowSupportModal(false);
        setSupportSent(false);
        return;
      }
      if (isOpen) {
        // Hand focus back to the control that opened the menu; it was being left
        // wherever it happened to be, which drops a keyboard user at the top of
        // the document.
        const trigger = triggerRef.current;
        setIsOpen(false);
        trigger?.focus();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, showSupportModal]);

  /*
    The phone tab bar's Account tab opens this menu (MobileNav dispatches the
    event). Only the instance in MobileAppBar (`showOnMobile`) listens: the
    desktop one is hidden below `lg`, and opening both would stack two panels.
    The tab is at the bottom and the menu opens under the app bar at the top,
    which is sticky, so it is on screen wherever the page is scrolled.
  */
  useEffect(() => {
    if (!showOnMobile) return;
    function handleOpenRequest() {
      setIsOpen((wasOpen) => !wasOpen);
    }
    window.addEventListener(OPEN_ACCOUNT_MENU_EVENT, handleOpenRequest);
    return () => window.removeEventListener(OPEN_ACCOUNT_MENU_EVENT, handleOpenRequest);
  }, [showOnMobile]);

  async function handleSignOut() {
    setIsOpen(false);
    await signOut();
  }

  // Used to show "Message Received" after a timer with nothing stored. It now
  // files the message in `support_requests`; admins read it on /admin. No
  // email is sent (there is no mail service or support inbox yet).
  async function handleSupportSubmit(e: React.FormEvent) {
    e.preventDefault();
    const message = supportMessage.trim();
    if (!message) return;
    if (!firebaseUser) {
      setSupportError("Sign in to send a support request.");
      return;
    }
    setSupportSending(true);
    setSupportError(null);
    try {
      await createSupportRequest({ userId: firebaseUser.uid, userEmail: firebaseUser.email, message });
      setSupportSent(true);
      setSupportMessage("");
    } catch {
      setSupportError("Your request could not be saved. Please try again.");
    } finally {
      setSupportSending(false);
    }
  }

  function closeSupport() {
    setShowSupportModal(false);
    setSupportSent(false);
    setSupportError(null);
  }

  return (
    // Hidden below `lg` by default, for the same reason as BrandLogo: the
    // account control lives once on a phone, in MobileAppBar, which opts back
    // in with `showOnMobile`. Every other call site is a page header the app
    // bar now sits above, and two Profile triggers stacked on each other was
    // 140px of chrome before any content.
    <div
      className={`relative z-50 items-center gap-2 sm:gap-3 shrink-0 ${
        showOnMobile ? "flex" : "hidden lg:flex"
      }`}
    >
      {/*
        The theme switch used to sit here, outside the menu. At `lg` — the width
        at which the desktop nav first appears — a signed-in header measured only
        40px between the nav and these controls, and the switch plus its gap
        accounted for 100px of the row. It now lives inside the menu below with
        the other per-account preferences, which is also where the brief asks for
        account items to be consolidated. It is one click away, not removed.
      */}

      {/* 1. Unified Profile Icon Button with Reveal Text Hover Animation */}
      <div className="relative" ref={menuRef}>
        {/*
          A disclosure, not a `role="menu"` — the same reasoning as the Sell and
          Tools dropdowns in site-navigation.tsx. A menu role puts screen readers
          into application mode, where these entries stop being announced as the
          links they are.
        */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          onKeyDown={handleTriggerKeyDown}
          /* h-11 (44px) is deliberate: one step above the 40px `pill` tier, so
             Profile reads as slightly more prominent than the actions beside it
             rather than the accidental 46px its avatar used to produce. The
             32px avatar plus p-1.5 comes to 44 exactly, and box-sizing absorbs
             the border. Not the `pill-lg` class, because that carries 24px of
             inline padding, which is wrong for a control fronted by an avatar. */
          className="group relative flex h-11 items-center gap-1.5 sm:gap-2 rounded-full border border-slate-300/80 bg-white/70 dark:border-white/10 dark:bg-surface-ink/80 p-1 sm:p-1.5 pr-2.5 sm:pr-3 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-surface-panel hover:border-emerald-500/50 dark:hover:border-emerald-400/50 transition-all cursor-pointer shadow-xs"
          aria-expanded={isOpen}
          aria-controls="account-menu-panel"
          title="Account & Profile Menu"
        >
          {/* Avatar Icon */}
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 group-hover:bg-emerald-500/10 dark:group-hover:bg-emerald-500/20 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
            <UserIcon className="h-4 w-4" />
          </div>

          {/* Reveal Text Hover Animation: Smoothly expands on hover */}
          <span className="inline-block max-w-[55px] sm:max-w-[80px] lg:max-w-[70px] lg:group-hover:max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap transition-all duration-300 ease-out">
            {user ? userDisplayName : "Profile"}
          </span>

          <ChevronDownIcon
            className={`h-3 w-3 text-slate-600 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-emerald-600 dark:text-emerald-400" : ""
            }`}
          />
        </button>

        {/* 2. Consolidated Profile Dropdown Menu */}
        {isOpen && (
          <div
            id="account-menu-panel"
            ref={panelRef}
            onKeyDown={handlePanelKeyDown}
            className="absolute right-0 top-full mt-2 w-76 sm:w-80 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#071315] p-3 shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-150"
          >
            {/* User Identity Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold text-sm">
                {userDisplayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {userDisplayName}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {userEmail}
                </p>
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <RoleBadgeIcon className={`h-3 w-3 ${roleBadge.tone}`} />
                  <span>{activeRole}</span>
                </div>
              </div>
            </div>

            {/*
              This was a Buyer / Seller / Agent picker, which let anyone — including
              a signed-out visitor — award themselves a role by clicking it.

              Roles are not preferences. Under the Property Practitioners Act a
              person may not act as a property practitioner in South Africa without
              a valid Fidelity Fund Certificate, so "Agent" is a verified status.
              Both SA portals reflect that: Property24 and Private Property put
              agents behind a separate admin subdomain reached by application,
              with no switcher anywhere in the consumer site.

              So the account states what it is, and the menu below follows from it.
              Changing it is an auth-layer concern — a claim set server-side and
              read back by resolveUserRole — not a button.
            */}
            <div className="py-2.5 border-b border-slate-200/80 dark:border-white/10">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-500 mb-1.5">
                Account Type
              </p>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-100 px-2.5 py-2 dark:border-white/10 dark:bg-[#040e10]">
                <RoleBadgeIcon className={`h-3.5 w-3.5 shrink-0 ${roleBadge.tone}`} />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {roleBadge.label}
                </span>
              </div>
            </div>

            {/* Appearance — the theme switch, relocated from the header row. */}
            <div className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-200/80 dark:border-white/10">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-500">
                Appearance
              </p>
              <ThemeToggle size="sm" />
            </div>

            {/* Menu Links */}
            <div className="py-2 space-y-0.5">
              <Link
                href="/saved"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <HeartIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Saved Properties</span>
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-500 font-bold">View →</span>
              </Link>

              <Link
                href="/collections"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <FolderIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Collections</span>
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-500 font-bold">Collab →</span>
              </Link>

              <Link
                href="/inquiries"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <TagIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Enquiries & Requests</span>
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-500 font-bold">Inbox →</span>
              </Link>

              {/* Any signed-in account, matching the `allowAnySignedIn` guard on
                  /seller/portal and the Firestore rule behind it. Hiding it is
                  courtesy, not security — the guard and the rules enforce. */}
              {can("sell") && (
              <Link
                href="/seller/portal"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <HomeIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>My Listings & Stats</span>
                </span>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">+ Add</span>
              </Link>
              )}

              {/* Mirrors RoleGuard allowedRoles={["Agent","Admin"]} on
                  /agent/dashboard. A Buyer was being offered an agent console. */}
              {can("agency") && (
              <Link
                href="/agent/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <BriefcaseIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>My Agency / Console</span>
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-500 font-bold">Manage →</span>
              </Link>
              )}

              {/* Mirrors the claim check in src/lib/server/console-auth.ts. */}
              {can("console") && (
              <Link
                href="/console"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <ShieldIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Developer Console</span>
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-500 font-bold">Open →</span>
              </Link>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowSupportModal(true);
                }}
                className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
              >
                <span className="flex items-center gap-2.5">
                  <InfoCircleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Support & Guidance</span>
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-500 font-bold">Help →</span>
              </button>
            </div>

            {/* Authentication Action */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between">
              {user ? (
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="w-full text-center rounded-xl py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                >
                  Sign Out of Account
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center rounded-xl py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
                >
                  Sign In / Register
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Support & Guidance Modal */}
      {showSupportModal && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071315] p-6 shadow-2xl text-slate-900 dark:text-white">
            <button
              type="button"
              onClick={closeSupport}
              aria-label="Close"
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 cursor-pointer"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <InfoCircleIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold">Support & Guidance</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">Tricore Enterprises Customer Care</p>
              </div>
            </div>

            {supportSent ? (
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-center">
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Request saved</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  Our team will reply to {userEmail}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    How can we assist you?
                  </label>
                  <textarea
                    rows={3}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Describe your question regarding listing, buying, or valuation..."
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="rounded-xl bg-slate-100 dark:bg-white/5 p-3 text-xs space-y-1.5">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Helpful Resources:</p>
                  <Link
                    href="/calculators"
                    onClick={() => setShowSupportModal(false)}
                    className="block text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    • SARS Transfer Duty & Bond Calculator
                  </Link>
                  <Link
                    href="/insights"
                    onClick={() => setShowSupportModal(false)}
                    className="block text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    • South African Metro Property Trends & Deeds Data
                  </Link>
                </div>

                {supportError && (
                  <p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-2.5 text-xs font-medium text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-300">
                    {supportError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={supportSending}
                  className="w-full disabled:opacity-60 rounded-xl bg-gradient-to-r from-[#0b4d4e] to-[#07393a] py-2.5 text-xs font-bold text-white hover:from-[#0d595b] hover:to-[#094344] transition-all cursor-pointer shadow-md"
                >
                  {supportSending ? "Sending…" : "Send Inquiry to Support"}
                </button>
              </form>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
