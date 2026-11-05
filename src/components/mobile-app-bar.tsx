"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import AccountActions from "@/components/account-actions";
import BrandLogo from "@/components/brand-logo";
import Sheet from "@/components/ui/sheet";
import {
  BriefcaseIcon,
  BuildingLibraryIcon,
  ChartBarIcon,
  HomeIcon,
  MapSplitIcon,
  MenuIcon,
  SearchIcon,
  SparklesIcon,
  TableIcon,
  UsersIcon,
  XMarkIcon,
} from "@/components/icons";

/**
 * The phone's top bar, and the drawer behind it.
 *
 * Below `lg` this app had no navigation except the five-item tab bar, because
 * `SiteNavigation` is `hidden … lg:flex` AND is only rendered by seven of the
 * app's routes. Everything in its two dropdowns was unreachable on a phone —
 * Home, Buy, Rent, Compare, Calculators, Find an Agent, both Sell entries and
 * Add a Listing — and for every role except Buyer so were AI Search, Map Search
 * and Saved, because those live only in the Buyer tab set.
 *
 * The shape is Property24's, measured on their mobile site: a short fixed bar
 * with a hamburger on the left, the brand in the middle and account on the
 * right, opening a full-height drawer of grouped destinations. The bottom tab
 * bar stays: a tab bar for the few primary destinations plus a drawer for the
 * long tail is the standard pairing once an app outgrows five tabs, and it is
 * the arrangement you asked for.
 *
 * 56px rather than P24's 49px because the account trigger is 44px — the touch
 * floor — and needs 6px of breathing room above and below.
 */

type DrawerLink = {
  href: string;
  label: string;
  hint: string;
  icon: typeof HomeIcon;
};

type DrawerGroup = {
  heading: string;
  links: DrawerLink[];
};

/**
 * The inventory is `SiteNavigation`'s, regrouped for a vertical list. It is
 * deliberately NOT role-gated, exactly as the desktop bar is not: every
 * destination behind it carries its own `RoleGuard`, and hiding the route is
 * what made the product feel smaller on a phone than it is.
 */
const GROUPS: DrawerGroup[] = [
  {
    heading: "Looking to buy or rent",
    links: [
      { href: "/", label: "Home", hint: "Featured homes and market pulse", icon: HomeIcon },
      { href: "/for-sale", label: "Property for Sale", hint: "Browse by province and city", icon: SearchIcon },
      { href: "/to-rent", label: "Property to Rent", hint: "Rentals across South Africa", icon: SearchIcon },
      { href: "/ai-search", label: "AI Search", hint: "Describe the home in plain language", icon: SparklesIcon },
      { href: "/map-search", label: "Map Search", hint: "Explore by location and area", icon: MapSplitIcon },
      { href: "/search", label: "Advanced Search", hint: "Filters, solar, levies and specs", icon: SearchIcon },
    ],
  },
  {
    heading: "Looking to sell",
    links: [
      { href: "/seller/portal", label: "Sell Privately", hint: "List directly, no agent commission", icon: HomeIcon },
      { href: "/agent/dashboard", label: "Sell as an Agency", hint: "Practitioner console and mandates", icon: BriefcaseIcon },
      { href: "/seller/listings/new", label: "Add a Listing", hint: "Six-step listing wizard", icon: BriefcaseIcon },
    ],
  },
  {
    heading: "Tools",
    links: [
      { href: "/compare", label: "Compare", hint: "See homes next to each other", icon: TableIcon },
      { href: "/calculators", label: "Calculators", hint: "Bond, transfer duty and SARS", icon: BuildingLibraryIcon },
      { href: "/insights", label: "Market Insights", hint: "Area trends and recent sales", icon: ChartBarIcon },
      { href: "/agents", label: "Find an Agent", hint: "PPRA verified practitioners", icon: UsersIcon },
    ],
  },
];

export default function MobileAppBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close on navigation, compared during render rather than in an effect —
  // the same pattern `site-navigation.tsx` uses to close its dropdowns on a
  // route change. Without it the drawer stays open over the page the visitor
  // just asked for, which reads as a dead tap.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  // The auth screens are full-bleed and self-contained, the same reason
  // MobileNav sits them out.
  if (pathname?.startsWith("/auth")) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <>
      <header
        // z-[70]: under MobileNav's z-[80] so the tab bar always wins at the
        // bottom edge, over every page header at z-50.
        className="no-print sticky top-0 z-[70] flex h-14 items-center justify-between gap-2 border-b border-white/70 bg-white/85 px-2.5 backdrop-blur-xl lg:hidden dark:border-white/10 dark:bg-surface-panel/90"
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={open}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        <BrandLogo compact showOnMobile className="min-w-0" />

        <AccountActions showOnMobile />
      </header>

      <Sheet open={open} onClose={() => setOpen(false)} side="left" label="Navigation menu">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 px-4 py-3 dark:border-white/10">
          <BrandLogo compact showOnMobile />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <nav
          aria-label="All sections"
          className="flex-1 overflow-y-auto overscroll-contain px-2 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2"
        >
          {GROUPS.map((group) => (
            <div key={group.heading} className="mb-1">
              <p className="px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {group.heading}
              </p>
              <ul>
                {group.links.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={active ? "page" : undefined}
                        className={`flex min-h-[48px] items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                          active
                            ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300"
                            : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            active
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-400 dark:text-slate-500"
                          }`}
                        />
                        <span className="min-w-0">
                          <span className="block text-xs font-bold leading-tight">{link.label}</span>
                          <span className="block truncate text-xs leading-tight text-slate-500 dark:text-slate-400">
                            {link.hint}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </Sheet>
    </>
  );
}
