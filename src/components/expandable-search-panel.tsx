"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
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
  SparklesIcon,
  XMarkIcon,
} from "@/components/icons";
import CustomSelect from "@/components/custom-select";
import { parseNaturalLanguageQuery } from "@/lib/ai-concierge";
import { formatNumber } from "@/lib/formatters";
import {
  getPropertyList,
  matchProvinceName,
  southAfricanProvinces,
  type PropertyRecord,
} from "@/lib/property-data";
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

export default function ExpandableSearchPanel({
  defaultIntent = "rent",
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

  // Dropdown Visibility State
  const [isOpen, setIsOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

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

  // AI Search Inline States
  const [aiQuery, setAiQuery] = useState("");
  const [aiExtractionSummary, setAiExtractionSummary] = useState("");

  const [allProperties, setAllProperties] = useState<PropertyRecord[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalSearchInputRef = useRef<HTMLInputElement>(null);
  const modalCardRef = useRef<HTMLDivElement>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);

  // Load properties for live count feedback
  useEffect(() => {
    async function load() {
      try {
        const list = await getPropertyList();
        setAllProperties(list);
      } catch (error) {
        // Non-fatal: this panel only powers suggestions, and the search page
        // surfaces the same failure properly. Still log it rather than swallow.
        console.error("Search panel could not load the catalogue for suggestions:", error);
      }
    }
    void load();
  }, []);

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

  // Listen to AI search trigger from Hero banner
  useEffect(() => {
    function handleOpenAI() {
      setIsOpen(true);
      setTimeout(() => {
        aiInputRef.current?.focus();
        aiInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
    window.addEventListener("dynasty:open-ai-search", handleOpenAI);
    return () => window.removeEventListener("dynasty:open-ai-search", handleOpenAI);
  }, []);

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
  }, [isOpen]);

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

    const focusTimer = setTimeout(() => {
      modalSearchInputRef.current?.focus();
    }, 60);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      clearTimeout(focusTimer);
    };
  }, [isOpen]);

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
    if (isOpen) {
      modalSearchInputRef.current?.focus();
    } else {
      searchInputRef.current?.focus();
    }
  }

  function removeLocationTag(tag: string) {
    setLocations((prev) => prev.filter((t) => t !== tag));
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
    setAiQuery("");
    setAiExtractionSummary("");
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

  function executeAISearch(promptText: string) {
    const trimmed = promptText.trim();
    if (!trimmed) return;
    setAiQuery(trimmed);
    const parsed = parseNaturalLanguageQuery(trimmed);
    const appliedBadges: string[] = [];

    // 1. Intent (Rent vs Buy)
    if (parsed.intent) {
      setIntent(parsed.intent);
      appliedBadges.push(parsed.intent === "rent" ? "To Rent" : "For Sale");
    }

    // 2. Location
    if (parsed.targetLocation) {
      setLocations((prev) => {
        if (!prev.includes(parsed.targetLocation!)) {
          return [...prev, parsed.targetLocation!];
        }
        return prev;
      });
      appliedBadges.push(parsed.targetLocation);
    }

    // 3. Bedrooms
    if (parsed.minBedrooms) {
      const bedStr = parsed.minBedrooms >= 5 ? "5+" : `${parsed.minBedrooms}+`;
      setBeds(bedStr);
      appliedBadges.push(`${bedStr} Beds`);
    }

    // 4. Bathrooms
    if (parsed.minBathrooms) {
      const bathStr = parsed.minBathrooms >= 4 ? "4+" : `${parsed.minBathrooms}+`;
      setBaths(bathStr);
      appliedBadges.push(`${bathStr} Baths`);
    }

    // 5. Parking
    if (parsed.minParking) {
      const parkStr = parsed.minParking >= 3 ? "3+" : `${parsed.minParking}+`;
      setParking(parkStr);
      appliedBadges.push(`${parkStr} Garages`);
    }

    // 6. Max Price
    if (parsed.maxPriceZAR) {
      setMaxPrice(parsed.maxPriceZAR);
      appliedBadges.push(
        parsed.maxPriceZAR >= 1_000_000
          ? `Max R ${(parsed.maxPriceZAR / 1_000_000).toFixed(1).replace(".0", "")}M`
          : `Max R ${formatNumber(Math.round(parsed.maxPriceZAR / 1_000))}k`
      );
    }

    // 7. Property Type
    if (parsed.propertyType) {
      setSelectedTypes([parsed.propertyType]);
      appliedBadges.push(parsed.propertyType);
    }

    // 8. Furnished Status
    if (parsed.furnishedStatus) {
      setFurnishedStatus(parsed.furnishedStatus);
      appliedBadges.push(parsed.furnishedStatus);
    }

    // 9. Amenities & Lifestyle Features
    if (parsed.requiredAmenities && parsed.requiredAmenities.length > 0) {
      setSelectedFeatures((prev) => {
        const merged = new Set([...prev, ...parsed.requiredAmenities]);
        return Array.from(merged);
      });
      appliedBadges.push(
        parsed.requiredAmenities.map((a) => a.replace("_", " ")).join(", ")
      );
    }

    if (appliedBadges.length > 0) {
      setAiExtractionSummary(appliedBadges.join(" • "));
    }
  }

  function handleAISearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    executeAISearch(aiQuery);
  }

  // Live Count of Properties Matching Active Modal Filters
  const liveMatchingCount = useMemo(() => {
    if (allProperties.length === 0) return 0;

    return allProperties.filter((property) => {
      // 1. Intent filter (Rent vs Buy)
      if (intent === "buy" && property.listingType === "rent") return false;
      if (intent === "rent" && property.listingType !== "rent") return false;

      // 2. Locations / Suburbs
      if (locations.length > 0) {
        const haystack = `${property.title} ${property.location} ${property.city ?? ""} ${
          property.suburb ?? ""
        } ${property.province ?? ""}`.toLowerCase();
        const matchesAny = locations.some((loc) => haystack.includes(loc.toLowerCase()));
        if (!matchesAny) return false;
      }

      // 3. Property Type
      if (!selectedTypes.includes("All types") && selectedTypes.length > 0) {
        const matchesType = selectedTypes.some(
          (t) => property.type === t || property.category.toLowerCase().includes(t.toLowerCase())
        );
        if (!matchesType) return false;
      }

      // 4. Min Price & Max Price
      if (minPrice > 0 && property.numericPrice < minPrice) return false;
      if (maxPrice > 0 && property.numericPrice > maxPrice) return false;

      // 5. Bedrooms
      if (beds !== "Any") {
        const requiredBeds = parseInt(beds.replace("+", ""), 10);
        if (!isNaN(requiredBeds) && property.beds < requiredBeds) return false;
      }

      // 6. Bathrooms
      if (baths !== "Any") {
        const requiredBaths = parseInt(baths.replace("+", ""), 10);
        if (!isNaN(requiredBaths) && property.baths < requiredBaths) return false;
      }

      // 7. Parking / Garages
      if (parking !== "Any") {
        const requiredParking = parseInt(parking.replace("+", ""), 10);
        if (!isNaN(requiredParking) && property.parking < requiredParking) return false;
      }

      // 8. Furnished Status
      if (furnishedStatus !== "Any" && property.furnishedStatus !== furnishedStatus) {
        return false;
      }

      // 9. Category (Developments)
      if (
        category === "Developments" &&
        !property.isDevelopment &&
        !property.category.toLowerCase().includes("development")
      ) {
        return false;
      }

      // 10. On Show Weekend Viewing Filter
      if (onShowOnly && !property.onShow) {
        return false;
      }

      // 11. Lifestyle Features
      if (selectedFeatures.length > 0) {
        const hasAll = selectedFeatures.every((f) => property.features?.includes(f));
        if (!hasAll) return false;
      }

      return true;
    }).length;
  }, [
    allProperties,
    intent,
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

    if (autoNavigate) {
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
      <div
        ref={containerRef}
        className={`relative z-30 mx-auto w-full max-w-3xl ${className}`}
      >
        {/* Category Intent Pill Slider */}
        <div
          className={`items-center justify-center px-1 mb-3 ${
            hideIntentToggleOnMobile ? "hidden sm:flex" : "flex"
          }`}
        >
          <div className="relative grid grid-cols-2 w-52 sm:w-56 p-1 rounded-full bg-white/90 dark:bg-[#071315]/90 backdrop-blur-md border border-slate-200/90 dark:border-white/10 shadow-sm transition-all duration-300 hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-[0_0_18px_rgba(16,185,129,0.38)] dark:hover:shadow-[0_0_22px_rgba(52,211,153,0.38)]">
            {/* Sliding indicator pill */}
            <span
              className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 border border-emerald-400/50 dark:border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.3)] dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-transform duration-200 ease-out pointer-events-none ${
                intent === "buy" ? "translate-x-full" : "translate-x-0"
              }`}
            />
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
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-[#060d0e]/80 text-slate-700 dark:text-slate-300 dark:border dark:border-white/10 transition-colors group-hover:bg-slate-200 dark:group-hover:bg-[#0c1a1c] group-hover:text-emerald-900 dark:group-hover:text-emerald-300">
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
                    className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-white leading-none cursor-pointer font-bold"
                    title={`Remove ${tag}`}
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
                }}
                onFocus={() => {
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
                    ? (placeholder || "Search city or suburb...")
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
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs font-bold px-1 cursor-pointer dark:text-slate-300"
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
              className={`flex h-10 w-10 sm:h-12 sm:w-auto items-center justify-center sm:gap-1.5 rounded-full border px-0 sm:px-4.5 text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                activeFilterCount > 0
                  ? "border-emerald-600 dark:border-emerald-500/50 bg-[#0b4d4e] dark:bg-emerald-600 text-white shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                  : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#060d0e]/60 text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-[#0c1a1c] hover:text-emerald-900 dark:hover:text-emerald-300 dark:hover:border-emerald-500/40"
              }`}
              title="Open search filters"
            >
              <FilterSlidersIcon className={`h-4 w-4 ${activeFilterCount > 0 ? "text-white" : "text-slate-700 dark:text-slate-300"}`} />
              <span className="hidden min-[480px]:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
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
              className="flex h-10 w-10 sm:h-12 sm:w-auto items-center justify-center sm:gap-1.5 rounded-full bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 hover:from-[#0d595b] hover:to-[#094344] dark:hover:from-emerald-500 dark:hover:to-emerald-600 px-0 sm:px-7 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-950/20 dark:shadow-[0_0_20px_rgba(16,185,129,0.35)] border border-emerald-400/30 dark:border-emerald-400/50 hover:border-emerald-400 transition-all hover:scale-102 cursor-pointer shrink-0"
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
            className="fixed inset-0 z-[9999] bg-slate-950/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            aria-hidden="true"
          />

          {/* Viewport-Centered Modal Wrapper */}
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsOpen(false);
              }
            }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <div
              ref={modalCardRef}
              className="relative w-full max-w-4xl max-h-[85vh] sm:max-h-[88vh] flex flex-col rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0a1517] shadow-[0_25px_90px_rgba(15,23,42,0.4)] dark:shadow-[0_25px_90px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
              {/* UNIFIED CONTINUOUS BOX HEADER: SEARCH CONSOLE */}
              <div className="border-b border-slate-100 dark:border-white/10 bg-white dark:bg-[#0a1517] p-3 sm:p-4 flex items-center justify-between gap-2.5 sm:gap-3 shrink-0">
                <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3 pl-1 sm:pl-2">
                  <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-[#060d0e]/80 text-slate-700 dark:text-slate-300 dark:border dark:border-white/10">
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
                          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-white leading-none cursor-pointer font-bold"
                          title={`Remove ${tag}`}
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
                          ? (placeholder || "Search city, suburb, or province...")
                          : "Add another suburb..."
                      }
                      className="min-w-[140px] flex-1 bg-transparent text-sm sm:text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
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
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs font-bold px-1.5 cursor-pointer dark:text-slate-300"
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

                  <button
                    type="button"
                    onClick={() => handleExecuteSearch()}
                    className="flex h-10 sm:h-11 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 hover:from-[#0d595b] hover:to-[#094344] dark:hover:from-emerald-500 dark:hover:to-emerald-600 px-5 sm:px-6 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-950/20 dark:shadow-[0_0_20px_rgba(16,185,129,0.35)] border border-emerald-400/30 dark:border-emerald-400/50 hover:border-emerald-400 transition-all hover:scale-102 cursor-pointer"
                  >
                    <span>{liveMatchingCount > 0 ? `View ${liveMatchingCount}` : "Search"}</span>
                    <span className="text-emerald-300">→</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-[#0c1a1c] hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer dark:bg-[#060d0e]/60 dark:text-slate-300 dark:border dark:border-white/10"
                    title="Close search modal"
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
                className="flex w-full items-center justify-between rounded-xl bg-white dark:bg-[#0c181a] px-3.5 py-2.5 text-left border border-slate-200 dark:border-white/10 shadow-2xs hover:border-emerald-400 dark:hover:border-emerald-500/40 hover:bg-emerald-50/30 dark:hover:bg-[#060d0e] transition-colors cursor-pointer"
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

              {(categorizedSuggestions.cities.length > 0 || categorizedSuggestions.provinces.length > 0) && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 self-center mr-1">Matching SA areas:</span>
                  {categorizedSuggestions.cities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => addLocationTag(city)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c181a] px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-white/10 hover:text-emerald-950 dark:hover:text-emerald-300 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-colors cursor-pointer"
                    >
                      <LocationPinIcon className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{city}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400">+</span>
                    </button>
                  ))}
                  {categorizedSuggestions.provinces.map((prov) => (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => addLocationTag(prov)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c181a] px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-white/10 hover:text-emerald-950 dark:hover:text-emerald-300 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-colors cursor-pointer"
                    >
                      <HomeIcon className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                      <span>{prov}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400">+</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="border-b border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-[#071113] px-4 py-2.5 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Premier Metros & Locations
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Click to add to search</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {getAllCitiesAlphabetical()
                  .slice(0, 20)
                  .map((city) => (
                    <button
                      key={city.name}
                      type="button"
                      onClick={() => addLocationTag(city.name)}
                      className="rounded-full border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#0c181a] px-3 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-white/10 hover:text-emerald-950 dark:hover:text-emerald-300 hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-[0_0_12px_rgba(16,185,129,0.3)] dark:hover:shadow-[0_0_16px_rgba(52,211,153,0.35)] transition-all cursor-pointer shrink-0 shadow-2xs"
                    >
                      + {city.name}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Scrollable Filter Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin bg-white dark:bg-[#0a1517]">
            {/* Category Intent Pill Slider */}
            <div className="flex items-center justify-between pb-1">
              <div className="relative grid grid-cols-2 w-56 sm:w-64 p-1 rounded-full bg-slate-100 dark:bg-[#061214] border border-slate-200 dark:border-white/10 shadow-inner transition-all duration-300 hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-[0_0_18px_rgba(16,185,129,0.38)] dark:hover:shadow-[0_0_22px_rgba(52,211,153,0.38)]">
                {/* Sliding indicator pill */}
                <span
                  className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 border border-emerald-400/50 dark:border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.3)] dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-transform duration-200 ease-out pointer-events-none ${
                    intent === "buy" ? "translate-x-full" : "translate-x-0"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleIntentChange("rent")}
                  className={`relative z-10 py-1.5 text-xs sm:text-sm font-bold transition-all cursor-pointer text-center rounded-full select-none ${
                    intent === "rent"
                      ? "text-white"
                      : "text-slate-500 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-emerald-200 hover:bg-emerald-500/10"
                  }`}
                >
                  To Rent
                </button>
                <button
                  type="button"
                  onClick={() => handleIntentChange("buy")}
                  className={`relative z-10 py-1.5 text-xs sm:text-sm font-bold transition-all cursor-pointer text-center rounded-full select-none ${
                    intent === "buy"
                      ? "text-white"
                      : "text-slate-500 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-emerald-200 hover:bg-emerald-500/10"
                  }`}
                >
                  For Sale
                </button>
              </div>

              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 hidden sm:inline">
                {intent === "rent" ? "Browsing long-term rentals" : "Browsing properties for sale"}
              </span>
            </div>

            {/* AI Natural Language Search Bar */}
            <div className="rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-emerald-950/10 dark:from-emerald-950/30 via-emerald-900/5 to-slate-900/5 p-3 sm:p-3.5 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950 dark:text-emerald-300">
                  <SparklesIcon className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span>AI Natural Language Search</span>
                </div>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 border border-emerald-200 dark:border-emerald-500/30">
                  Instant Filter
                </span>
              </div>

              <form onSubmit={handleAISearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={aiInputRef}
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="e.g. 3-bedroom pet-friendly solar house in Pretoria under R6M..."
                    className="w-full rounded-xl border border-emerald-300/80 dark:border-emerald-500/30 bg-white/95 dark:bg-[#0c181a] px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                  />
                  {aiQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setAiQuery("");
                        setAiExtractionSummary("");
                      }}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs font-bold dark:text-slate-300"
                      title="Clear AI input"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 hover:from-[#0d595b] hover:to-[#094344] dark:hover:from-emerald-500 dark:hover:to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-400/30 dark:border-emerald-400/50 hover:scale-102 transition-all cursor-pointer whitespace-nowrap"
                >
                  <SparklesIcon className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Ask AI</span>
                </button>
              </form>

              {aiExtractionSummary && (
                <div className="mt-2.5 flex items-center justify-between rounded-lg bg-emerald-100/90 dark:bg-emerald-950/60 px-2.5 py-1.5 text-xs text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-500/30 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <SparklesIcon className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    <span className="font-semibold text-[11px] leading-tight truncate">
                      ✨ AI applied: {aiExtractionSummary}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiExtractionSummary("")}
                    className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-white font-bold ml-2 text-xs shrink-0 cursor-pointer"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Estate Portfolio Asset Classes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
                  Estate Portfolio
                </label>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium">
                  Asset Class
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                      onClick={() => setCategory(item.id as "Residential" | "Commercial" | "Farms" | "Developments")}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer text-center ${
                        isSelected
                          ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white border-emerald-500/70 dark:border-emerald-400/60 shadow-md ring-1 ring-emerald-400/50 dark:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                          : "bg-white/90 dark:bg-[#060d0e]/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-[#0c1a1c] hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-[0_0_16px_rgba(16,185,129,0.3)] dark:hover:shadow-[0_0_20px_rgba(52,211,153,0.35)] shadow-2xs"
                      }`}
                    >
                      <Icon className={`h-4 w-4 mb-1 ${isSelected ? "text-emerald-300" : "text-slate-500 dark:text-slate-400"}`} />
                      <span className="text-xs font-bold">{item.label}</span>
                      <span className={`text-[9px] mt-0.5 ${isSelected ? "text-emerald-100" : "text-slate-400 dark:text-slate-500"}`}>{item.desc}</span>
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
                          : "border border-slate-200 dark:border-white/10 bg-white dark:bg-[#060d0e]/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0c1a1c] hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-[0_0_14px_rgba(16,185,129,0.3)] dark:hover:shadow-[0_0_18px_rgba(52,211,153,0.35)]"
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
              <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2 sm:gap-3">
                <CustomSelect
                  value={minPrice}
                  onChange={(val) => setMinPrice(Number(val))}
                  options={minPriceOptions}
                  placeholder="No Min"
                  ariaLabel="Minimum price"
                />

                <span className="text-slate-400 font-bold self-center dark:text-slate-400">–</span>

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
                      <span className="rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[10px] font-extrabold px-2 py-0.5">
                        On Show
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Properties open for Sunday viewing (14:00 – 17:00)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOnShowOnly(!onShowOnly)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 self-start sm:self-auto ${
                    onShowOnly
                      ? "bg-amber-600 dark:bg-amber-500 text-white shadow-sm dark:shadow-[0_0_15px_rgba(245,158,11,0.35)]"
                      : "border border-slate-300 dark:border-white/10 bg-white dark:bg-[#060d0e]/60 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#0c1a1c]"
                  }`}
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
                          : "border border-slate-200 dark:border-white/10 bg-white dark:bg-[#060d0e]/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0c1a1c] hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-[0_0_14px_rgba(16,185,129,0.3)] dark:hover:shadow-[0_0_18px_rgba(52,211,153,0.35)]"
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

          {/* Sticky Modal Footer (Inside the Continuous Box) */}
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/10 bg-slate-50/95 dark:bg-[#071113] px-5 py-3.5 shrink-0 backdrop-blur-md">
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-800 dark:hover:text-emerald-300 underline transition-colors cursor-pointer"
            >
              Clear all
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
                Press <kbd className="font-mono text-[10px] bg-slate-200 dark:bg-[#060d0e] dark:border dark:border-white/10 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">Esc</kbd> to close
              </span>
              <button
                type="button"
                onClick={() => handleExecuteSearch()}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 hover:from-[#0d595b] hover:to-[#094344] dark:hover:from-emerald-500 dark:hover:to-emerald-600 border border-emerald-400/30 dark:border-emerald-400/50 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-950/20 dark:shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:border-emerald-400 transition-all cursor-pointer hover:scale-102"
              >
                <span>
                  {liveMatchingCount > 0
                    ? `View ${liveMatchingCount} Properties`
                    : "Search Properties"}
                </span>
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
