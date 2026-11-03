"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  BriefcaseIcon,
  BuildingLibraryIcon,
  ChevronDownIcon,
  HomeIcon,
  MapSplitIcon,
  SearchIcon,
  SparklesIcon,
  TableIcon,
  TagIcon,
  UsersIcon,
} from "@/components/icons";

type DropdownName = "sell" | "tools";

/** Grace period before a hover-opened dropdown closes, covering the gap between
 *  a trigger and its panel. Long enough to cross, short enough not to linger. */
const HOVER_CLOSE_MS = 180;

export default function SiteNavigation() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<DropdownName | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const sellButtonRef = useRef<HTMLButtonElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);
  const sellPanelRef = useRef<HTMLDivElement>(null);
  const toolsPanelRef = useRef<HTMLDivElement>(null);
  /** Set when a dropdown is opened from the keyboard, so focus follows it in.
   *  Opening with the mouse deliberately does not move focus. */
  const focusFirstOnOpenRef = useRef(false);

  function triggerFor(name: DropdownName) {
    return name === "sell" ? sellButtonRef.current : toolsButtonRef.current;
  }

  function linksIn(name: DropdownName) {
    const panel = name === "sell" ? sellPanelRef.current : toolsPanelRef.current;
    return panel ? Array.from(panel.querySelectorAll<HTMLAnchorElement>("a[href]")) : [];
  }

  function closeAndRestoreFocus(name: DropdownName) {
    const trigger = triggerFor(name);
    setOpenDropdown(null);
    trigger?.focus();
  }

  /** ArrowDown opens and steps in, matching what a disclosure is expected to do. */
  function handleTriggerKeyDown(event: React.KeyboardEvent, name: DropdownName) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusFirstOnOpenRef.current = true;
      setOpenDropdown(name);
    } else if (event.key === "Escape" && openDropdown === name) {
      event.preventDefault();
      closeAndRestoreFocus(name);
    }
  }

  /** Roving focus inside an open panel. Tab still works and still leaves. */
  function handlePanelKeyDown(event: React.KeyboardEvent, name: DropdownName) {
    const links = linksIn(name);
    if (links.length === 0) return;

    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    const focusAt = (next: number) => {
      event.preventDefault();
      links[(next + links.length) % links.length]?.focus();
    };

    if (event.key === "ArrowDown") focusAt(index + 1);
    else if (event.key === "ArrowUp") focusAt(index - 1);
    else if (event.key === "Home") focusAt(0);
    else if (event.key === "End") focusAt(links.length - 1);
    else if (event.key === "Escape") {
      event.preventDefault();
      closeAndRestoreFocus(name);
    }
  }

  /**
   * Hover to open, with a grace period on the way out.
   *
   * The panel sits 8px below its trigger (`mt-2`), so the pointer leaves the
   * trigger before it reaches the panel. Closing immediately would shut the menu
   * in that gap and make it feel broken; the delay covers the crossing. Moving
   * straight to the other dropdown cancels it, because that enter fires first.
   */
  const hoverCloseTimerRef = useRef<number | undefined>(undefined);
  const hoverCapableRef = useRef(false);

  useEffect(() => {
    // Only where hovering is a real, separate state from pressing. On a
    // touchscreen a "hover" arrives with the tap and would fight the click.
    hoverCapableRef.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    return () => {
      if (hoverCloseTimerRef.current !== undefined) {
        window.clearTimeout(hoverCloseTimerRef.current);
      }
    };
  }, []);

  function cancelHoverClose() {
    if (hoverCloseTimerRef.current !== undefined) {
      window.clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = undefined;
    }
  }

  function handlePointerEnter(name: DropdownName) {
    if (!hoverCapableRef.current) return;
    cancelHoverClose();
    // Deliberately does not move focus: a pointer user has not asked for it.
    setOpenDropdown(name);
  }

  function handlePointerLeave() {
    if (!hoverCapableRef.current) return;
    cancelHoverClose();
    hoverCloseTimerRef.current = window.setTimeout(() => {
      hoverCloseTimerRef.current = undefined;
      setOpenDropdown(null);
    }, HOVER_CLOSE_MS);
  }

  // Focus the first link when the panel was opened from the keyboard. Done in a
  // layout effect so it lands before paint rather than visibly jumping.
  useLayoutEffect(() => {
    if (!openDropdown || !focusFirstOnOpenRef.current) return;
    focusFirstOnOpenRef.current = false;
    // linksIn only reads refs, which are stable, so the open panel is the whole
    // dependency.
    linksIn(openDropdown)[0]?.focus();
  }, [openDropdown]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      // Escape from anywhere closes, and hands focus back to the control that
      // opened the panel — previously focus was left wherever it happened to be,
      // which drops a keyboard user at the top of the document.
      if (event.key === "Escape" && openDropdown) {
        const trigger = triggerFor(openDropdown);
        setOpenDropdown(null);
        trigger?.focus();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openDropdown]);

  // Close dropdown on route change without cascading renders
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpenDropdown(null);
  }

  const toggleDropdown = (name: "sell" | "tools") => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  // These used to also check `window.location.search` for `intent=buy|rent` on
  // /search — a read of browser state during render, so the server emitted false
  // and the client sometimes true, which is a hydration mismatch.
  //
  // The branch was dead regardless: this component is rendered by seven pages —
  // the home page and the six for-sale / to-rent routes — and /search is not one
  // of them, so the condition could never be true. Dropping it also avoids
  // pulling `useSearchParams` into all seven, which would opt them into
  // client-side rendering for a highlight that pathname already decides.
  const isBuyActive = pathname === "/for-sale";
  const isRentActive = pathname === "/to-rent";
  const isHomeActive = pathname === "/";
  const isAiActive = pathname === "/ai-search";

  return (
    <nav
      ref={navRef}
      aria-label="Main Navigation"
      className="hidden items-center gap-1.5 md:gap-2.5 lg:gap-4 xl:gap-6 text-xs font-semibold text-slate-700 dark:text-slate-200 lg:flex"
    >
      {/* 1. Home */}
      <Link
        href="/"
        className={`px-2 py-1 rounded-full transition-colors ${
          isHomeActive
            ? "text-emerald-900 dark:text-emerald-300 font-bold"
            : "hover:text-emerald-900 dark:hover:text-emerald-300"
        }`}
      >
        Home
      </Link>

      {/* 2. Buy (Filters for Sale) */}
      <Link
        href="/for-sale"
        className={`px-2 py-1 rounded-full transition-colors ${
          isBuyActive
            ? "text-emerald-900 dark:text-emerald-300 font-bold"
            : "hover:text-emerald-900 dark:hover:text-emerald-300"
        }`}
      >
        Buy
      </Link>

      {/* 3. Rent (Filters for Rentals) */}
      <Link
        href="/to-rent"
        className={`px-2 py-1 rounded-full transition-colors ${
          isRentActive
            ? "text-emerald-900 dark:text-emerald-300 font-bold"
            : "hover:text-emerald-900 dark:hover:text-emerald-300"
        }`}
      >
        Rent
      </Link>

      {/* 4. Sell Dropdown */}
      <div
        className="relative"
        onPointerEnter={() => handlePointerEnter("sell")}
        onPointerLeave={handlePointerLeave}
      >
        {/*
          A disclosure, not a `role="menu"`. The ARIA practices steer site
          navigation away from menu semantics: a menu puts screen readers into
          application mode, where these entries stop being announced as the links
          they are. `aria-expanded` plus `aria-controls` is the right contract
          here, and the links keep behaving like links.
        */}
        <button
          ref={sellButtonRef}
          type="button"
          onClick={() => toggleDropdown("sell")}
          onKeyDown={(event) => handleTriggerKeyDown(event, "sell")}
          className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors cursor-pointer ${
            openDropdown === "sell" || pathname.startsWith("/seller")
              ? "text-emerald-900 dark:text-emerald-300 font-bold"
              : "hover:text-emerald-900 dark:hover:text-emerald-300"
          }`}
          aria-expanded={openDropdown === "sell"}
          aria-controls="nav-sell-panel"
        >
          <span>Sell</span>
          <ChevronDownIcon
            className={`h-3 w-3 transition-transform duration-200 ${
              openDropdown === "sell" ? "rotate-180 text-emerald-600 dark:text-emerald-400" : "text-slate-400"
            }`}
          />
        </button>

        {openDropdown === "sell" && (
          <div
            id="nav-sell-panel"
            ref={sellPanelRef}
            onKeyDown={(event) => handlePanelKeyDown(event, "sell")}
            className="absolute left-0 top-full mt-2 w-64 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#071315]/95 p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in-0 zoom-in-95 duration-150"
          >
            <Link
              href="/seller/portal"
              className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                <HomeIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
                  Sell Privately
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                  List directly to buyers with zero agent commissions.
                </p>
              </div>
            </Link>

            <Link
              href="/agent/dashboard"
              className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group mt-1"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                <BriefcaseIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
                  Sell as an Agency
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                  Agent console, team mandates & listing distribution.
                </p>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* 5. Tools Dropdown */}
      <div
        className="relative"
        onPointerEnter={() => handlePointerEnter("tools")}
        onPointerLeave={handlePointerLeave}
      >
        <button
          ref={toolsButtonRef}
          type="button"
          onClick={() => toggleDropdown("tools")}
          onKeyDown={(event) => handleTriggerKeyDown(event, "tools")}
          className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors cursor-pointer ${
            openDropdown === "tools" || pathname === "/calculators" || pathname === "/compare" || pathname === "/map-search"
              ? "text-emerald-900 dark:text-emerald-300 font-bold"
              : "hover:text-emerald-900 dark:hover:text-emerald-300"
          }`}
          aria-expanded={openDropdown === "tools"}
          aria-controls="nav-tools-panel"
        >
          <span>Tools</span>
          <ChevronDownIcon
            className={`h-3 w-3 transition-transform duration-200 ${
              openDropdown === "tools" ? "rotate-180 text-emerald-600 dark:text-emerald-400" : "text-slate-400"
            }`}
          />
        </button>

        {openDropdown === "tools" && (
          <div
            id="nav-tools-panel"
            ref={toolsPanelRef}
            onKeyDown={(event) => handlePanelKeyDown(event, "tools")}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#071315]/95 p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in-0 zoom-in-95 duration-150"
          >
            <Link
              href="/compare"
              className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group"
            >
              <TableIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
                  Compare
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Side-by-side property matrix</p>
              </div>
            </Link>

            <Link
              href="/map-search"
              className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group"
            >
              <MapSplitIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
                  Map Search
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Geospatial interactive exploration</p>
              </div>
            </Link>

            <Link
              href="/search"
              className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group"
            >
              <SearchIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
                  Advanced Search
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Detailed filters, solar, levies & specs</p>
              </div>
            </Link>

            <Link
              href="/calculators"
              className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group"
            >
              <BuildingLibraryIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
                  Calculators
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Bond repayments, transfer duty & SARS</p>
              </div>
            </Link>

            {/* Not a link. This pointed at /saved, which is the Saved
                Properties shortlist - it has no alerts, no notifications and
                no saved searches. Saved searches need the `saved_searches`
                collection, which is waiting on the Firestore rules deploy, so
                until then the entry says so rather than sending people to a
                page that does not do what the label promises. */}
            <div
              aria-disabled="true"
              className="flex items-center gap-3 rounded-xl p-2 opacity-60"
            >
              <TagIcon className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                  Alerts &amp; Notifications
                  <span className="rounded-full border border-slate-300 dark:border-white/20 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide">
                    Soon
                  </span>
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">Saved searches &amp; price drop alerts</p>
              </div>
            </div>

            <Link
              href="/agents"
              className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group"
            >
              <UsersIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
                  Find an Agent
                </p>
                {/* "+ Register Agency" was removed: there is no agency
                    registration route. /agency/register, /register-agency and
                    /agency all 404, and the flow needs the agency_applications
                    collection, which is blocked on the Firestore rules deploy. */}
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">PPRA verified practitioner directory</p>
              </div>
            </Link>

            <div className="my-1 border-t border-slate-200/80 dark:border-white/10" />

            <Link
              href="/seller/listings/new"
              className="flex items-center gap-3 rounded-xl p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 transition-colors group"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-white text-xs font-bold">
                +
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold">Add a Listing (Sell / Rent)</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300/80 truncate">6-Step configuration wizard</p>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* 6. AI Search (with sparkle badge) */}
      <Link
        href="/ai-search"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs transition-all ${
          isAiActive
            ? "bg-emerald-900 text-white dark:bg-emerald-400/20 dark:text-emerald-300 border border-emerald-400/50 shadow-xs"
            : "text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-emerald-200 hover:bg-emerald-500/10 border border-emerald-500/30 dark:border-emerald-500/20"
        }`}
      >
        <SparklesIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>AI Search</span>
        <span className="text-xs text-emerald-500 dark:text-emerald-400">✦</span>
      </Link>
    </nav>
  );
}
