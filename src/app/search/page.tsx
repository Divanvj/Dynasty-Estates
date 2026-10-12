"use client";

import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import SavePropertyButton from "@/components/save-property-button";
import AccountActions from "@/components/account-actions";
import ExpandableSearchPanel, { type SearchFilters } from "@/components/expandable-search-panel";
import PropertyCardPhotos from "@/components/property-card-photos";
import PropertyListCard from "@/components/property-list-card";
import PropertyCompactTable from "@/components/property-compact-table";
import PropertySplitMapView from "@/components/property-split-map-view";
import CustomSelect from "@/components/custom-select";
import {
  AreaIcon,
  BathIcon,
  BedIcon,
  CarIcon,
  CheckIcon,
  GridIcon,
  HomeIcon,
  ListIcon,
  LocationPinIcon,
  MapSplitIcon,
  TableIcon,
} from "@/components/icons";
import {
  getDisplayTag,
  getPropertyList,
  matchProvinceName,
  type PropertyRecord,
} from "@/lib/property-data";

export type ViewMode = "grid" | "list" | "map" | "compact";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter State: strictly "rent" or "buy" (no mixing), derived directly from searchParams
  const urlIntent = searchParams.get("intent");
  const listingCategory: "rent" | "buy" = urlIntent === "buy" ? "buy" : "rent";

  const rawProv = searchParams.get("province");
  const province = rawProv && rawProv !== "All Provinces" ? rawProv : "";
  const rawCity = searchParams.get("city");
  const city = rawCity && rawCity !== "All Towns" ? rawCity : "";
  const selectedType = searchParams.get("type") ?? "All";
  const minBeds = searchParams.get("beds") ?? "Any";
  const minBaths = searchParams.get("baths") ?? "Any";
  const minParking = searchParams.get("parking") ?? "Any";
  const furnished = searchParams.get("furnished") ?? "Any";
  const query = searchParams.get("q") ?? "";
  const minPrice = Number(searchParams.get("minPrice") ?? 0);
  const maxPrice = Number(searchParams.get("maxPrice") ?? 0);
  const sortBy = searchParams.get("sort") ?? "newest";
  const category =
    (searchParams.get("category") as "Residential" | "Commercial" | "Farms" | "Developments") ??
    "Residential";

  // View mode preference: grid | list | map | compact (Default: list)
  const urlView = searchParams.get("view");
  const [localView, setLocalView] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "list";
    try {
      const stored = localStorage.getItem("dynasty_search_view_mode");
      if (stored === "list" || stored === "grid" || stored === "map" || stored === "compact") {
        return stored;
      }
    } catch {}
    return "list";
  });

  const viewMode: ViewMode =
    urlView === "list" || urlView === "grid" || urlView === "map" || urlView === "compact"
      ? urlView
      : localView;

  function handleViewChange(mode: ViewMode) {
    setLocalView(mode);
    try {
      localStorage.setItem("dynasty_search_view_mode", mode);
    } catch {}
    const params = new URLSearchParams(searchParams.toString());
    if (mode === "list") {
      params.delete("view");
    } else {
      params.set("view", mode);
    }
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }

  // URL-backed features
  const urlFeatures = useMemo(() => {
    const raw = searchParams.get("features");
    if (!raw) return [];
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }, [searchParams]);

  const [allProperties, setAllProperties] = useState<PropertyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProperties() {
      setLoading(true);
      try {
        const properties = await getPropertyList();
        setAllProperties(properties);
        setLoadError(null);
      } catch (error) {
        // The catalogue query no longer substitutes demo data on failure, so a
        // real error has to be shown rather than rendering an empty result set
        // that looks like "no matches".
        setAllProperties([]);
        setLoadError(
          error instanceof Error ? error.message : "Unable to load the property catalogue.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProperties();
  }, []);

  function handleCategoryChange(cat: "rent" | "buy") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("intent", cat);
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("furnished");
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }

  function toggleFeature(featureId: string) {
    const params = new URLSearchParams(searchParams.toString());
    let next: string[];
    if (urlFeatures.includes(featureId)) {
      next = urlFeatures.filter((f) => f !== featureId);
    } else {
      next = [...urlFeatures, featureId];
    }
    if (next.length > 0) {
      params.set("features", next.join(","));
    } else {
      params.delete("features");
    }
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }

  function handleSortChange(newSort: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (newSort === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", newSort);
    }
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }

  function handleResetFilters() {
    router.replace("/search?intent=rent", { scroll: false });
  }

  function handlePanelSearch(filters: SearchFilters) {
    const params = new URLSearchParams();
    params.set("intent", filters.intent);

    if (filters.locations.length > 0) {
      params.set("q", filters.locations.join(", "));
      for (const loc of filters.locations) {
        const matchedProv = matchProvinceName(loc);
        if (matchedProv) {
          params.set("province", matchedProv);
          break;
        }
      }
    }

    if (filters.category !== "Residential") {
      params.set("category", filters.category);
    }

    if (!filters.types.includes("All types") && filters.types.length > 0) {
      params.set("type", filters.types[0]);
    }

    if (filters.minPrice > 0) {
      params.set("minPrice", String(filters.minPrice));
    }

    if (filters.maxPrice > 0) {
      params.set("maxPrice", String(filters.maxPrice));
    }

    if (filters.beds !== "Any") {
      params.set("beds", filters.beds.replace("+", ""));
    }

    if (filters.baths !== "Any") {
      params.set("baths", filters.baths.replace("+", ""));
    }

    if (filters.parking !== "Any") {
      params.set("parking", filters.parking.replace("+", ""));
    }

    if (filters.furnishedStatus !== "Any") {
      params.set("furnished", filters.furnishedStatus);
    }

    if (filters.features.length > 0) {
      params.set("features", filters.features.join(","));
    }

    if (sortBy !== "newest") {
      params.set("sort", sortBy);
    }

    router.replace(`/search?${params.toString()}`, { scroll: false });
  }

  // Live Filtering Engine
  const filteredProperties = useMemo(() => {
    const results = allProperties.filter((property) => {
      // 0. Listing category filter (Buy vs Rent)
      if (listingCategory === "buy" && property.listingType === "rent") {
        return false;
      }
      if (listingCategory === "rent" && property.listingType !== "rent") {
        return false;
      }

      // 1. Location Tags & Keyword search
      if (query.trim()) {
        const terms = query
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);

        const haystack = `${property.title} ${property.location} ${property.description} ${
          property.suburb ?? ""
        } ${property.city ?? ""} ${property.province ?? ""} ${property.features.join(
          " "
        )}`.toLowerCase();

        const matchesAny = terms.some((term) => haystack.includes(term));
        if (!matchesAny) return false;
      }

      // 2. Province Filter
      if (province && province.trim() && province !== "All Provinces") {
        const resolved = matchProvinceName(province);
        const provNeedle = (resolved || province).toLowerCase().trim();
        const propProv = property.province?.toLowerCase() ?? "";
        const propLoc = property.location.toLowerCase();
        if (!propProv.includes(provNeedle) && !propLoc.includes(provNeedle)) {
          return false;
        }
      }

      // 3. City / Town Filter
      if (city && city !== "All Towns") {
        const propCity = property.city?.toLowerCase() ?? "";
        const propSuburb = property.suburb?.toLowerCase() ?? "";
        const propLoc = property.location.toLowerCase();
        const cityNeedle = city.toLowerCase();
        if (
          !propCity.includes(cityNeedle) &&
          !propSuburb.includes(cityNeedle) &&
          !propLoc.includes(cityNeedle)
        ) {
          return false;
        }
      }

      // 4. Property Type
      if (selectedType !== "All" && selectedType !== "All types" && property.type !== selectedType) {
        return false;
      }

      // 5. Bedrooms Count
      if (minBeds !== "Any") {
        const requiredBeds = parseInt(minBeds.replace("+", ""), 10);
        if (!isNaN(requiredBeds) && property.beds < requiredBeds) return false;
      }

      // 6. Bathrooms Count
      if (minBaths !== "Any") {
        const requiredBaths = parseInt(minBaths.replace("+", ""), 10);
        if (!isNaN(requiredBaths) && property.baths < requiredBaths) return false;
      }

      // 7. Garages / Parking
      if (minParking !== "Any") {
        const requiredParking = parseInt(minParking.replace("+", ""), 10);
        if (!isNaN(requiredParking) && property.parking < requiredParking) return false;
      }

      // 8. Furnished Status
      if (furnished !== "Any" && property.furnishedStatus !== furnished) {
        return false;
      }

      // 9. Price Ceilings
      if (minPrice > 0 && property.numericPrice < minPrice) {
        return false;
      }
      if (maxPrice > 0 && property.numericPrice > maxPrice) {
        return false;
      }

      // 10. Verified Amenity Features
      if (urlFeatures.length > 0) {
        const hasAllFeatures = urlFeatures.every((feat) => property.features.includes(feat));
        if (!hasAllFeatures) return false;
      }

      return true;
    });

    // Sorting
    if (sortBy === "price_asc") {
      results.sort((a, b) => a.numericPrice - b.numericPrice);
    } else if (sortBy === "price_desc") {
      results.sort((a, b) => b.numericPrice - a.numericPrice);
    } else if (sortBy === "beds_desc") {
      results.sort((a, b) => b.beds - a.beds);
    }

    return results;
  }, [
    allProperties,
    listingCategory,
    query,
    province,
    city,
    selectedType,
    minBeds,
    minBaths,
    minParking,
    furnished,
    minPrice,
    maxPrice,
    urlFeatures,
    sortBy,
  ]);

  // Extract initial location chips from query if any
  const locationChips = useMemo(() => {
    if (!query.trim()) return [];
    return query
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [query]);

  return (
    <div className="mx-auto max-w-[1440px]">
      {/* Header */}
      <header className="relative z-50 mb-6 flex items-center justify-between rounded-[28px] border border-white/75 bg-white/45 dark:border-white/10 dark:bg-[#0b1719]/70 px-3.5 sm:px-5 py-3 shadow-[0_12px_28px_rgba(36,48,50,0.08)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <BrandLogo />

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Link href="/" className="hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">Home</Link>
            <Link href="/collections" className="hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">Collections</Link>
            <Link href="/compare" className="hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">Compare</Link>
            <Link href="/saved" className="hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">Saved Homes</Link>
          </div>
          <AccountActions />
        </div>
      </header>

      {/* Comprehensive Search & Filter Console */}
      <section className="relative z-30 rounded-[32px] border border-white/80 bg-white/60 dark:border-white/10 dark:bg-[#0c1a1c]/65 p-4 sm:p-6 shadow-[0_20px_45px_rgba(36,48,50,0.1)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/10 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[10px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-bold">Catalogue</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              {/* Category Segmented Control: Strict Separation (Rent Default) */}
              <div className="relative grid grid-cols-2 w-44 p-0.5 rounded-full border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#071315]/80 shadow-xs transition-all duration-300 hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-[0_0_16px_rgba(16,185,129,0.38)] dark:hover:shadow-[0_0_20px_rgba(52,211,153,0.38)]">
                {/* Sliding indicator pill */}
                <span
                  className={`absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-900 dark:to-[#073031] border border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-transform duration-200 ease-out pointer-events-none ${
                    listingCategory === "buy" ? "translate-x-full" : "translate-x-0"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleCategoryChange("rent")}
                  className={`relative z-10 flex min-h-[44px] items-center justify-center py-1 text-xs font-bold transition-all cursor-pointer text-center rounded-full select-none sm:block sm:min-h-0 ${
                    listingCategory === "rent"
                      ? "text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-emerald-200 hover:bg-emerald-500/10"
                  }`}
                >
                  To Rent
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange("buy")}
                  className={`relative z-10 flex min-h-[44px] items-center justify-center py-1 text-xs font-bold transition-all cursor-pointer text-center rounded-full select-none sm:block sm:min-h-0 ${
                    listingCategory === "buy"
                      ? "text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-emerald-200 hover:bg-emerald-500/10"
                  }`}
                >
                  For Sale
                </button>
              </div>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
              {listingCategory === "rent"
                ? "South African Rental Residences"
                : "South African Homes For Sale"}
            </h1>
          </div>

          {/* Results Count, View Switcher & Sort Dropdown */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1.5 rounded-full">
              {filteredProperties.length} Available
            </span>

            {/* View Mode Switcher Segmented Control */}
            <div className="inline-flex items-center rounded-2xl border border-slate-200/90 bg-white/80 dark:border-white/10 dark:bg-[#060d0e]/60 p-1 shadow-2xs backdrop-blur-md">
              <button
                type="button"
                onClick={() => handleViewChange("grid")}
                className={`flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer sm:min-h-0 sm:min-w-0 ${
                  viewMode === "grid"
                    ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white border border-emerald-400/50 dark:border-emerald-500/50 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                    : "text-slate-600 dark:text-slate-300 hover:text-emerald-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-[#0c1a1c]"
                }`}
                title="Grid View (3 Columns)"
              >
                <GridIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewChange("list")}
                className={`flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer sm:min-h-0 sm:min-w-0 ${
                  viewMode === "list"
                    ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white border border-emerald-400/50 dark:border-emerald-500/50 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                    : "text-slate-600 dark:text-slate-300 hover:text-emerald-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-[#0c1a1c]"
                }`}
                title="List View (Detailed Horizontal Cards)"
              >
                <ListIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewChange("map")}
                className={`flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer sm:min-h-0 sm:min-w-0 ${
                  viewMode === "map"
                    ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white border border-emerald-400/50 dark:border-emerald-500/50 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                    : "text-slate-600 dark:text-slate-300 hover:text-emerald-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-[#0c1a1c]"
                }`}
                title="Split Map View (Interactive Map + Listings)"
              >
                <MapSplitIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Map</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewChange("compact")}
                className={`flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer sm:min-h-0 sm:min-w-0 ${
                  viewMode === "compact"
                    ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white border border-emerald-400/50 dark:border-emerald-500/50 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                    : "text-slate-600 dark:text-slate-300 hover:text-emerald-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-[#0c1a1c]"
                }`}
                title="Compact Table View (Investor & Yield Matrix)"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative min-w-[170px]">
              <CustomSelect
                value={sortBy}
                onChange={(val) => handleSortChange(val)}
                options={[
                  { value: "newest", label: "Sort: Newest First" },
                  { value: "price_asc", label: "Sort: Price: Low to High" },
                  { value: "price_desc", label: "Sort: Price: High to Low" },
                  { value: "beds_desc", label: "Sort: Bedrooms: Most First" },
                ]}
                ariaLabel="Sort listings"
              />
            </div>

            <button
              onClick={handleResetFilters}
              className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-800 dark:hover:text-emerald-300 underline cursor-pointer"
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Private Property-Style Expandable Single Search Bar & Modal Panel */}
        <div className="mt-4">
          <ExpandableSearchPanel
            key={`${listingCategory}-${query}-${minPrice}-${maxPrice}-${minBeds}-${minBaths}-${minParking}-${furnished}`}
            defaultIntent={listingCategory}
            initialLocations={locationChips}
            initialCategory={category}
            initialTypes={selectedType !== "All" ? [selectedType] : ["All types"]}
            initialMinPrice={minPrice}
            initialMaxPrice={maxPrice}
            initialBeds={minBeds}
            initialBaths={minBaths}
            initialParking={minParking}
            initialFurnishedStatus={furnished}
            initialFeatures={urlFeatures}
            onSearch={handlePanelSearch}
            autoNavigate={true}
            hideIntentToggleOnMobile
            placeholder="Search by suburb, city, province or property ID..."
          />
        </div>

        {/* Quick-Click Lifestyle & Resilience Pills */}
        {/* One swipeable row on phones — wrapping these chips cost four rows and
            pushed the first listing off the screen. Unchanged from `sm` up. */}
        <div className="mt-4 border-t border-slate-200/60 dark:border-white/10 pt-3 -mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:overflow-visible sm:flex-wrap sm:justify-center">
          <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1">
            Quick Filters:
          </span>
          {[
            { id: "pet_friendly", label: "Pet Friendly" },
            { id: "solar_system", label: "Solar & Inverter" },
            { id: "security_estate", label: "Security Estate" },
            { id: "swimming_pool", label: "Swimming Pool" },
            { id: "garden", label: "Garden" },
            { id: "borehole_water", label: "Water Backup" },
            { id: "fibre_ready", label: "Fibre Ready" },
          ].map((feat) => {
            const isChecked = urlFeatures.includes(feat.id);
            return (
              <button
                key={feat.id}
                type="button"
                onClick={() => toggleFeature(feat.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 sm:py-1 text-xs font-semibold transition-all cursor-pointer ${
                  isChecked
                    ? "bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 text-white shadow-sm dark:shadow-[0_0_12px_rgba(16,185,129,0.35)] border border-emerald-500/40 dark:border-emerald-400/50"
                    : "border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#060d0e]/60 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-[#0c1a1c] dark:hover:text-emerald-300 dark:hover:border-emerald-500/40"
                }`}
              >
                {isChecked ? <CheckIcon className="h-3 w-3 text-emerald-300" /> : <span>+</span>}
                <span>{feat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Results Grid */}
      <section className="relative z-10 mt-8">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-[30px] border border-white/60 dark:border-white/10 bg-white/40 dark:bg-[#0c1a1c]/60 animate-pulse" />
            ))}
          </div>
        ) : loadError ? (
          <div
            role="alert"
            className="rounded-[32px] border border-rose-300/80 dark:border-rose-500/30 bg-rose-50/80 dark:bg-rose-500/10 p-12 text-center shadow-lg backdrop-blur-xl"
          >
            <h3 className="text-xl font-bold text-rose-900 dark:text-rose-200">
              We couldn&rsquo;t load the listings
            </h3>
            <p className="mx-auto mt-1 max-w-md text-xs text-rose-800 dark:text-rose-300">
              {loadError} This is a problem on our side, not with your search.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 cursor-pointer rounded-full border border-rose-500/30 bg-gradient-to-r from-rose-700 to-rose-800 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:from-rose-800 hover:to-rose-900"
            >
              Try again
            </button>
          </div>
        ) : filteredProperties.length > 0 ? (
          <>
            {/* 1. Grid View (Photo-first 3-Column Cards) */}
            {viewMode === "grid" && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProperties.map((property) => (
                  <article
                    key={property.id}
                    className="group overflow-hidden rounded-[30px] border border-white/80 dark:border-white/10 bg-white/60 dark:bg-[#0c1a1c]/75 shadow-[0_16px_36px_rgba(36,48,50,0.08)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl"
                  >
                    {/* Photo & Save Button */}
                    <div className="relative h-60 overflow-hidden bg-slate-200 dark:bg-[#060d0e]">
                      <PropertyCardPhotos
                        images={property.gallery?.length ? property.gallery : [property.image]}
                        title={property.title}
                        frameClassName="transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                      <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                          property.listingType === "rent"
                            ? "border-amber-300/60 bg-amber-950/80 text-amber-200"
                            : "border-emerald-300/60 bg-emerald-950/80 text-emerald-200"
                        }`}>
                          {property.listingType === "rent" ? "To Rent" : "For Sale"}
                        </span>
                        {getDisplayTag(property) && (
                          <span className="rounded-full border border-white/30 bg-black/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md dark:border-white/10">
                            {getDisplayTag(property)}
                          </span>
                        )}
                      </div>

                      <div className="absolute top-3 right-3">
                        <SavePropertyButton propertyId={property.id} />
                      </div>

                      <div className="absolute bottom-3 left-3 text-white">
                        <p className="text-2xl font-extrabold">{property.price}</p>
                        {property.listingType === "rent" && property.leaseTerm && (
                          <p className="text-[11px] text-amber-200 font-medium">
                            {property.leaseTerm} Lease {property.furnishedStatus ? `· ${property.furnishedStatus}` : ""}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h2 className="text-lg font-bold text-slate-950 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                            {property.title}
                          </h2>
                          <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <LocationPinIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span>{property.location}</span>
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 dark:bg-[#060d0e]/80 dark:border dark:border-white/10 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 shrink-0">
                          {property.type}
                        </span>
                      </div>

                      <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
                        {property.description}
                      </p>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-200/70 dark:border-white/10 pt-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        <span className="flex items-center gap-1">
                          <BedIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                          <span>{property.beds} Beds</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <BathIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                          <span>{property.baths} Baths</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <CarIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                          <span>{property.parking} Garages</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <AreaIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                          <span>{property.area}</span>
                        </span>
                      </div>

                      {/* Feature Badges */}
                      <div className="mt-3.5 flex flex-wrap gap-1.5">
                        {property.features?.slice(0, 3).map((f) => (
                          <span key={f} className="rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/20">
                            {f.replace("_", " ")}
                          </span>
                        ))}
                        {(property.features?.length ?? 0) > 3 && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 self-center">
                            +{(property.features?.length ?? 0) - 3} more
                          </span>
                        )}
                      </div>

                      {/* Action Link */}
                      <div className="mt-5 pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between">
                        <Link
                          href={`/compare`}
                          className="tap-44 relative text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                        >
                          Compare →
                        </Link>
                        <Link
                          href={`/property/${property.slug || property.id}`}
                          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 hover:from-[#093e3f] hover:to-[#052c2d] dark:hover:from-emerald-500 dark:hover:to-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md dark:shadow-[0_0_20px_rgba(16,185,129,0.35)] border border-emerald-500/30 dark:border-emerald-400/50 transition-all cursor-pointer sm:min-h-0 sm:inline-block"
                        >
                          {property.listingType === "rent" ? "View Rental Experience →" : "View Home Experience →"}
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* 2. List View (Detailed Horizontal Cards) */}
            {viewMode === "list" && (
              <div className="space-y-4">
                {filteredProperties.map((property) => (
                  <PropertyListCard key={property.id} property={property} />
                ))}
              </div>
            )}

            {/* 3. Split Map View (Geospatial Pinboard + Feed) */}
            {viewMode === "map" && (
              <PropertySplitMapView properties={filteredProperties} />
            )}

            {/* 4. Compact Table View (Investor & Yield Matrix) */}
            {viewMode === "compact" && (
              <PropertyCompactTable properties={filteredProperties} />
            )}
          </>
        ) : (
          /* Empty State */
          <div className="rounded-[32px] border border-white/75 dark:border-white/10 bg-white/50 dark:bg-[#0c1a1c]/80 p-12 text-center shadow-lg dark:shadow-[0_20px_45px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 dark:bg-[#060d0e]/80 dark:border dark:border-white/10 shadow-md mb-3 text-slate-400 dark:text-slate-300">
              <HomeIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">No properties matched your criteria</h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              We couldn&rsquo;t find homes matching this combination of province, suburb, price range, and amenities. Try expanding your search or clearing selected filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-md dark:shadow-[0_0_20px_rgba(16,185,129,0.35)] border border-emerald-500/40 cursor-pointer transition-all duration-200"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-transparent px-4 py-5 text-slate-900 dark:text-slate-100 md:px-6 lg:px-8 transition-colors duration-300">
      <Suspense fallback={<div className="text-center py-20 text-slate-500 dark:text-slate-400">Loading search engine...</div>}>
        <SearchContent />
      </Suspense>
    </main>
  );
}
