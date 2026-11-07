"use client";

import { useRouter } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import {
  BathIcon,
  BedIcon,
  CarIcon,
  CheckIcon,
  ChevronDownIcon,
  CommercialIcon,
  DevelopmentsIcon,
  FarmsIcon,
  FilterSlidersIcon,
  HomeIcon,
  LocationPinIcon,
  ResidentialIcon,
  SearchIcon,
  XMarkIcon,
} from "@/components/icons";
import CustomSelect from "@/components/custom-select";
import { matchProvinceName, southAfricanProvinces } from "@/lib/property-data";
import { getAllCitiesAlphabetical, searchCities } from "@/lib/location-data";

export type SearchFilters = {
  intent: "rent" | "buy";
  locations: string[];
  category: "Residential" | "Commercial" | "Farms" | "Developments";
  types: string[];
  minPrice: number;
  maxPrice: number;
  beds: string;
  baths: string;
  parking: string;
  furnishedStatus: string;
  features: string[];
  onShowOnly?: boolean;
};

interface ExpandableSearchPanelProps {
  defaultIntent?: "rent" | "buy";
  initialLocations?: string[];
  initialCategory?: "Residential" | "Commercial" | "Farms" | "Developments";
  initialTypes?: string[];
  initialMinPrice?: number;
  initialMaxPrice?: number;
  initialBeds?: string;
  initialBaths?: string;
  initialParking?: string;
  initialFurnishedStatus?: string;
  initialFeatures?: string[];
  initialOnShowOnly?: boolean;
  onSearch?: (filters: SearchFilters) => void;
  autoNavigate?: boolean;
  className?: string;
  placeholder?: string;
  /**
   * Set where the host page already shows its own Rent/Buy control. On phones
   * the two sat one above the other; this drops the duplicate below `sm` only.
   */
  hideIntentToggleOnMobile?: boolean;
}

const rentMinPriceOptions = [
  { label: "No Min", value: 0 },
  { label: "R 5,000 / mo", value: 5000 },
  { label: "R 8,000 / mo", value: 8000 },
  { label: "R 12,000 / mo", value: 12000 },
  { label: "R 15,000 / mo", value: 15000 },
  { label: "R 20,000 / mo", value: 20000 },
  { label: "R 25,000 / mo", value: 25000 },
  { label: "R 35,000 / mo", value: 35000 },
  { label: "R 50,000 / mo", value: 50000 },
];

const rentMaxPriceOptions = [
  { label: "No Max", value: 0 },
  { label: "R 12,000 / mo", value: 12000 },
  { label: "R 18,000 / mo", value: 18000 },
  { label: "R 25,000 / mo", value: 25000 },
  { label: "R 35,000 / mo", value: 35000 },
  { label: "R 50,000 / mo", value: 50000 },
  { label: "R 75,000 / mo", value: 75000 },
  { label: "R 100,000 / mo", value: 100000 },
  { label: "R 150,000+ / mo", value: 150000 },
];

const buyMinPriceOptions = [
  { label: "No Min", value: 0 },
  { label: "R 800,000", value: 800000 },
  { label: "R 1,500,000", value: 1500000 },
  { label: "R 2,500,000", value: 2500000 },
  { label: "R 3,500,000", value: 3500000 },
  { label: "R 5,000,000", value: 5000000 },
  { label: "R 7,500,000", value: 7500000 },
  { label: "R 10,000,000", value: 10000000 },
];

const buyMaxPriceOptions = [
  { label: "No Max", value: 0 },
  { label: "R 2,000,000", value: 2000000 },
  { label: "R 3,500,000", value: 3500000 },
  { label: "R 5,000,000", value: 5000000 },
  { label: "R 7,500,000", value: 7500000 },
  { label: "R 10,000,000", value: 10000000 },
  { label: "R 15,000,000", value: 15000000 },
  { label: "R 25,000,000", value: 25000000 },
  { label: "R 50,000,000+", value: 50000000 },
];

const bedOptions = ["Any", "1+", "2+", "3+", "4+", "5+"];
const bathOptions = ["Any", "1+", "2+", "3+", "4+"];
const parkingOptions = ["Any", "1+", "2+", "3+"];

const propertyTypeOptions = [
  { label: "All Types", value: "All types" },
  { label: "House", value: "House" },
  { label: "Apartment / Flat", value: "Apartment" },
  { label: "Townhouse / Cluster", value: "Townhouse" },
  { label: "Estate Home / Villa", value: "Estate Home" },
  { label: "Penthouse", value: "Penthouse" },
  { label: "Land / Plot", value: "Land" },
];

const furnishedOptions = [
  { label: "Any", value: "Any" },
  { label: "Fully Furnished", value: "Fully Furnished" },
  { label: "Semi-Furnished", value: "Semi-Furnished" },
  { label: "Unfurnished", value: "Unfurnished" },
];

const lifestyleFeatureOptions = [
  { id: "pet_friendly", label: "Pet Friendly" },
  { id: "solar_system", label: "Solar & Inverter" },
  { id: "security_estate", label: "Security Estate / 24h Guard" },
  { id: "swimming_pool", label: "Swimming Pool" },
  { id: "garden", label: "Private Garden" },
  { id: "borehole_water", label: "Borehole / Water Backup" },
  { id: "fibre_ready", label: "Fibre Ready" },
  { id: "braai_area", label: "Braai Area / Patio" },
];

/**
 * How long the panel stays mounted after a close is requested, so its exit
 * animation can play. Keep in step with the `duration-200` on the backdrop and
 * card below — if this is shorter the panel is pulled out mid-animation.
 */
const EXIT_MS = 200;

/**
 * True only where a precise pointer is driving — a mouse or trackpad.
 *
 * Every programmatic `focus()` in this component exists for keyboard and mouse
 * users, and every one of them summons the on-screen keyboard on a phone. The
 * keyboard then covers roughly half the screen: opening the panel buried the
 * filters behind it, and closing the panel — which hands focus back to the
 * resting bar — popped it up over the page you had just returned to.
 *
 * Asking about the pointer rather than the viewport width is the honest test:
 * a narrow desktop window still gets the focus, a large tablet does not.
 */
function hasFinePointer() {
  return typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
}

/**
 * Scale the panel enters from. Lower than the `zoom-in-95` the card carries,
 * because here it is paired with a transform origin pinned to the search bar:
 * the extra travel is what makes it read as the bar expanding rather than as a
 * dialog fading in over the top of it.
 */
const ENTER_SCALE = 0.92;

export default function ExpandableSearchPanel({
  // For Sale unless a caller says otherwise. /search overrides this from the
  // URL, so a rental search still opens on To Rent.
  defaultIntent = "buy",
  initialLocations = [],
  initialCategory = "Residential",
  initialTypes = ["All types"],
  initialMinPrice = 0,
  initialMaxPrice = 0,
  initialBeds = "Any",
  initialBaths = "Any",
  initialParking = "Any",
  initialFurnishedStatus = "Any",
  initialFeatures = [],
  initialOnShowOnly = false,
  onSearch,
  autoNavigate = true,
  className = "",
  placeholder = "Search city or suburb...",
  hideIntentToggleOnMobile = false,
}: ExpandableSearchPanelProps) {
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalSearchInputRef = useRef<HTMLInputElement>(null);
  const modalCardRef = useRef<HTMLDivElement>(null);

  // Dropdown Visibility State.
  //
  // `isOpen` means the panel is mounted; `closing` means it is mounted but
  // playing its exit animation. The panel used to be a bare conditional render,
  // so closing it removed the node in the same frame and there was nothing left
  // on screen to animate — it vanished. Keeping it mounted for the length of
  // the exit is what gives it a close as well as an open.
  const [isOpen, setIsOpenRaw] = useState(false);
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const closeTimerRef = useRef<number | undefined>(undefined);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  /** Where the compact bar was when the panel was opened, in viewport coords. */
  const originRef = useRef<{ x: number; y: number } | null>(null);
  /** Set when a close should hand focus back to the resting search bar. */
  const restoreFocusRef = useRef(false);
  /** Suppresses the focus-opens-the-panel behaviour for one programmatic focus. */
  const suppressOpenOnFocusRef = useRef(false);

  /**
   * Stands in for the raw setter so every existing `setIsOpen(false)` call site
   * — escape, click-outside, the cancel button, executing a search — gets the
   * exit animation without being rewritten.
   */
  const setIsOpen = useCallback((next: boolean) => {
    if (next) {
      if (closeTimerRef.current !== undefined) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = undefined;
      }
      closingRef.current = false;
      // Remember the bar's position so the panel can grow out of it rather than
      // appearing from the middle of the viewport.
      const bar = searchInputRef.current?.getBoundingClientRect();
      originRef.current = bar
        ? { x: bar.left + bar.width / 2, y: bar.top + bar.height / 2 }
        : null;
      setClosing(false);
      setIsOpenRaw(true);
      return;
    }

    // Guard with a ref, not state: a second close (escape landing on top of a
    // click-outside) would otherwise queue a second timer.
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      closingRef.current = false;
      closeTimerRef.current = undefined;
      // Focus is handed back by the effect below rather than here: React has not
      // re-rendered at this point, so the resting console still carries `inert`
      // and focusing anything inside it silently does nothing.
      restoreFocusRef.current = true;
      setIsOpenRaw(false);
      setClosing(false);
    }, EXIT_MS);
  }, []);

  useEffect(
    () => () => {
      if (closeTimerRef.current !== undefined) window.clearTimeout(closeTimerRef.current);
    },
    []
  );

  /**
   * Hand focus back to the resting search bar once the panel has gone, so a
   * keyboard user carries on from where they were rather than from the top of
   * the document.
   *
   * This has to be an effect rather than part of the close timer. The resting
   * console carries `inert` while the panel is open, and nothing inside an inert
   * subtree can take focus — calling focus() before React has re-rendered fails
   * silently, which is exactly what it did.
   */
  useEffect(() => {
    if (isOpen || !restoreFocusRef.current) return;
    restoreFocusRef.current = false;

    const bar = searchInputRef.current;
    // Gone, because executing a search navigated away. Leave focus alone.
    if (!bar || !document.contains(bar)) return;

    // Touch devices do not get focus back. Restoring it is right for a
    // keyboard user — it puts the caret where they left it — but on a phone it
    // raises the on-screen keyboard over the page the moment you close the
    // panel, which is not what dismissing something should do.
    if (!hasFinePointer()) return;

    // Focusing this field is itself what opens the panel, so this one
    // programmatic focus has to be exempt or closing would immediately reopen.
    suppressOpenOnFocusRef.current = true;
    bar.focus();
  }, [isOpen]);

  /**
   * Pin the panel's transform origin to the search bar before it paints.
   *
   * The panel is centred in the viewport, so by default it scaled out of its
   * own middle — which, with the bar sitting a few hundred pixels below, read as
   * an unrelated dialog arriving rather than as the bar opening up. Anchoring
   * the origin to where the bar actually is makes the growth point to the thing
   * that was clicked.
   *
   * Clamped to the card's own box: when the bar is outside it the origin lands
   * on the nearest edge, which still points the right way.
   */
  useLayoutEffect(() => {
    if (!isOpen || closing) return;
    const card = modalCardRef.current;
    const origin = originRef.current;
    if (!card || !origin) return;

    // offsetLeft/Top/Width/Height, not getBoundingClientRect: the enter
    // animation has `fill-mode: both`, so by the time this runs the element is
    // already holding its opening frame and the client rect reports the box
    // scaled down by ENTER_SCALE. Measuring that would pull the origin toward
    // the card's centre — exactly the behaviour this is meant to replace. The
    // offset values are layout, which transforms do not touch.
    //
    // The card's offsetParent is the `fixed inset-0` dialog wrapper, so these
    // are already viewport coordinates.
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    if (width === 0 || height === 0) return;

    const x = Math.min(Math.max(origin.x - card.offsetLeft, 0), width);
    const y = Math.min(Math.max(origin.y - card.offsetTop, 0), height);
    card.style.transformOrigin = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
  }, [isOpen, closing]);

  // Filter States
  const [intent, setIntent] = useState<"rent" | "buy">(defaultIntent);
  const [locations, setLocations] = useState<string[]>(initialLocations);
  const [locationInput, setLocationInput] = useState("");

  const [category, setCategory] = useState<"Residential" | "Commercial" | "Farms" | "Developments">(
    initialCategory
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>(initialTypes);
  const [minPrice, setMinPrice] = useState<number>(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState<number>(initialMaxPrice);
  const [beds, setBeds] = useState<string>(initialBeds);
  const [baths, setBaths] = useState<string>(initialBaths);
  const [parking, setParking] = useState<string>(initialParking);
  const [furnishedStatus, setFurnishedStatus] = useState<string>(initialFurnishedStatus);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(initialFeatures);
  const [onShowOnly, setOnShowOnly] = useState<boolean>(initialOnShowOnly);

  // Listen to external intent changes
  useEffect(() => {
    function handleExternalIntent(e: Event) {
      const customEvent = e as CustomEvent<"rent" | "buy">;
      if (customEvent.detail === "rent" || customEvent.detail === "buy") {
        setIntent(customEvent.detail);
      }
    }
    window.addEventListener("dynasty:intent-change", handleExternalIntent);
    return () => window.removeEventListener("dynasty:intent-change", handleExternalIntent);
  }, []);

  /*
   * The `dynasty:open-ai-search` listener is gone along with the inline AI bar
   * it focused. That bar was a second, weaker AI search living inside the
   * filter panel — it only set this panel's own filter state and never reached
   * /ai-search — so the product had two different features called AI Search.
   * The real one is a page, reachable from the bottom tab bar and the drawer,
   * and the hero button now goes there instead of dispatching this event.
   */

  // Handle click outside modal card to dismiss
  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (!isOpen) return;
      if (
        modalCardRef.current &&
        !modalCardRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  // Handle ESC key, body scroll lock, and auto-focus when search expands
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    /**
     * Autofocus the field only where a keyboard is already there.
     *
     * On a touch device, focusing this input raises the on-screen keyboard the
     * instant the panel opens, and that covers roughly half the sheet —
     * including the filters the visitor came here to set. They have to dismiss
     * a keyboard they never asked for before they can do anything.
     *
     * `(pointer: fine)` is the honest test: it asks whether the device has a
     * precise pointer, rather than guessing from viewport width, so a small
     * desktop window still gets the focus and a large tablet does not.
     */
    const focusTimer = hasFinePointer()
      ? setTimeout(() => {
          modalSearchInputRef.current?.focus();
        }, 60)
      : undefined;

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      if (focusTimer) clearTimeout(focusTimer);
    };
  }, [isOpen, setIsOpen]);

  // Autocomplete Suggestions categorized by Province and City/Suburb (Alphabetical & Real-time)
  const categorizedSuggestions = useMemo(() => {
    const rawQuery = locationInput.toLowerCase().trim();

    if (!rawQuery) {
      return {
        provinces: southAfricanProvinces
          .filter((p) => p !== "All Provinces" && !locations.includes(p))
          .slice(0, 4),
        cities: getAllCitiesAlphabetical()
          .map((c) => c.name)
          .filter((c) => !locations.includes(c))
          .slice(0, 16),
      };
    }

    const matchedCities = searchCities(rawQuery)
      .map((c) => c.name)
      .filter((c) => !locations.includes(c))
      .slice(0, 12);

    const matchedProvinces = southAfricanProvinces
      .filter(
        (p) =>
          p !== "All Provinces" &&
          p.toLowerCase().includes(rawQuery) &&
          !locations.includes(p)
      )
      .slice(0, 4);

    return {
      provinces: matchedProvinces,
      cities: matchedCities,
    };
  }, [locationInput, locations]);

  function handleIntentChange(newIntent: "rent" | "buy") {
    setIntent(newIntent);
    setMinPrice(0);
    setMaxPrice(0);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("dynasty:intent-change", { detail: newIntent }));
    }
  }

  function addLocationTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (!locations.includes(trimmed)) {
      setLocations((prev) => [...prev, trimmed]);
    }
    setLocationInput("");
    // Keeping the caret in the field is right with a keyboard — you can type
    // the next suburb straight away. On touch it re-raises the on-screen
    // keyboard every time you tap a suggestion chip.
    if (!hasFinePointer()) return;
    if (isOpen) {
      modalSearchInputRef.current?.focus();
    } else {
      searchInputRef.current?.focus();
    }
  }

  function removeLocationTag(tag: string) {
    setLocations((prev) => prev.filter((t) => t !== tag));
    if (!hasFinePointer()) return;
    if (isOpen) {
      modalSearchInputRef.current?.focus();
    } else {
      searchInputRef.current?.focus();
    }
  }

  function togglePropertyType(typeVal: string) {
    if (typeVal === "All types") {
      setSelectedTypes(["All types"]);
      return;
    }

    let updated: string[];
    if (selectedTypes.includes(typeVal)) {
      updated = selectedTypes.filter((t) => t !== typeVal);
      if (updated.length === 0) {
        updated = ["All types"];
      }
    } else {
      updated = [...selectedTypes.filter((t) => t !== "All types"), typeVal];
    }
    setSelectedTypes(updated);
  }

  function toggleFeature(featureId: string) {
    setSelectedFeatures((prev) =>
      prev.includes(featureId) ? prev.filter((id) => id !== featureId) : [...prev, featureId]
    );
  }

  function handleClearAll() {
    setLocations([]);
    setLocationInput("");
    setCategory("Residential");
    setSelectedTypes(["All types"]);
    setMinPrice(0);
    setMaxPrice(0);
    setBeds("Any");
    setBaths("Any");
    setParking("Any");
    setFurnishedStatus("Any");
    setSelectedFeatures([]);
    setOnShowOnly(false);
  }

  function handleExecuteSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();

    const finalLocations = [...locations];
    if (locationInput.trim()) {
      const pending = locationInput.trim();
      if (!finalLocations.includes(pending)) {
        finalLocations.push(pending);
        setLocations(finalLocations);
      }
      setLocationInput("");
    }

    const filters: SearchFilters = {
      intent,
      locations: finalLocations,
      category,
      types: selectedTypes,
      minPrice,
      maxPrice,
      beds,
      baths,
      parking,
      furnishedStatus,
      features: selectedFeatures,
      onShowOnly,
    };

    setIsOpen(false);

    if (onSearch) {
      onSearch(filters);
    }

    // `!onSearch`: when a host handles the result it owns the navigation too.
    // /search passes BOTH `onSearch` and `autoNavigate`, so every search ran
    // the host's `router.replace` and then this `router.push` — two
    // navigations for one tap, and the second rebuilt the query from scratch
    // without `sort`, silently throwing away the visitor's sort order each
    // time they refined a search.
    if (autoNavigate && !onSearch) {
      const params = new URLSearchParams();
      params.set("intent", intent);
      if (finalLocations.length > 0) {
        params.set("q", finalLocations.join(", "));
        for (const loc of finalLocations) {
          const matchedProv = matchProvinceName(loc);
          if (matchedProv) {
            params.set("province", matchedProv);
            break;
          }
        }
      }
      if (category !== "Residential") {
        params.set("category", category);
      }
      if (!selectedTypes.includes("All types") && selectedTypes.length > 0) {
        params.set("type", selectedTypes[0]);
      }
      if (minPrice > 0) {
        params.set("minPrice", String(minPrice));
      }
      if (maxPrice > 0) {
        params.set("maxPrice", String(maxPrice));
      }
      if (beds !== "Any") {
        params.set("beds", beds.replace("+", ""));
      }
      if (baths !== "Any") {
        params.set("baths", baths.replace("+", ""));
      }
      if (parking !== "Any") {
        params.set("parking", parking.replace("+", ""));
      }
      if (furnishedStatus !== "Any") {
        params.set("furnished", furnishedStatus);
      }
      if (selectedFeatures.length > 0) {
        params.set("features", selectedFeatures.join(","));
      }
      if (onShowOnly) {
        params.set("onShow", "true");
      }

      router.push(`/search?${params.toString()}`);
    }
  }



  // Count active filters for badge counter
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (locations.length > 0) count += locations.length;
    if (category !== "Residential") count += 1;
    if (!selectedTypes.includes("All types")) count += selectedTypes.length;
    if (minPrice > 0) count += 1;
    if (maxPrice > 0) count += 1;
    if (beds !== "Any") count += 1;
    if (baths !== "Any") count += 1;
    if (parking !== "Any") count += 1;
    if (furnishedStatus !== "Any") count += 1;
    if (selectedFeatures.length > 0) count += selectedFeatures.length;
    if (onShowOnly) count += 1;
    return count;
  }, [
    locations,
    category,
    selectedTypes,
    minPrice,
    maxPrice,
    beds,
    baths,
    parking,
    furnishedStatus,
    selectedFeatures,
    onShowOnly,
  ]);

  const minPriceOptions = intent === "rent" ? rentMinPriceOptions : buyMinPriceOptions;
  const maxPriceOptions = intent === "rent" ? rentMaxPriceOptions : buyMaxPriceOptions;

  return (
    <>
      {/* 1. HERO RESTING SEARCH CONSOLE */}
      {/*
        `inert` while the panel is open. The expanded panel carries its own copy
        of this search field, so with both live the page exposed two search
        inputs at once: a screen reader announced the resting one behind the
        dialog, and Tab could land in it under the backdrop. Marking the resting
        console inert takes it out of the accessibility tree and the tab order
        without hiding it visually, which the backdrop is already handling.
      */}
      <div
        ref={containerRef}
        inert={isOpen}
        className={`relative z-30 mx-auto w-full max-w-3xl ${className}`}
      >
        {/* Category Intent Pill Slider */}
        <div
          className={`items-center justify-center px-1 mb-3 ${
            hideIntentToggleOnMobile ? "hidden sm:flex" : "flex"
          }`}
        >
          <div className="relative grid grid-cols-2 w-52 sm:w-56 p-1 rounded-full bg-white/90 dark:bg-[#071315]/90 backdrop-blur-md border border-slate-200/90 dark:border-white/10 shadow-sm transition-all duration-300 hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-[0_0_18px_rgba(16,185,129,0.38)] dark:hover:shadow-[0_0_22px_rgba(52,211,153,0.38)]">
            {/* Sliding indicator pill. For Sale is the first column, so the
                pill slides right for "rent" — invert this if the buttons are
                ever reordered again, or it animates away from the click. */}
            <span
              className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 border border-emerald-400/50 dark:border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.3)] dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-transform duration-200 ease-out pointer-events-none ${
                intent === "rent" ? "translate-x-full" : "translate-x-0"
              }`}
            />
            <button
              type="button"
              onClick={() => handleIntentChange("buy")}
              className={`relative z-10 py-1.5 text-xs font-bold transition-all cursor-pointer text-center rounded-full select-none ${
                intent === "buy"
                  ? "text-white"
                  : "text-slate-600 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-emerald-200 hover:bg-emerald-500/10"
              }`}
            >
              For Sale
            </button>
            <button
              type="button"
              onClick={() => handleIntentChange("rent")}
              className={`relative z-10 py-1.5 text-xs font-bold transition-all cursor-pointer text-center rounded-full select-none ${
                intent === "rent"
                  ? "text-white"
                  : "text-slate-600 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-emerald-200 hover:bg-emerald-500/10"
              }`}
            >
              To Rent
            </button>
          </div>
        </div>

        {/* Floating Modern Pill Search Console with Active Input */}
        <div
          onClick={() => {
            setIsOpen(true);
          }}
          className="group relative flex items-center justify-between gap-2 sm:gap-3 rounded-full border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#0b1719]/90 p-2 sm:p-3 min-h-[56px] sm:min-h-[70px] backdrop-blur-xl transition-all duration-200 cursor-pointer shadow-[0_12px_36px_rgba(15,23,42,0.08)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] hover:border-slate-300 dark:hover:border-emerald-500/30 hover:shadow-[0_18px_48px_rgba(15,23,42,0.12)]"
        >
          {/* Magnifying Glass & Location Summary / Input Field */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 pl-1.5 sm:pl-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-surface-ink/80 text-slate-700 dark:text-slate-300 dark:border dark:border-white/10 transition-colors group-hover:bg-slate-200 dark:group-hover:bg-surface-panel group-hover:text-emerald-900 dark:group-hover:text-emerald-300">
              <SearchIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>

            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 py-1">
              {locations.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-500/30 shrink-0 animate-in fade-in duration-150"
                >
                  <LocationPinIcon className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLocationTag(tag);
                    }}
                    // tap-44: this glyph is about 10x10px, well under the touch
                    // floor, and removing a suburb you did not mean to remove
                    // is an annoying miss. Adjacent chips sit ~90px apart so
                    // the expanded areas cannot overlap.
                    className="tap-44 relative text-emerald-600 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-white leading-none cursor-pointer font-bold"
                    title={`Remove ${tag}`}
                    aria-label={`Remove ${tag}`}
                  >
                    ✕
                  </button>
                </span>
              ))}

              <input
                ref={searchInputRef}
                type="text"
                value={locationInput}
                onChange={(e) => {
                  setLocationInput(e.target.value);
                  setIsOpen(true);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(true);
                  // Hand focus back on a touch device so the keyboard does not
                  // ride up behind the opening sheet. The panel's own field is
                  // deliberately not autofocused there either — see the open
                  // effect above.
                  if (!hasFinePointer()) searchInputRef.current?.blur();
                }}
                onFocus={() => {
                  // Focus restored after a close should not reopen the panel.
                  if (suppressOpenOnFocusRef.current) {
                    suppressOpenOnFocusRef.current = false;
                    return;
                  }
                  setIsOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleExecuteSearch();
                  } else if (e.key === "Backspace" && !locationInput && locations.length > 0) {
                    removeLocationTag(locations[locations.length - 1]);
                  }
                }}
                placeholder={
                  locations.length === 0
                    ? (placeholder || "Suburb or city")
                    : "Add another suburb..."
                }
                className="min-w-0 flex-1 bg-transparent text-sm sm:text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none truncate"
                autoComplete="off"
                spellCheck="false"
              />

              {locationInput && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocationInput("");
                    searchInputRef.current?.focus();
                  }}
                  className="text-slate-600 hover:text-slate-700 dark:hover:text-white text-xs font-bold px-1 cursor-pointer dark:text-slate-300"
                  title="Clear input"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filters Toggle Button & Primary Search CTA */}
          <div className="flex items-center gap-1.5 sm:gap-2 pr-0.5 sm:pr-1 shrink-0">
            {/* Filters Toggle Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(true);
              }}
              aria-label="Open search filters"
              className={`relative tap-44 flex h-10 w-10 sm:h-12 sm:w-auto items-center justify-center sm:gap-1.5 rounded-full border px-0 sm:px-4.5 text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                activeFilterCount > 0
                  ? "border-emerald-600 dark:border-emerald-500/50 bg-[#0b4d4e] dark:bg-emerald-600 text-white shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                  : "border-slate-200 dark:border-white/10 bg-white dark:bg-surface-ink/60 text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-surface-panel hover:text-emerald-900 dark:hover:text-emerald-300 dark:hover:border-emerald-500/40"
              }`}
              title="Open search filters"
            >
              <FilterSlidersIcon className={`h-4 w-4 ${activeFilterCount > 0 ? "text-white" : "text-slate-700 dark:text-slate-300"}`} />
              {/* `sm:inline`, matching the button's own `sm:w-auto`. It was
                  `min-[480px]:inline`, so between 480px and 639px the label and
                  the count badge were turned on inside a button still fixed at
                  `w-10` with `px-0` — the content spilled out of the pill in
                  both directions on every large phone. */}
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="hidden h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white sm:flex">
                  {activeFilterCount}
                </span>
              )}
              {/* Below sm the count rides as a dot on the icon-only button,
                  which is the only way to show it without widening the pill. */}
              {activeFilterCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-emerald-600 px-1 text-xs font-bold text-white sm:hidden dark:border-[#0a1517]">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Dynasty Luxury Primary CTA */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleExecuteSearch();
              }}
              className="relative tap-44 flex h-10 w-10 sm:h-12 sm:w-auto items-center justify-center sm:gap-1.5 rounded-full bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 hover:from-[#0d595b] hover:to-[#094344] dark:hover:from-emerald-500 dark:hover:to-emerald-600 px-0 sm:px-7 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-950/20 dark:shadow-[0_0_20px_rgba(16,185,129,0.35)] border border-emerald-400/30 dark:border-emerald-400/50 hover:border-emerald-400 transition-all hover:scale-102 cursor-pointer shrink-0"
              /* Below `sm` this button is an icon alone. `title` was the only
                 name it had, and a title is not announced reliably and never
                 appears on touch at all. */
              aria-label="Search"
              title="Search"
            >
              <SearchIcon className="h-4 w-4 sm:hidden text-emerald-300" />
              <span className="hidden sm:inline">Search</span>
              <span className="hidden sm:inline text-emerald-300">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EXPANDED VIEWPORT-CENTERED SINGLE CONTINUOUS BOX (createPortal)       */}
      {/* ========================================================================= */}
      {isOpen && mounted && createPortal(
        <>
          {/* Soft Dimming Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            className={`fixed inset-0 z-[9999] bg-slate-950/50 backdrop-blur-xs duration-200 ${
              closing ? "animate-out fade-out" : "animate-in fade-in"
            }`}
            aria-hidden="true"
          />

          {/* Viewport-Centered Modal Wrapper */}
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsOpen(false);
              }
            }}
            className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto p-0 sm:p-5 md:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Search and filters"
          >
            {/*
              Full-screen below `sm`, the centred card from `sm` up.

              As a centred card on a phone this header needed ~356px of
              min-content against 342px available at 390px and 272px at 320px,
              and since everything to the right of the input is `shrink-0` the
              card's own `overflow-hidden` simply cut the close button off. A
              filter interface wants the whole screen on a phone anyway — it is
              the one surface where the visitor is doing nothing else — and
              going full-bleed buys back the 24px of wrapper padding and the
              rounded corners at the same time.

              `100dvh`, not `100vh`: `vh` resolves to the LARGE viewport, so on
              a phone the footer would sit behind the browser's address bar.
            */}
            <div
              ref={modalCardRef}
              // --dyn-enter-scale overrides what `zoom-in-95` sets, to pair with
              // the origin pinned to the search bar in the layout effect above.
              style={{ "--dyn-enter-scale": ENTER_SCALE } as React.CSSProperties}
              className={`relative flex h-[100dvh] max-h-none w-full max-w-4xl flex-col overflow-hidden border-slate-200/90 bg-white shadow-[0_25px_90px_rgba(15,23,42,0.4)] duration-200 sm:h-auto sm:max-h-[88vh] sm:rounded-3xl sm:border dark:border-white/10 dark:bg-[#0a1517] dark:shadow-[0_25px_90px_rgba(0,0,0,0.8)] ${
                closing ? "animate-out fade-out zoom-out-95" : "animate-in fade-in zoom-in-95"
              }`}
            >
              {/* UNIFIED CONTINUOUS BOX HEADER: SEARCH CONSOLE */}
              <div className="border-b border-slate-100 dark:border-white/10 bg-white dark:bg-[#0a1517] p-3 sm:p-4 flex items-center justify-between gap-2.5 sm:gap-3 shrink-0">
                <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3 pl-1 sm:pl-2">
                  {/* Decoration, and the first 50px to go on a phone — the
                      input beside it already says what this is. */}
                  <div className="hidden h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-surface-ink/80 text-slate-700 dark:text-slate-300 sm:flex dark:border dark:border-white/10">
                    <SearchIcon className="h-5 w-5" />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 py-1">
                    {locations.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-500/30 shrink-0 animate-in fade-in duration-150"
                      >
                        <LocationPinIcon className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeLocationTag(tag)}
                          className="tap-44 relative text-emerald-600 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-white leading-none cursor-pointer font-bold"
                          title={`Remove ${tag}`}
                          aria-label={`Remove ${tag}`}
                        >
                          ✕
                        </button>
                      </span>
                    ))}

                    <input
                      ref={modalSearchInputRef}
                      type="text"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleExecuteSearch();
                        } else if (e.key === "Escape") {
                          setIsOpen(false);
                        } else if (e.key === "Backspace" && !locationInput && locations.length > 0) {
                          removeLocationTag(locations[locations.length - 1]);
                        }
                      }}
                      placeholder={
                        locations.length === 0
                          ? (placeholder || "Suburb, city or province")
                          : "Add another suburb..."
                      }
                      // `min-w-0`, not `min-w-[140px]`: the floor is what made
                      // the header's min-content exceed a 320px screen and
                      // pushed the close button off the edge.
                      className="min-w-0 flex-1 bg-transparent text-sm sm:text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                      autoComplete="off"
                      spellCheck="false"
                    />

                    {locationInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setLocationInput("");
                          modalSearchInputRef.current?.focus();
                        }}
                        className="text-slate-600 hover:text-slate-700 dark:hover:text-white text-xs font-bold px-1.5 cursor-pointer dark:text-slate-300"
                        title="Clear input"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Right controls: Filter count, Search CTA, Close X */}
                <div className="flex items-center gap-2 pr-1 shrink-0">
                  {activeFilterCount > 0 && (
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#0b4d4e] px-3 py-1 text-xs font-bold text-white">
                      <span>{activeFilterCount} active filters</span>
                    </span>
                  )}

                  {/* Desktop only. On a phone the primary action is the
                      full-width button in the sticky footer, where a thumb
                      actually reaches — two Search buttons in one sheet, one
                      of them at the top of the screen, is the arrangement that
                      made this header overflow in the first place. */}
                  <button
                    type="button"
                    onClick={() => handleExecuteSearch()}
                    className="hidden h-10 sm:h-11 sm:flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 hover:from-[#0d595b] hover:to-[#094344] dark:hover:from-emerald-500 dark:hover:to-emerald-600 px-5 sm:px-6 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-950/20 dark:shadow-[0_0_20px_rgba(16,185,129,0.35)] border border-emerald-400/30 dark:border-emerald-400/50 hover:border-emerald-400 transition-all hover:scale-102 cursor-pointer"
                  >
                    <span>Search</span>
                    <span className="text-emerald-300">→</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 dark:hover:bg-surface-panel hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer sm:h-9 sm:w-9 dark:bg-surface-ink/60 dark:text-slate-300 dark:border dark:border-white/10"
                    title="Close search modal"
                    aria-label="Close search"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

          {/* Direct Search Shortcut & Autocomplete Matches */}
          {locationInput.trim() ? (
            <div className="border-b border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-[#071113] p-3">
              <button
                type="button"
                onClick={() => handleExecuteSearch()}
                className="flex w-full items-center justify-between rounded-xl bg-white dark:bg-[#0c181a] px-3.5 py-2.5 text-left border border-slate-200 dark:border-white/10 shadow-2xs hover:border-emerald-400 dark:hover:border-emerald-500/40 hover:bg-emerald-50/30 dark:hover:bg-surface-ink transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <SearchIcon className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Search for <strong className="text-slate-950 dark:text-white">&ldquo;{locationInput.trim()}&rdquo;</strong> in {intent === "rent" ? "Rentals" : "Properties for Sale"}
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                  <span>Search now</span>
                  <span>→</span>
                </span>
              </button>

              {/* One scrolling row on a phone, wrapping from `sm`. This can
                  return twelve cities and four provinces, which wrapped to six
                  or eight rows and pushed every actual filter below the fold
                  the moment you typed. Scrolling keeps all sixteen reachable
                  instead of capping the list. */}
              {(categorizedSuggestions.cities.length > 0 || categorizedSuggestions.provinces.length > 0) && (
                <div className="mt-2.5 flex gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                  <span className="shrink-0 text-xs font-semibold text-slate-600 dark:text-slate-500 self-center mr-1">Matching SA areas:</span>
                  {categorizedSuggestions.cities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => addLocationTag(city)}
                      className="inline-flex min-h-[36px] shrink-0 items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c181a] px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-white/10 hover:text-emerald-950 dark:hover:text-emerald-300 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-colors cursor-pointer"
                    >
                      <LocationPinIcon className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{city}</span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">+</span>
                    </button>
                  ))}
                  {categorizedSuggestions.provinces.map((prov) => (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => addLocationTag(prov)}
                      className="inline-flex min-h-[36px] shrink-0 items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c181a] px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-white/10 hover:text-emerald-950 dark:hover:text-emerald-300 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-colors cursor-pointer"
                    >
                      <HomeIcon className="h-3 w-3 text-slate-600 dark:text-slate-500" />
                      <span>{prov}</span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">+</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="border-b border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-[#071113] px-4 py-2.5 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Premier Metros & Locations
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-500">Click to add to search</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {getAllCitiesAlphabetical()
                  .slice(0, 20)
                  .map((city) => (
                    <button
                      key={city.name}
                      type="button"
                      onClick={() => addLocationTag(city.name)}
                      className="pill-sm border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0c181a] font-medium text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-white/10 hover:text-emerald-950 dark:hover:text-emerald-300 hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-[0_0_12px_rgba(16,185,129,0.3)] dark:hover:shadow-[0_0_16px_rgba(52,211,153,0.35)] transition-all cursor-pointer shadow-2xs"
                    >
                      + {city.name}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Scrollable Filter Body */}
          {/* `px-4` on a phone, not `px-5`: 40px of horizontal padding left
              only 256px of content at 320px, and the price row is two controls
              side by side inside it. */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin bg-white sm:px-5 dark:bg-[#0a1517]">
            {/* Category Intent Pill Slider */}
            <div className="flex items-center justify-between pb-1">
              <div className="relative grid grid-cols-2 w-56 sm:w-64 p-1 rounded-full bg-slate-100 dark:bg-[#061214] border border-slate-200 dark:border-white/10 shadow-inner transition-all duration-300 hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-[0_0_18px_rgba(16,185,129,0.38)] dark:hover:shadow-[0_0_22px_rgba(52,211,153,0.38)]">
                {/* Sliding indicator pill — see the collapsed bar's copy of
                    this above: For Sale is column one, so "rent" slides right. */}
                <span
                  className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 border border-emerald-400/50 dark:border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.3)] dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-transform duration-200 ease-out pointer-events-none ${
                    intent === "rent" ? "translate-x-full" : "translate-x-0"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleIntentChange("buy")}
                  className={`relative z-10 py-1.5 text-xs sm:text-sm font-bold transition-all cursor-pointer text-center rounded-full select-none ${
                    intent === "buy"
                      ? "text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-emerald-200 hover:bg-emerald-500/10"
                  }`}
                >
                  For Sale
                </button>
                <button
                  type="button"
                  onClick={() => handleIntentChange("rent")}
                  className={`relative z-10 py-1.5 text-xs sm:text-sm font-bold transition-all cursor-pointer text-center rounded-full select-none ${
                    intent === "rent"
                      ? "text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-emerald-200 hover:bg-emerald-500/10"
                  }`}
                >
                  To Rent
                </button>
              </div>

              <span className="text-xs font-semibold text-slate-600 dark:text-slate-500 hidden sm:inline">
                {intent === "rent" ? "Browsing long-term rentals" : "Browsing properties for sale"}
              </span>
            </div>

            {/* Estate Portfolio Asset Classes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
                  Estate Portfolio
                </label>
                <span className="text-xs uppercase tracking-wider text-slate-600 dark:text-slate-500 font-medium">
                  Asset Class
                </span>
              </div>
              {/*
                Still 2x2 on a phone, but each one is a 44px row instead of a
                76px stacked card: icon beside the label rather than above it,
                and the sublabel left to the wider layouts. About 96px for the
                block against roughly 160px before, with all four still on
                screen and nothing to scroll.

                44px rather than 40 so these clear the touch floor on their own
                without needing `tap-44` — they sit in a two-column grid where
                an expanded hit area would overlap its neighbour.

                Four ACROSS is not available here, which is measured rather
                than assumed: inside the sheet body at 320px there are 288px,
                so four equal cells would be 67px with 51px left for text after
                padding, while the shortest of these labels — "Residential" —
                needs 78px at the 14px type floor and "Developments" needs 100.
                All four side by side want about 550px. Two columns give 140px
                a cell, which clears the 138px that "Developments" needs with
                its icon and `px-2`.

                `rounded-xl`, deliberately not `rounded-full`: these are a
                segmented choice of one asset class, and a pill reads as a
                removable chip like the Property Types below. From `sm` the
                original cards are untouched.
              */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { id: "Residential", label: "Residential", desc: "Homes & Villas", icon: ResidentialIcon },
                  { id: "Commercial", label: "Commercial", desc: "Offices & Retail", icon: CommercialIcon },
                  { id: "Farms", label: "Farms & Wine", desc: "Agricultural Land", icon: FarmsIcon },
                  { id: "Developments", label: "Developments", desc: "Off-Plan & New", icon: DevelopmentsIcon },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = category === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setCategory(item.id as "Residential" | "Commercial" | "Farms" | "Developments")}
                      className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-2 transition-all cursor-pointer sm:min-h-0 sm:flex-col sm:gap-0 sm:rounded-2xl sm:p-3 sm:text-center ${
                        isSelected
                          ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white border-emerald-500/70 dark:border-emerald-400/60 shadow-md ring-1 ring-emerald-400/50 dark:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                          : "bg-white/90 dark:bg-surface-ink/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-surface-panel hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-[0_0_16px_rgba(16,185,129,0.3)] dark:hover:shadow-[0_0_20px_rgba(52,211,153,0.35)] shadow-2xs"
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 sm:mb-1 ${isSelected ? "text-emerald-300" : "text-slate-600 dark:text-slate-400"}`} />
                      <span className="min-w-0 truncate text-xs font-bold">{item.label}</span>
                      <span className={`hidden text-xs mt-0.5 sm:block ${isSelected ? "text-emerald-100" : "text-slate-600 dark:text-slate-500"}`}>{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Property Types */}
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                Property Types
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {propertyTypeOptions.map((item) => {
                  const isChecked = selectedTypes.includes(item.value);
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => togglePropertyType(item.value)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                        isChecked
                          ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white shadow-sm border border-emerald-400/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                          : "border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-ink/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-panel hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-[0_0_14px_rgba(16,185,129,0.3)] dark:hover:shadow-[0_0_18px_rgba(52,211,153,0.35)]"
                      }`}
                    >
                      {isChecked && <CheckIcon className="h-3 w-3 text-emerald-300" />}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                Price Range ({intent === "rent" ? "ZAR / Month" : "ZAR Total"})
              </label>
              {/* `grid-cols-[1fr,auto,1fr]` used commas. Tailwind v4 wants
                  underscores in an arbitrary value — every other arbitrary grid
                  in this repo has them — so that class never generated and this
                  row has been a single column at EVERY width since it was
                  written, not just on a phone. Restored from `sm` up, where
                  three columns fit; stacked below it, because at 320px three
                  columns give each select about 130px and labels like
                  "R 150,000+ / mo" truncate. */}
              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_1fr] sm:gap-3">
                <CustomSelect
                  value={minPrice}
                  onChange={(val) => setMinPrice(Number(val))}
                  options={minPriceOptions}
                  placeholder="No Min"
                  ariaLabel="Minimum price"
                />

                <span className="hidden text-slate-600 font-bold self-center sm:block dark:text-slate-400">–</span>

                <CustomSelect
                  value={maxPrice}
                  onChange={(val) => setMaxPrice(Number(val))}
                  options={maxPriceOptions}
                  placeholder="No Max"
                  ariaLabel="Maximum price"
                />
              </div>
            </div>

            {/* Bedrooms, Bathrooms, Garages & Furnished (Dropdowns) */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${intent === "rent" ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-3`}>
              {/* Bedrooms Dropdown */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                  <BedIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Bedrooms</span>
                </label>
                <CustomSelect
                  value={beds}
                  onChange={(val) => setBeds(val)}
                  options={[
                    { value: "Any", label: "Any Bedrooms" },
                    { value: "1+", label: "1+ Bedroom" },
                    { value: "2+", label: "2+ Bedrooms" },
                    { value: "3+", label: "3+ Bedrooms" },
                    { value: "4+", label: "4+ Bedrooms" },
                    { value: "5+", label: "5+ Bedrooms" },
                  ]}
                  ariaLabel="Bedrooms"
                />
              </div>

              {/* Bathrooms Dropdown */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                  <BathIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Bathrooms</span>
                </label>
                <CustomSelect
                  value={baths}
                  onChange={(val) => setBaths(val)}
                  options={[
                    { value: "Any", label: "Any Bathrooms" },
                    { value: "1+", label: "1+ Bathroom" },
                    { value: "2+", label: "2+ Bathrooms" },
                    { value: "3+", label: "3+ Bathrooms" },
                    { value: "4+", label: "4+ Bathrooms" },
                  ]}
                  ariaLabel="Bathrooms"
                />
              </div>

              {/* Garages / Parking Dropdown */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                  <CarIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Garages / Parking</span>
                </label>
                <CustomSelect
                  value={parking}
                  onChange={(val) => setParking(val)}
                  options={[
                    { value: "Any", label: "Any Parking" },
                    { value: "1+", label: "1+ Garage / Bay" },
                    { value: "2+", label: "2+ Garages / Bays" },
                    { value: "3+", label: "3+ Garages / Bays" },
                  ]}
                  ariaLabel="Garages and Parking"
                />
              </div>

              {/* Furnished Status Dropdown (To Rent) */}
              {intent === "rent" && (
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                    <HomeIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Furnished Status</span>
                  </label>
                  <CustomSelect
                    value={furnishedStatus}
                    onChange={(val) => setFurnishedStatus(val)}
                    options={[
                      { value: "Any", label: "Any Status" },
                      { value: "Fully Furnished", label: "Fully Furnished" },
                      { value: "Semi-Furnished", label: "Semi-Furnished" },
                      { value: "Unfurnished", label: "Unfurnished" },
                    ]}
                    ariaLabel="Furnished Status"
                  />
                </div>
              )}
            </div>

            {/* On Show Toggle */}
            <div className="rounded-2xl border border-amber-300/60 dark:border-amber-400/30 bg-amber-50/60 dark:bg-amber-950/20 p-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white font-bold text-xs shadow-xs">
                    OS
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Show Days & Weekend Viewings</span>
                      <span className="rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-extrabold px-2 py-0.5">
                        On Show
                      </span>
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Properties open for Sunday viewing (14:00 – 17:00)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOnShowOnly(!onShowOnly)}
                  className={`pill font-bold transition-all cursor-pointer self-start sm:self-auto ${ onShowOnly ? "bg-amber-600 dark:bg-amber-500 text-white shadow-sm dark:shadow-[0_0_15px_rgba(245,158,11,0.35)]" : "border border-slate-300 dark:border-white/10 bg-white dark:bg-surface-ink/60 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-surface-panel" }`}
                >
                  {onShowOnly ? "✓ Active" : "Filter On Show"}
                </button>
              </div>
            </div>

            {/* Lifestyle Features */}
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                South African Lifestyle & Energy Features
              </label>
              <div className="flex flex-wrap gap-1.5">
                {lifestyleFeatureOptions.map((feat) => {
                  const isChecked = selectedFeatures.includes(feat.id);
                  return (
                    <button
                      key={feat.id}
                      type="button"
                      onClick={() => toggleFeature(feat.id)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                        isChecked
                          ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white shadow-xs border border-emerald-400/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                          : "border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-ink/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-panel hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-[0_0_14px_rgba(16,185,129,0.3)] dark:hover:shadow-[0_0_18px_rgba(52,211,153,0.35)]"
                      }`}
                    >
                      {isChecked ? <CheckIcon className="h-3 w-3 text-emerald-300" /> : <span>+</span>}
                      <span>{feat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sticky Modal Footer.

              On a phone this is where the primary action lives: at the bottom,
              in reach of a thumb, full width, carrying the filter count so the
              effect of everything above it is visible without scrolling back.
              `env(safe-area-inset-bottom)` keeps it clear of the home indicator
              now that the sheet runs to the bottom edge of the screen. */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/95 px-4 py-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] backdrop-blur-md sm:px-5 sm:pb-3.5 dark:border-white/10 dark:bg-[#071113]">
            <button
              type="button"
              onClick={handleClearAll}
              className="flex min-h-[44px] shrink-0 items-center text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-800 dark:hover:text-emerald-300 underline transition-colors cursor-pointer sm:min-h-0"
            >
              Clear all
            </button>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
              <span className="text-xs text-slate-600 dark:text-slate-500 hidden sm:inline">
                Press <kbd className="font-mono text-xs bg-slate-200 dark:bg-surface-ink dark:border dark:border-white/10 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">Esc</kbd> to close
              </span>
              <button
                type="button"
                onClick={() => handleExecuteSearch()}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 hover:from-[#0d595b] hover:to-[#094344] dark:hover:from-emerald-500 dark:hover:to-emerald-600 border border-emerald-400/30 dark:border-emerald-400/50 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-950/20 dark:shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:border-emerald-400 transition-all cursor-pointer hover:scale-102 sm:min-h-0 sm:flex-initial"
              >
                <span>Search Properties</span>
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-extrabold sm:hidden">
                    {activeFilterCount}
                  </span>
                )}
                <span className="text-emerald-300">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )}
</>
  );
}
