"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BriefcaseIcon,
  ChartBarIcon,
  HeartIcon,
  HomeIcon,
  MapSplitIcon,
  SearchIcon,
  ShieldIcon,
  SparklesIcon,
  UsersIcon,
} from "@/components/icons";
import { useUserRole, type UserRole } from "@/lib/use-user-role";

type NavItem = {
  href: string;
  label: string;
  icon: typeof HomeIcon;
  /** Extra paths that should also light this tab up. */
  match?: string[];
};

/**
 * Below `lg` the desktop nav is hidden, which previously left phones with no
 * navigation at all — every page compensated by stuffing links into its header,
 * which is what pushed those headers off-screen. These mirror the desktop nav.
 */
const NAV: Record<UserRole, NavItem[]> = {
  Buyer: [
    { href: "/search", label: "Browse", icon: SearchIcon, match: ["/for-sale", "/to-rent", "/property"] },
    { href: "/map-search", label: "Map", icon: MapSplitIcon },
    { href: "/ai-search", label: "Concierge", icon: SparklesIcon },
    { href: "/saved", label: "Saved", icon: HeartIcon, match: ["/collections", "/compare"] },
    { href: "/insights", label: "Insights", icon: ChartBarIcon, match: ["/calculators", "/agents", "/inquiries"] },
  ],
  Seller: [
    { href: "/seller/portal", label: "Portal", icon: HomeIcon },
    { href: "/seller/listings/new", label: "List", icon: BriefcaseIcon },
    { href: "/search", label: "Browse", icon: SearchIcon, match: ["/property", "/for-sale", "/to-rent"] },
    { href: "/insights", label: "Insights", icon: ChartBarIcon, match: ["/calculators"] },
  ],
  Agent: [
    { href: "/agent/dashboard", label: "Console", icon: BriefcaseIcon },
    { href: "/seller/listings/new", label: "Mandate", icon: HomeIcon },
    { href: "/search", label: "Browse", icon: SearchIcon, match: ["/property", "/for-sale", "/to-rent"] },
    { href: "/agents", label: "Directory", icon: UsersIcon },
    { href: "/insights", label: "Insights", icon: ChartBarIcon },
  ],
  Admin: [
    { href: "/admin", label: "Admin", icon: ShieldIcon },
    { href: "/search", label: "Listings", icon: SearchIcon, match: ["/property", "/for-sale", "/to-rent"] },
    { href: "/insights", label: "Insights", icon: ChartBarIcon },
  ],
};

export default function MobileNav() {
  const { role, isMounted } = useUserRole();
  const pathname = usePathname();

  // The auth screens are full-bleed and self-contained; a nav bar over them
  // would just be in the way.
  if (pathname?.startsWith("/auth")) return null;

  // Render the Buyer set during SSR/hydration so the bar never pops in late.
  const items = NAV[isMounted ? role : "Buyer"];

  const isActive = (item: NavItem) =>
    pathname === item.href ||
    pathname?.startsWith(`${item.href}/`) ||
    (item.match ?? []).some((m) => pathname?.startsWith(m));

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-[80] lg:hidden border-t border-white/70 dark:border-white/10 bg-white/85 dark:bg-[#0c1a1c]/90 backdrop-blur-xl shadow-[0_-8px_30px_rgba(15,23,42,0.10)] pb-[env(safe-area-inset-bottom)]"
    >
      {/* `w-full` and `min-w-0` are load-bearing. Without them the list sized
          itself from its content and rendered 383px against a 375px viewport in
          every role except Buyer, which scrolled the whole document sideways by
          8px on every page. A flex child defaults to `min-width: auto`, so it
          refuses to shrink below its content; `w-full` also keeps the padding
          inside the width rather than adding to it. */}
      <ul className="mx-auto flex w-full max-w-lg items-stretch justify-around px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[var(--dyn-mobile-nav-h)] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 transition-colors ${
                  active
                    ? "text-emerald-800 dark:text-emerald-300"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <span
                  className={`flex h-7 w-10 items-center justify-center rounded-full transition-colors ${
                    active ? "bg-emerald-100/90 dark:bg-emerald-500/15" : ""
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="max-w-full truncate text-[11px] font-semibold leading-none tracking-tight">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
