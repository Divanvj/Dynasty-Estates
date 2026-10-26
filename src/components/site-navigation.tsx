"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
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

export default function SiteNavigation() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<"sell" | "tools" | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close dropdown on route change without cascading renders
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpenDropdown(null);
  }

  const toggleDropdown = (name: "sell" | "tools") => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const isBuyActive = pathname === "/for-sale" || (pathname === "/search" && typeof window !== "undefined" && window.location.search.includes("intent=buy"));
  const isRentActive = pathname === "/to-rent" || (pathname === "/search" && typeof window !== "undefined" && window.location.search.includes("intent=rent"));
  const isHomeActive = pathname === "/";
  const isAiActive = pathname === "/ai-search";

  return (
    <nav
      ref={navRef}
      aria-label="Main Navigation"
      className="hidden items-center gap-1.5 md:gap-2.5 lg:gap-4 xl:gap-6 text-xs sm:text-[13px] font-semibold text-slate-700 dark:text-slate-200 lg:flex"
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
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleDropdown("sell")}
          className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors cursor-pointer ${
            openDropdown === "sell" || pathname.startsWith("/seller")
              ? "text-emerald-900 dark:text-emerald-300 font-bold"
              : "hover:text-emerald-900 dark:hover:text-emerald-300"
          }`}
          aria-expanded={openDropdown === "sell"}
          aria-haspopup="true"
        >
          <span>Sell</span>
          <ChevronDownIcon
            className={`h-3 w-3 transition-transform duration-200 ${
              openDropdown === "sell" ? "rotate-180 text-emerald-600 dark:text-emerald-400" : "text-slate-400"
            }`}
          />
        </button>

        {openDropdown === "sell" && (
          <div className="absolute left-0 top-full mt-2 w-64 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#071315]/95 p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in-0 zoom-in-95 duration-150">
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
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
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
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Agent console, team mandates & listing distribution.
                </p>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* 5. Tools Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleDropdown("tools")}
          className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors cursor-pointer ${
            openDropdown === "tools" || pathname === "/calculators" || pathname === "/compare" || pathname === "/map-search"
              ? "text-emerald-900 dark:text-emerald-300 font-bold"
              : "hover:text-emerald-900 dark:hover:text-emerald-300"
          }`}
          aria-expanded={openDropdown === "tools"}
          aria-haspopup="true"
        >
          <span>Tools</span>
          <ChevronDownIcon
            className={`h-3 w-3 transition-transform duration-200 ${
              openDropdown === "tools" ? "rotate-180 text-emerald-600 dark:text-emerald-400" : "text-slate-400"
            }`}
          />
        </button>

        {openDropdown === "tools" && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#071315]/95 p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in-0 zoom-in-95 duration-150">
            <Link
              href="/compare"
              className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group"
            >
              <TableIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
                  Compare
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Side-by-side property matrix</p>
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
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Geospatial interactive exploration</p>
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
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Detailed filters, solar, levies & specs</p>
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
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Bond repayments, transfer duty & SARS</p>
              </div>
            </Link>

            <Link
              href="/saved"
              className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group"
            >
              <TagIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
                  Alerts & Notifications
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Saved searches & price drop alerts</p>
              </div>
            </Link>

            <Link
              href="/agents"
              className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group"
            >
              <UsersIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
                  Find an Agent
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">PPRA verified + Register Agency</p>
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
                <p className="text-[10px] text-emerald-700 dark:text-emerald-300/80 truncate">6-Step configuration wizard</p>
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
        <span className="text-[10px] text-emerald-500 dark:text-emerald-400">✦</span>
      </Link>
    </nav>
  );
}
