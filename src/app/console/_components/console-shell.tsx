"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import BrandLogo from "@/components/brand-logo";
import { useAuth } from "@/components/auth-provider";
import { TEST_ROLE_OPTIONS, useTestRoleSwitch } from "@/components/test-role-switcher";

import {
  ConsoleProvider,
  ConsoleRequestError,
  consoleJson,
  shortSha,
  type BuildInfo,
  type ConsoleCaller,
} from "../_lib/console-client";
import {
  BugIcon,
  CloseIcon,
  DashboardIcon,
  DatabaseIcon,
  ExternalIcon,
  GitIcon,
  LockSmallIcon,
  LogIcon,
  LogoutIcon,
  MenuLinesIcon,
  PulseIcon,
  RocketIcon,
  ScanIcon,
  ToggleIcon,
  UsersGearIcon,
  WrenchIcon,
} from "./console-icons";
import { Button, cx, ErrorNotice, Skeleton } from "./ui";

type NavItem = { href: string; label: string; icon: (p: { className?: string }) => React.ReactNode };

const NAV: Array<{ group: string; items: NavItem[] }> = [
  {
    group: "Overview",
    items: [
      { href: "/console", label: "Dashboard", icon: DashboardIcon },
      { href: "/console/go-live", label: "Go-live checklist", icon: RocketIcon },
    ],
  },
  {
    group: "Monitoring",
    items: [
      { href: "/console/errors", label: "Errors", icon: BugIcon },
      { href: "/console/performance", label: "Performance", icon: PulseIcon },
      { href: "/console/events", label: "Event log", icon: LogIcon },
    ],
  },
  {
    group: "Platform",
    items: [
      { href: "/console/deploys", label: "Deploys & code", icon: GitIcon },
      { href: "/console/firebase", label: "Firebase", icon: DatabaseIcon },
      { href: "/console/integrity", label: "Data integrity", icon: ScanIcon },
    ],
  },
  {
    group: "Operations",
    items: [
      { href: "/console/users", label: "Users & roles", icon: UsersGearIcon },
      { href: "/console/flags", label: "Site switches", icon: ToggleIcon },
      { href: "/console/tools", label: "Tools", icon: WrenchIcon },
    ],
  },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/console" ? pathname === "/console" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Developer accounts only: switch the account's real role claim to use the site
 * as that role (src/components/test-role-switcher.tsx has the details).
 */
function TestAs({ onSwitched }: { onSwitched: () => void }) {
  const { role, pending, error, switchTo } = useTestRoleSwitch(onSwitched);
  return (
    <div className="mt-4 border-t border-white/[0.06] pt-4">
      <p className="px-2.5 pb-1.5 text-xs font-medium text-[var(--ink-subtle)]">Use the site as</p>
      <div className="grid grid-cols-2 gap-1 px-1">
        {TEST_ROLE_OPTIONS.map((option) => {
          const current = option.persona === role;
          return (
            <button
              key={option.claim}
              type="button"
              title={option.hint}
              aria-pressed={current}
              disabled={Boolean(pending)}
              onClick={() => !current && void switchTo(option, option.claim !== "developer")}
              className={cx(
                "min-h-9 cursor-pointer rounded-lg px-2 text-xs font-semibold transition-colors duration-150 disabled:cursor-wait",
                option.claim === "developer" && "col-span-2",
                current
                  ? "bg-[var(--brand-quiet)] text-[var(--ink)] ring-1 ring-inset ring-[var(--brand)]/40"
                  : "text-[var(--ink-muted)] hover:bg-white/[0.05] hover:text-[var(--ink)]",
              )}
            >
              {pending === option.persona ? "Switching…" : option.persona}
            </button>
          );
        })}
      </div>
      <p className="px-2.5 pt-2 text-xs text-[var(--ink-subtle)]">
        Changes your account&rsquo;s real role, so the security rules apply as that role. You keep the console.
      </p>
      {error ? <p className="px-2.5 pt-1 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}

function Sidebar({
  caller,
  build,
  onNavigate,
  onRoleSwitched,
}: {
  caller: ConsoleCaller;
  build: BuildInfo;
  onNavigate?: () => void;
  onRoleSwitched: () => void;
}) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-4 pt-5">
        <BrandLogo href="/console" category="Dynasty" subtitle="Developer console" onDark showOnMobile compact />
      </div>

      <nav aria-label="Console" className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map((section) => (
          <div key={section.group} className="mt-4 first:mt-0">
            <p className="px-2.5 pb-1.5 text-xs font-medium text-[var(--ink-subtle)]">{section.group}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        "flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--brand)]",
                        active
                          ? "bg-[var(--brand-quiet)] font-semibold text-[var(--ink)]"
                          : "text-[var(--ink-muted)] hover:bg-white/[0.05] hover:text-[var(--ink)]",
                      )}
                    >
                      <Icon className={cx("h-4 w-4 shrink-0", active ? "text-[var(--brand)]" : "text-[var(--ink-subtle)]")} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="mt-4 border-t border-white/[0.06] pt-4">
          {caller.role === "admin" ? (
            <Link
              href="/admin"
              className="flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-sm text-[var(--ink-muted)] hover:bg-white/[0.05] hover:text-[var(--ink)]"
            >
              <ExternalIcon className="h-4 w-4 text-[var(--ink-subtle)]" />
              Moderation (/admin)
            </Link>
          ) : null}
          <Link
            href="/"
            className="flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-sm text-[var(--ink-muted)] hover:bg-white/[0.05] hover:text-[var(--ink)]"
          >
            <ExternalIcon className="h-4 w-4 text-[var(--ink-subtle)]" />
            Back to the site
          </Link>
        </div>

        {caller.role === "developer" ? <TestAs onSwitched={onRoleSwitched} /> : null}
      </nav>

      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-quiet)] text-xs font-bold uppercase text-[var(--brand)]">
            {(caller.email ?? "?").slice(0, 1)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-[var(--ink)]">{caller.email ?? caller.uid}</p>
            <p className="text-xs capitalize text-[var(--ink-subtle)]">
              {caller.role}
              {caller.testingAs ? <span className="text-amber-200"> · testing as {caller.testingAs}</span> : null}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--ink-subtle)] hover:bg-white/[0.06] hover:text-[var(--ink)]"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogoutIcon className="h-4 w-4" />
          </button>
        </div>
        <p className="px-2 pt-1 font-mono text-xs text-[var(--ink-subtle)]" title={build.builtAt ?? undefined}>
          {build.env} · {shortSha(build.sha)}
        </p>
      </div>
    </div>
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0a1517] p-7 text-center shadow-[0_24px_48px_-16px_rgb(0_0_0/0.8)]">
        {children}
      </div>
    </div>
  );
}

type Access =
  | { state: "loading" }
  | { state: "signed-out" }
  | { state: "denied"; message: string }
  | { state: "error"; error: ConsoleRequestError }
  | { state: "ok"; caller: ConsoleCaller; build: BuildInfo };

export default function ConsoleShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [access, setAccess] = useState<Access>({ state: "loading" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reflects the auth provider's settled state
      setAccess({ state: "signed-out" });
      return;
    }
    consoleJson<{ caller: ConsoleCaller; build: BuildInfo }>(user, "/api/console/me")
      .then((body) => !cancelled && setAccess({ state: "ok", caller: body.caller, build: body.build }))
      .catch((error: ConsoleRequestError) => {
        if (cancelled) return;
        if (error.status === 401 || error.status === 403) setAccess({ state: "denied", message: error.message });
        else setAccess({ state: "error", error });
      });
    return () => {
      cancelled = true;
    };
  }, [user, loading, attempt]);

  // After a role switch, re-read /api/console/me so the footer shows the new role.
  const reloadCaller = () => setAttempt((n) => n + 1);

  // Close the drawer when the route changes (render-time, as MobileAppBar does).
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setDrawerOpen(false);
  }

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  let content: React.ReactNode;
  if (access.state === "loading") {
    content = (
      <div className="flex min-h-dvh">
        <div className="hidden w-64 shrink-0 border-r border-white/[0.06] p-4 lg:block">
          <Skeleton className="h-10 w-40" />
          <div className="mt-8 space-y-2">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-9" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-8 w-56" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  } else if (access.state === "signed-out") {
    content = (
      <Gate>
        <LockSmallIcon className="mx-auto h-6 w-6 text-[var(--brand)]" />
        <h1 className="mt-3 text-xl font-semibold text-[var(--ink)]">Developer console</h1>
        <p className="mt-2 text-xs leading-relaxed text-[var(--ink-subtle)]">
          Sign in with an account that holds the developer or admin role.
        </p>
        <Link
          href="/auth/login"
          className="mt-6 inline-flex min-h-10 items-center rounded-lg bg-[var(--brand)] px-5 text-xs font-semibold text-[#04201b] hover:bg-[var(--brand-hover)]"
        >
          Sign in
        </Link>
      </Gate>
    );
  } else if (access.state === "denied") {
    content = (
      <Gate>
        <LockSmallIcon className="mx-auto h-6 w-6 text-amber-200" />
        <h1 className="mt-3 text-xl font-semibold text-[var(--ink)]">No console access</h1>
        <p className="mt-2 text-xs leading-relaxed text-[var(--ink-subtle)]">
          {access.message} Signed in as <span className="text-[var(--ink)]">{user?.email ?? user?.phoneNumber}</span>. A
          role given recently applies after you sign out and back in.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/" className="inline-flex min-h-10 items-center rounded-lg border border-white/10 px-4 text-xs font-semibold text-[var(--ink)] hover:bg-white/[0.06]">
            Back to the site
          </Link>
          <Link href="/auth/login" className="inline-flex min-h-10 items-center rounded-lg bg-[var(--brand)] px-4 text-xs font-semibold text-[#04201b] hover:bg-[var(--brand-hover)]">
            Sign in as someone else
          </Link>
        </div>
      </Gate>
    );
  } else if (access.state === "error") {
    content = (
      <div className="mx-auto flex min-h-dvh max-w-xl items-center px-4">
        <div className="w-full">
          <ErrorNotice error={access.error} onRetry={() => setAttempt((n) => n + 1)} />
        </div>
      </div>
    );
  } else {
    content = (
      <ConsoleProvider value={{ user: user!, caller: access.caller, build: access.build }}>
        <div className="flex min-h-dvh">
          <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-white/[0.06] bg-[#071113] lg:block">
            <Sidebar caller={access.caller} build={access.build} onRoleSwitched={reloadCaller} />
          </aside>

          {/* Phone and tablet: a top bar with a drawer. */}
          <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#071113]/95 px-3 backdrop-blur lg:hidden">
            <BrandLogo href="/console" category="Dynasty" subtitle="Developer console" onDark showOnMobile compact />
            <Button variant="ghost" aria-label="Open console menu" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}>
              <MenuLinesIcon className="h-5 w-5" />
            </Button>
          </div>
          {drawerOpen ? (
            <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Console menu">
              <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
              <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-white/[0.08] bg-[#071113] shadow-2xl">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="absolute right-2 top-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-[var(--ink-subtle)] hover:bg-white/[0.06]"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
                <Sidebar
                  caller={access.caller}
                  build={access.build}
                  onNavigate={() => setDrawerOpen(false)}
                  onRoleSwitched={reloadCaller}
                />
              </div>
            </div>
          ) : null}

          <main id="console-main" className="min-w-0 flex-1 px-4 pb-16 pt-20 sm:px-6 lg:px-10 lg:pt-8">
            <div className="mx-auto max-w-[1280px]">{children}</div>
          </main>
        </div>
      </ConsoleProvider>
    );
  }

  return (
    // `.dark` here, not on <html>: the console is always dark while the rest of
    // the site keeps the visitor's theme. The custom `dark:` variant matches
    // descendants of any `.dark`, so shared components follow too.
    <div className="dark fixed inset-0 z-[90] overflow-y-auto bg-[#060d0e] text-[var(--ink)] [color-scheme:dark]">{content}</div>
  );
}
