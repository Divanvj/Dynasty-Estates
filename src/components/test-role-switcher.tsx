"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { switchTestRole } from "@/lib/auth";
import { useIsDeveloperAccount, useUserRole, type UserRole } from "@/lib/use-user-role";

/**
 * Lets a developer account use the site as any role, for testing. Switching
 * changes the account's real `role` claim (server-side, /api/console/test-role),
 * so Firestore rules treat it exactly as that role; the account keeps its
 * developer flag, which is why this control stays available.
 */

export const TEST_ROLE_OPTIONS: Array<{ claim: "developer" | "buyer" | "seller" | "agent" | "admin"; persona: UserRole; hint: string }> = [
  { claim: "developer", persona: "Developer", hint: "Yourself, with the console" },
  { claim: "buyer", persona: "Buyer", hint: "Search, save, enquire" },
  { claim: "seller", persona: "Seller", hint: "List privately" },
  { claim: "agent", persona: "Agent", hint: "Practitioner workspace" },
  { claim: "admin", persona: "Admin", hint: "Moderation at /admin" },
];

export function useTestRoleSwitch(onSwitched?: (persona: UserRole) => void) {
  const { user } = useAuth();
  const { role } = useUserRole();
  const router = useRouter();
  const [pending, setPending] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function switchTo(option: (typeof TEST_ROLE_OPTIONS)[number], navigate: boolean) {
    if (!user || pending) return;
    setPending(option.persona);
    setError(null);
    try {
      const result = await switchTestRole(user, option.claim);
      onSwitched?.(result.role);
      if (navigate) router.push(result.landing);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not switch role.");
    } finally {
      setPending(null);
    }
  }

  return { role, pending, error, switchTo };
}

/** Floating control on the public site. Renders nothing for anyone but a signed-in developer account. */
export default function TestRoleDock() {
  const developer = useIsDeveloperAccount();
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { role, pending, error, switchTo } = useTestRoleSwitch(() => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // The console has the same control in its sidebar.
  if (!developer || !user || pathname?.startsWith("/console")) return null;

  const testing = role !== "Developer";

  return (
    <div
      ref={rootRef}
      // Above page content and the header (z-60), below dialogs (z-80+); clear of the mobile tab bar.
      className="fixed left-3 z-[70] bottom-[calc(var(--dyn-mobile-nav-h,64px)+env(safe-area-inset-bottom)+12px)] lg:bottom-4 lg:left-4"
    >
      {open ? (
        <div
          id="test-role-menu"
          className="absolute bottom-full left-0 mb-2 w-64 rounded-2xl border border-white/10 bg-slate-900 p-1.5 text-white shadow-[0_18px_40px_-12px_rgb(0_0_0/0.55)]"
        >
          <p className="px-2.5 pb-1.5 pt-1 text-xs font-medium text-slate-400">Use the site as</p>
          <ul>
            {TEST_ROLE_OPTIONS.map((option) => {
              const current = option.persona === role;
              return (
                <li key={option.claim}>
                  <button
                    type="button"
                    disabled={Boolean(pending)}
                    aria-current={current ? "true" : undefined}
                    onClick={() => (current ? setOpen(false) : void switchTo(option, true))}
                    className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-2.5 text-left hover:bg-white/[0.07] disabled:cursor-wait disabled:opacity-60"
                  >
                    <span>
                      <span className="block text-sm font-semibold">{option.persona}</span>
                      <span className="block text-xs text-slate-400">{option.hint}</span>
                    </span>
                    {pending === option.persona ? (
                      <span className="text-xs text-slate-400">Switching…</span>
                    ) : current ? (
                      <span className="text-xs font-semibold text-emerald-400">Current</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
          <Link
            href="/console"
            onClick={() => setOpen(false)}
            className="mt-1 flex min-h-10 items-center rounded-xl border-t border-white/10 px-2.5 text-xs font-semibold text-slate-300 hover:bg-white/[0.07] hover:text-white"
          >
            Open the developer console →
          </Link>
          {error ? <p className="px-2.5 pb-1.5 pt-1 text-xs text-rose-300">{error}</p> : null}
        </div>
      ) : null}

      <button
        type="button"
        aria-expanded={open}
        aria-controls="test-role-menu"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-slate-900/95 px-3.5 text-xs font-semibold text-white shadow-[0_10px_28px_-10px_rgb(0_0_0/0.6)] hover:bg-slate-800"
      >
        <span
          aria-hidden="true"
          className={testing ? "h-2 w-2 rounded-full bg-amber-400" : "h-2 w-2 rounded-full bg-emerald-400"}
        />
        {testing ? `Testing as ${role}` : "Developer"}
        <svg aria-hidden="true" viewBox="0 0 16 16" className={open ? "h-3 w-3 rotate-180" : "h-3 w-3"}>
          <path d="M4 10l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
