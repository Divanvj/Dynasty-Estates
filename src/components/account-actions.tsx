"use client";

import Link from "next/link";

import {
  BriefcaseIcon,
  HeartIcon,
  HomeIcon,
  ShieldIcon,
  UserIcon,
} from "@/components/icons";
import ThemeToggle from "@/components/theme-toggle";
import { useAuth } from "@/components/auth-provider";
import { useUserRole, type UserRole } from "@/lib/use-user-role";

const ROLE_BADGES: Record<UserRole, { label: string; icon: typeof UserIcon; tone: string }> = {
  Buyer: { label: "Buyer / Renter", icon: UserIcon, tone: "text-slate-500" },
  Seller: { label: "Private Seller", icon: HomeIcon, tone: "text-slate-500" },
  Agent: { label: "Property Practitioner", icon: BriefcaseIcon, tone: "text-emerald-600" },
  Admin: { label: "Platform Moderator", icon: ShieldIcon, tone: "text-purple-600" },
};

export default function AccountActions() {
  const { user: firebaseUser, demoUser, profile, signOut } = useAuth();
  const { role: activeRole } = useUserRole();

  const user = firebaseUser || demoUser;
  const userDisplayName =
    profile?.displayName ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Account";

  const roleBadge = ROLE_BADGES[activeRole];
  const RoleBadgeIcon = roleBadge.icon;

  async function handleSignOut() {
    await signOut();
  }

  const renderAuthButton = () => {
    if (user) {
      return (
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            title={userDisplayName}
            className="hidden xl:inline-flex max-w-[110px] truncate text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            {userDisplayName}
          </span>
          <button
            type="button"
            onClick={() => {
              void handleSignOut();
            }}
            className="rounded-full border border-slate-300/80 bg-white/60 dark:border-white/10 dark:bg-[#060d0e]/60 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/10 hover:text-emerald-900 dark:hover:text-emerald-300 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            Sign out
          </button>
        </div>
      );
    }

    return (
      <Link
        href="/auth/login"
        className="tap-44 relative rounded-full border border-slate-300/80 bg-white/60 dark:border-white/10 dark:bg-[#060d0e]/60 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/10 hover:text-emerald-900 dark:hover:text-emerald-300 transition-all whitespace-nowrap shrink-0"
      >
        Sign in
      </Link>
    );
  };

  return (
    <div className="relative z-50 flex min-w-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
      {/* Theme Toggle (Light / Dark Mode Switcher) */}
      <ThemeToggle />

      {/* Read-only role badge — the role comes from the signed-in account */}
      {user && (
        <div
          title={roleBadge.label}
          className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-slate-300/80 bg-white/70 dark:border-white/10 dark:bg-[#060d0e]/80 px-2.5 sm:px-3.5 py-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200 shadow-sm whitespace-nowrap"
        >
          <RoleBadgeIcon className={`h-3.5 w-3.5 ${roleBadge.tone}`} />
          <span className="hidden sm:inline uppercase tracking-wider text-[10px] text-slate-400 dark:text-slate-500">Role:</span>
          {/* Narrow phones get the icon alone — the role is already evident from
              the workspace you are in, and the words cost ~40px of header. */}
          <span className="hidden min-[400px]:inline">{activeRole}</span>
        </div>
      )}

      {/* Role-Specific Action Buttons */}
      {activeRole === "Buyer" && (
        <>
          <Link
            href="/saved"
            className="hidden lg:flex items-center gap-1 rounded-full border border-slate-300/80 bg-white/60 dark:border-white/10 dark:bg-[#060d0e]/60 px-2 sm:px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/10 hover:text-emerald-900 dark:hover:text-emerald-300 transition-all whitespace-nowrap shrink-0"
            title="Saved Properties"
          >
            <HeartIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400 sm:hidden" />
            <span className="hidden sm:inline">Saved</span>
          </Link>
          <Link
            href="/inquiries"
            className="hidden rounded-full border border-slate-300/80 bg-white/60 dark:border-white/10 dark:bg-[#060d0e]/60 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/10 hover:text-emerald-900 dark:hover:text-emerald-300 transition-all md:block shrink-0"
          >
            Requests
          </Link>
          {renderAuthButton()}
        </>
      )}

      {activeRole === "Seller" && (
        <>
          <Link
            href="/seller/portal"
            className="hidden rounded-full border border-slate-300/80 bg-white/60 dark:border-white/10 dark:bg-[#060d0e]/60 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/10 sm:block shrink-0"
          >
            Portal
          </Link>
          <Link
            href="/seller/listings/new"
            className="hidden lg:block rounded-full bg-gradient-to-r from-[#0b4d4e] to-[#07393a] hover:from-[#0d595b] hover:to-[#094344] dark:from-emerald-700 dark:to-emerald-800 dark:hover:from-emerald-600 dark:hover:to-emerald-700 px-2.5 sm:px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-950/20 border border-emerald-400/30 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all whitespace-nowrap shrink-0"
          >
            <span className="hidden sm:inline">List Property</span>
            <span className="sm:hidden">+ List</span>
          </Link>
          {renderAuthButton()}
        </>
      )}

      {activeRole === "Agent" && (
        <>
          <Link
            href="/agent/dashboard"
            className="hidden rounded-full border border-slate-300/80 bg-white/60 dark:border-white/10 dark:bg-[#060d0e]/60 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/10 sm:block shrink-0"
          >
            Console
          </Link>
          <Link
            href="/seller/listings/new"
            className="hidden lg:block rounded-full bg-gradient-to-r from-[#0b4d4e] to-[#063334] hover:from-[#0d595b] hover:to-[#094344] dark:from-emerald-700 dark:to-emerald-800 dark:hover:from-emerald-600 dark:hover:to-emerald-700 px-2.5 sm:px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-950/20 border border-emerald-400/30 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all whitespace-nowrap shrink-0"
          >
            <span className="hidden sm:inline">+ Add Mandate</span>
            <span className="sm:hidden">+ Add</span>
          </Link>
          {renderAuthButton()}
        </>
      )}

      {activeRole === "Admin" && (
        <>
          <Link
            href="/admin"
            className="hidden lg:block rounded-full bg-gradient-to-r from-[#0b4d4e] to-[#1e1b4b] hover:from-[#0d595b] hover:to-[#2e1065] dark:from-emerald-700 dark:to-indigo-900 dark:hover:from-emerald-600 dark:hover:to-indigo-800 px-2.5 sm:px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-950/20 border border-emerald-400/30 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all whitespace-nowrap shrink-0"
          >
            <span className="hidden sm:inline">Admin Console</span>
            <span className="sm:hidden">Admin</span>
          </Link>
          {renderAuthButton()}
        </>
      )}
    </div>
  );
}
