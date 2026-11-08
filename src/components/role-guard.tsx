"use client";

import Link from "next/link";
import { LockIcon } from "@/components/icons";
import { useAuth } from "@/components/auth-provider";
import { useUserRole, type UserRole } from "@/lib/use-user-role";

function formatRoleList(roles: UserRole[]): string {
  if (roles.length <= 1) return roles.join("");
  return `${roles.slice(0, -1).join(", ")} or ${roles[roles.length - 1]}`;
}

export default function RoleGuard({
  allowedRoles,
  featureName,
  allowAnySignedIn = false,
  children,
}: {
  allowedRoles: UserRole[];
  featureName: string;
  /**
   * Admit any authenticated account, whatever its role. For features that are
   * open to everyone with an account rather than reserved to a claim — selling
   * privately being the case this exists for, since the Firestore rules already
   * allow any signed-in owner to file a Draft listing.
   *
   * `allowedRoles` still matters alongside it: those roles pass without waiting
   * for the auth state to resolve, because the role mirror is readable the
   * moment the component mounts.
   */
  allowAnySignedIn?: boolean;
  children: React.ReactNode;
}) {
  const { role, isMounted } = useUserRole();
  const { user, demoUser } = useAuth();
  const signedIn = Boolean(user || demoUser);

  // If role matches, render immediately
  if (allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  if (allowAnySignedIn && signedIn) {
    return <>{children}</>;
  }

  // During SSR or the initial hydration pass before client state syncs, render a
  // neutral skeleton to prevent layout shift or an access-denied flash.
  //
  // Deliberately NOT gated on the auth provider's `loading` flag as well. That
  // was the first version, to spare a signed-in seller a frame of "sign in" —
  // but `loading` is set only inside the onAuthStateChanged callback, and on a
  // cold load with no session that callback was not observed to fire, leaving
  // this stuck on the skeleton forever. Showing the denied panel early is
  // recoverable: it carries a sign-in link, and the component re-renders into
  // the content the moment the session arrives. An endless skeleton is not.
  if (!isMounted) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-4 py-12 text-slate-900 flex items-center justify-center dark:text-white">
        <div className="mx-auto max-w-lg w-full rounded-panel border border-white/80 bg-white/60 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.1)] backdrop-blur-xl text-center dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 dark:bg-surface-ink/80 dark:border dark:border-white/10 animate-pulse" />
          <div className="mt-4 mx-auto h-4 w-32 rounded-full bg-slate-200 dark:bg-surface-ink/80 animate-pulse" />
          <div className="mt-3 mx-auto h-7 w-48 rounded-xl bg-slate-200 dark:bg-surface-ink/80 animate-pulse" />
          <div className="mt-3 mx-auto h-4 w-64 rounded-full bg-slate-200 dark:bg-surface-ink/80 animate-pulse" />
        </div>
      </main>
    );
  }

  const recommendedRole = allowedRoles[0];
  const isSignedIn = Boolean(user || demoUser);

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-12 text-slate-900 flex items-center justify-center dark:text-white">
      <div className="mx-auto max-w-lg w-full rounded-panel border border-white/80 bg-white/60 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.1)] backdrop-blur-xl text-center dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 shadow-md dark:bg-emerald-600/30 dark:border dark:border-emerald-500/40 dark:shadow-[0_0_20px_rgba(16,185,129,0.25)]">
          <LockIcon className="h-6 w-6 text-white dark:text-emerald-400" />
        </div>

        <span className="mt-4 inline-block rounded-full bg-slate-200/80 px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-600 dark:bg-surface-ink/80 dark:border dark:border-white/10 dark:text-emerald-400">
          {allowAnySignedIn ? "Sign In Required" : "Role Restricted View"}
        </span>

        <h1 className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">
          {featureName} Access
        </h1>

        {/* An open feature that someone simply is not signed in for is not a
            permissions problem, and saying "reserved for Seller accounts" to a
            visitor who only needs an account would send them looking for a role
            they do not need. */}
        <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {allowAnySignedIn ? (
            <>
              Sign in to continue. Any Dynasty Estates account can list a property
              privately — you do not need a seller or agency role to begin.
            </>
          ) : (
            <>
              You are currently viewing Dynasty Estates in{" "}
              <strong className="text-slate-900 font-bold dark:text-white">{role} Mode</strong>.
              This feature is reserved for <strong>{formatRoleList(allowedRoles)}</strong> accounts.
              {isSignedIn
                ? " Sign in with an account that holds that role to continue."
                : ` Sign in with ${recommendedRole} credentials to continue.`}
            </>
          )}
        </p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            href="/auth/login"
            className="rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all dark:bg-emerald-700 dark:hover:bg-emerald-800 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
          >
            {isSignedIn ? "Sign in as another account →" : "Sign in →"}
          </Link>
          <Link
            href="/search"
            className="rounded-xl border border-slate-300/80 bg-white/70 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-white transition-all dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300 dark:hover:bg-white/10"
          >
            ← Browse Catalogue
          </Link>
        </div>
      </div>
    </main>
  );
}

