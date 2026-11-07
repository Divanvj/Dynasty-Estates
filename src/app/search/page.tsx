"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import SavePropertyButton from "@/components/save-property-button";
import ExpandableSearchPanel, { type SearchFilters } from "@/components/expandable-search-panel";
import PropertyCardPhotos from "@/components/property-card-photos";
import PropertyListCard from "@/components/property-list-card";
import PropertyCompactTable from "@/components/property-compact-table";
import PropertySplitMapView from "@/components/property-split-map-view";
import CustomSelect from "@/components/custom-select";
import { featureLabel } from "@/lib/feature-labels";
import { LG_QUERY, useMediaQuery } from "@/lib/use-media-query";
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

/** "All" plus every value the filter panel's type options can set. */
const KNOWN_PROPERTY_TYPES = [
  "All",
  "All types",
  "House",
  "Villa",
  "Apartment",
  "Penthouse",
  "Estate Home",
  "Townhouse",
  "Land",
];

/** R 950 000 / R 2.5m — short enough for a filter chip. */
function shortRand(amount: number): string {
  if (amount >= 1_000_000) return `R ${Number((amount / 1_000_000).toFixed(1))}m`;
  return `R ${amount.toLocaleString("en-ZA")}`;
}

type ActiveFilter = { id: string; label: string; remove: string[]; dropLocation?: string };

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
  // An unknown value (a hand-edited or old link such as `?type=sale`) used to
  // filter on a type no listing has and silently return zero. It now falls
  // back to All, the same as a missing value.
  const rawType = searchParams.get("type") ?? "All";
  const selectedType = KNOWN_PROPERTY_TYPES.includes(rawType) ? rawType : "All";
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

  const requestedView: ViewMode =
    urlView === "list" || urlView === "grid" || urlView === "map" || urlView === "compact"
      ? urlView
      : localView;

  /**
   * Phones get List and Map; Grid and Table are desktop-only.
   *
   * Grid puts one tall card per screen, and the seven-column investor table is
   * a horizontal scroll inside a vertical one. Neither earns its place on a
   * phone, and the switcher was four 44px squares in a row that already wrapped
   * to three lines beside the sort control.
   *
   * Coerced here as well as hidden in the markup, because the mode also comes
   * from `?view=` and from localStorage — someone who last used Grid on a
   * laptop, or follows a shared `?view=compact` link, would otherwise land in a
   * layout with no control on screen to leave it.
   *
   * `serverValue: true` so the desktop case — far the more common one for a
   * link carrying `?view=` — renders its real layout on the first pass; a phone
   * corrects itself the moment it hydrates.
   */
  const isDesktop = useMediaQuery(LG_QUERY, true);
  const viewMode: ViewMode =
    isDesktop || requestedView === "map" ? requestedView : "list";

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

  /**
   * Whether the visitor has actually narrowed the catalogue.
   *
   * Buy-vs-rent is deliberately NOT in here. It is always set — the page opens
   * on one or the other — so counting it would mean the result count is always
   * "applied", which is the state this flag exists to distinguish.
   *
   * The count badge is hidden until this is true. Before it, the number is just
   * "how many listings exist", which says nothing to the visitor, and during
   * the first load it rendered "0 Available" against an empty grid — the exact
   * shape of "we have nothing for you" on a page that was still fetching.
   */
  const hasActiveFilters =
    Boolean(query.trim()) ||
    Boolean(province) ||
    Boolean(city) ||
    (selectedType !== "All" && selectedType !== "All types") ||
    minBeds !== "Any" ||
    minBaths !== "Any" ||
    minParking !== "Any" ||
    furnished !== "Any" ||
    minPrice > 0 ||
    maxPrice > 0 ||
    urlFeatures.length > 0;

  // Extract initial location chips from query if any
  const locationChips = useMemo(() => {
    if (!query.trim()) return [];
    return query
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [query]);

  /**
   * Every narrowing the visitor has applied, as removable chips. Shown above
   * the results and named in the empty state — "No properties matched your
   * criteria" used to leave the visitor to guess which filter emptied the list.
   */
  const activeFilters: ActiveFilter[] = [
    ...locationChips.map((loc) => ({ id: `q:${loc}`, label: loc, remove: [], dropLocation: loc })),
    ...(province ? [{ id: "province", label: province, remove: ["province"] }] : []),
    ...(city ? [{ id: "city", label: city, remove: ["city"] }] : []),
    ...(selectedType !== "All" && selectedType !== "All types"
      ? [{ id: "type", label: selectedType, remove: ["type"] }]
      : []),
    ...(minBeds !== "Any" ? [{ id: "beds", label: `${minBeds.replace("+", "")}+ beds`, remove: ["beds"] }] : []),
    ...(minBaths !== "Any" ? [{ id: "baths", label: `${minBaths.replace("+", "")}+ baths`, remove: ["baths"] }] : []),
    ...(minParking !== "Any"
      ? [{ id: "parking", label: `${minParking.replace("+", "")}+ parking`, remove: ["parking"] }]
      : []),
    ...(furnished !== "Any" ? [{ id: "furnished", label: furnished, remove: ["furnished"] }] : []),
    ...(minPrice > 0 || maxPrice > 0
      ? [
          {
            id: "price",
            label:
              minPrice > 0 && maxPrice > 0
                ? `${shortRand(minPrice)} – ${shortRand(maxPrice)}`
                : maxPrice > 0
                  ? `Under ${shortRand(maxPrice)}`
                  : `From ${shortRand(minPrice)}`,
            remove: ["minPrice", "maxPrice"],
          },
        ]
      : []),
    ...urlFeatures.map((f) => ({ id: `f:${f}`, label: featureLabel(f), remove: [] as string[] })),
  ];

  function removeFilter(filter: ActiveFilter) {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of filter.remove) params.delete(key);
    if (filter.dropLocation) {
      const rest = locationChips.filter((loc) => loc !== filter.dropLocation);
      if (rest.length) params.set("q", rest.join(", "));
      else params.delete("q");
    }
    if (filter.id.startsWith("f:")) {
      const rest = urlFeatures.filter((f) => `f:${f}` !== filter.id);
      if (rest.length) params.set("features", rest.join(","));
      else params.delete("features");
    }
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }

  const resultNoun = listingCategory === "rent" ? "to rent" : "for sale";

  return (
    <div className="mx-auto max-w-[1440px]">
      {/* No page header: brand, menu and account are SiteHeader (lg+) and
          MobileAppBar. This one repeated Home · Collections · Compare · Saved,
          all of which the global menu and account menu already carry. */}
      {/* Comprehensive Search & Filter Console */}
      <section className="relative z-30 rounded-panel border border-white/80 bg-white/60 dark:border-white/10 dark:bg-surface-panel/65 p-4 sm:p-6 shadow-[0_20px_45px_rgba(36,48,50,0.1)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/10 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs uppercase tracking-[0.24em] text-slate-600 dark:text-slate-400 font-bold">Catalogue</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              {/* Category Segmented Control: Strict Separation. Order matches
                  the search panel rendered further down this same page — they
                  sit ~160px apart, so a mismatch is immediately visible.
                  The selected category still comes from the URL, not from here. */}
              <div className="relative grid grid-cols-2 w-44 p-0.5 rounded-full border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#071315]/80 shadow-xs transition-all duration-300 hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-[0_0_16px_rgba(16,185,129,0.38)] dark:hover:shadow-[0_0_20px_rgba(52,211,153,0.38)]">
                {/* Sliding indicator pill */}
                <span
                  className={`absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-900 dark:to-[#073031] border border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-transform duration-200 ease-out pointer-events-none ${
                    listingCategory === "rent" ? "translate-x-full" : "translate-x-0"
                  }`}
                />
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
              </div>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
              {listingCategory === "rent"
                ? "South African Rental Residences"
                : "South African Homes For Sale"}
            </h1>
          </div>

          {/* View Switcher & Sort. On a phone these share one row (sort takes
              the remaining width) instead of stacking into three, which with
              Reset All pushed the first listing two-thirds of the way down the
              screen. The result count now sits directly above the results. */}
          <div className="flex w-full flex-nowrap items-center gap-2.5 sm:w-auto sm:flex-wrap sm:gap-3">
            {/* View Mode Switcher Segmented Control.

                The unselected states carry `border border-transparent` so all
                four buttons are the same height. Only the selected one had a
                border, and with `box-sizing: border-box` on a padding-derived
                box that made it 34px against the others' 32px — so the control
                shifted by 2px every time you switched view. */}
            <div className="inline-flex items-center rounded-2xl border border-slate-200/90 bg-white/80 dark:border-white/10 dark:bg-surface-ink/60 p-1 shadow-2xs backdrop-blur-md">
              <button
                type="button"
                onClick={() => handleViewChange("grid")}
                // `hidden lg:flex`: Grid is desktop-only. On a phone it is one
                // tall card per screen, and the mode is coerced to List above
                // anyway, so leaving the control on screen would just be a
                // button that appears to do nothing.
                className={`hidden min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer lg:flex lg:min-h-0 lg:min-w-0 ${
                  viewMode === "grid"
                    ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white border border-emerald-400/50 dark:border-emerald-500/50 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                    : "border border-transparent text-slate-600 dark:text-slate-300 hover:text-emerald-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-surface-panel"
                }`}
                title="Grid View (3 Columns)"
              >
                <GridIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewChange("list")}
                className={`flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer lg:min-h-0 lg:min-w-0 ${
                  viewMode === "list"
                    ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white border border-emerald-400/50 dark:border-emerald-500/50 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                    : "border border-transparent text-slate-600 dark:text-slate-300 hover:text-emerald-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-surface-panel"
                }`}
                title="List View (Detailed Horizontal Cards)"
              >
                <ListIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewChange("map")}
                className={`flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer lg:min-h-0 lg:min-w-0 ${
                  viewMode === "map"
                    ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white border border-emerald-400/50 dark:border-emerald-500/50 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                    : "border border-transparent text-slate-600 dark:text-slate-300 hover:text-emerald-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-surface-panel"
                }`}
                title="Split Map View (Interactive Map + Listings)"
              >
                <MapSplitIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Map</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewChange("compact")}
                // `hidden lg:flex`: the seven-column investor table is a
                // horizontal scroll inside a vertical one on a phone. Same
                // reasoning as Grid above.
                className={`hidden min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer lg:flex lg:min-h-0 lg:min-w-0 ${
                  viewMode === "compact"
                    ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white border border-emerald-400/50 dark:border-emerald-500/50 shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                    : "border border-transparent text-slate-600 dark:text-slate-300 hover:text-emerald-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-surface-panel"
                }`}
                title="Compact Table View (Investor & Yield Matrix)"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative min-w-0 flex-1 sm:min-w-[170px] sm:flex-none">
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

            {/* Only when there is something to reset; the active-filter chips
                above the results carry it on phones too. */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="hidden text-xs font-medium text-slate-600 underline cursor-pointer hover:text-emerald-800 sm:inline dark:text-slate-400 dark:hover:text-emerald-300"
              >
                Reset All
              </button>
            )}
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
            // The catalogue switch above is this page's one For Sale / To Rent
            // control; the panel's own copy sat ~160px below it on desktop.
            hideIntentToggle
            placeholder="Suburb or city"
          />
        </div>

        {/* Quick-Click Lifestyle & Resilience Pills */}
        {/* One swipeable row on phones — wrapping these chips cost four rows and
            pushed the first listing off the screen. Unchanged from `sm` up. */}
        <div className="mt-4 border-t border-slate-200/60 dark:border-white/10 pt-3 -mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:overflow-visible sm:flex-wrap sm:justify-center">
          <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-500 mr-1">
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
                    : "border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-surface-ink/60 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-surface-panel dark:hover:text-emerald-300 dark:hover:border-emerald-500/40"
                }`}
              >
                {isChecked ? <CheckIcon className="h-3 w-3 text-emerald-300" /> : <span>+</span>}
                <span>{feat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Results count and active filters, directly above the first card. */}
      {!loading && !loadError && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <p aria-live="polite" className="mr-1 text-sm font-semibold text-slate-800 tabular-nums dark:text-slate-200">
            {filteredProperties.length} {filteredProperties.length === 1 ? "home" : "homes"} {resultNoun}
          </p>
          {activeFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => removeFilter(filter)}
              aria-label={`Remove filter: ${filter.label}`}
              className="tap-44 relative inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900 transition-colors hover:bg-emerald-100 cursor-pointer dark:bg-emerald-950/50 dark:text-emerald-200 dark:hover:bg-emerald-900/60"
            >
              {filter.label}
              <span aria-hidden="true">×</span>
            </button>
          ))}
          {activeFilters.length > 1 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-medium text-slate-600 underline cursor-pointer hover:text-emerald-800 dark:text-slate-400 dark:hover:text-emerald-300"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Results Grid */}
      <section className="relative z-10 mt-4">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-panel border border-white/60 dark:border-white/10 bg-white/40 dark:bg-surface-panel/60 animate-pulse" />
            ))}
          </div>
        ) : loadError ? (
          <div
            role="alert"
            className="rounded-panel border border-rose-300/80 dark:border-rose-500/30 bg-rose-50/80 dark:bg-rose-500/10 p-12 text-center shadow-lg backdrop-blur-xl"
          >
            <h3 className="text-xl font-bold text-rose-900 dark:text-rose-200">
              We couldn&rsquo;t load the listings
            </h3>
            <p className="mx-auto mt-1 max-w-md text-xs text-rose-800 dark:text-rose-300">
              {loadError} This is a problem on our side, not with your search.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="pill-lg mt-5 cursor-pointer border border-rose-500/30 bg-gradient-to-r from-rose-700 to-rose-800 font-bold text-white shadow-md hover:from-rose-800 hover:to-rose-900"
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
                    // `relative` anchors the .card-link overlay on the title
                    // below, which makes the whole card open the listing.
                    className="group relative overflow-hidden rounded-panel border border-white/80 dark:border-white/10 bg-white/60 dark:bg-surface-panel/75 shadow-[0_16px_36px_rgba(36,48,50,0.08)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl"
                  >
                    {/* Photo & Save Button */}
                    <div className="relative h-60 overflow-hidden bg-slate-200 dark:bg-surface-ink">
                      <PropertyCardPhotos
                        images={property.gallery?.length ? property.gallery : [property.image]}
                        title={property.title}
                        frameClassName="transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* z-10, like the list card's. PropertyCardPhotos paints
                          its frames at z-10, so everything meant to sit ON the
                          photograph needs it too: without it this gradient, the
                          tag and the price below were all rendered underneath
                          the photo, and a grid card showed no price at all. */}
                      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                      {/* No For Sale / To Rent chip. The visitor picked one of
                          the two to get here, so every card in the grid carried
                          the same word back at them. */}
                      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap">
                        {getDisplayTag(property) && (
                          <span className="badge border border-white/30 bg-black/50 text-white backdrop-blur-md dark:border-white/10">
                            {getDisplayTag(property)}
                          </span>
                        )}
                      </div>

                      {/* z-30: saving is a different action from opening the
                          listing, so it stays above the card overlay. */}
                      <div className="absolute top-3 right-3 z-30">
                        <SavePropertyButton propertyId={property.id} />
                      </div>

                      <div className="absolute bottom-3 left-3 z-10 text-white">
                        <p className="text-2xl font-extrabold">{property.price}</p>
                        {property.listingType === "rent" && property.leaseTerm && (
                          <p className="text-xs text-amber-200 font-medium">
                            {property.leaseTerm} Lease {property.furnishedStatus ? `· ${property.furnishedStatus}` : ""}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {/* The card's one real link; `card-link` stretches
                              it over the whole card. See globals.css. */}
                          <h2 className="text-lg font-bold text-slate-950 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                            <Link className="card-link" href={`/property/${property.slug || property.id}`}>
                              {property.title}
                            </Link>
                          </h2>
                          <p className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            <LocationPinIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-500 shrink-0" />
                            <span>{property.location}</span>
                          </p>
                        </div>
                        <span className="badge border border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-surface-ink/80 dark:text-slate-200">
                          {property.type}
                        </span>
                      </div>

                      <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
                        {property.description}
                      </p>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-200/70 dark:border-white/10 pt-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        <span className="flex items-center gap-1">
                          <BedIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-500" />
                          <span>{property.beds} Beds</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <BathIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-500" />
                          <span>{property.baths} Baths</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <CarIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-500" />
                          <span>{property.parking} Garages</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <AreaIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-500" />
                          <span>{property.area}</span>
                        </span>
                      </div>

                      {/* Feature Badges */}
                      <div className="mt-3.5 flex flex-wrap gap-1.5">
                        {property.features?.slice(0, 3).map((f) => (
                          <span key={f} className="rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/20">
                            {featureLabel(f)}
                          </span>
                        ))}
                        {(property.features?.length ?? 0) > 3 && (
                          <span className="text-xs text-slate-600 dark:text-slate-500 self-center">
                            +{(property.features?.length ?? 0) - 3} more
                          </span>
                        )}
                      </div>

                      {/* Action Link */}
                      <div className="mt-5 pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between">
                        {/* z-30 for the same reason as Save: comparing is not
                            opening. */}
                        <Link
                          href={`/compare?ids=${encodeURIComponent(property.id)}`}
                          className="tap-44 relative z-30 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                        >
                          Compare →
                        </Link>
                        {/* A span, not a link: same destination as the title,
                            so as a link it duplicated the tab stop. */}
                        <span
                          aria-hidden="true"
                          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-gradient-to-r from-[#0b4d4e] to-[#07393a] dark:from-emerald-600 dark:to-emerald-700 group-hover:from-[#093e3f] group-hover:to-[#052c2d] dark:group-hover:from-emerald-500 dark:group-hover:to-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md dark:shadow-[0_0_20px_rgba(16,185,129,0.35)] border border-emerald-500/30 dark:border-emerald-400/50 transition-all sm:min-h-0 sm:inline-block"
                        >
                          View home →
                        </span>
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
          <div className="rounded-panel border border-white/75 dark:border-white/10 bg-white/50 dark:bg-surface-panel/80 p-12 text-center shadow-lg dark:shadow-[0_20px_45px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 dark:bg-surface-ink/80 dark:border dark:border-white/10 shadow-md mb-3 text-slate-600 dark:text-slate-300">
              <HomeIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
              No homes {resultNoun}
              {activeFilters.length > 0 ? ` match ${activeFilters.map((f) => f.label).join(" · ")}` : " yet"}
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-600 dark:text-slate-300">
              {activeFilters.length > 0
                ? "Remove a filter above to widen the search."
                : listingCategory === "rent"
                  ? "Try homes for sale instead."
                  : "Try homes to rent instead."}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              {activeFilters.length > 0 ? (
                <>
                  {/* The single most likely fix first: the last filter added. */}
                  <button
                    type="button"
                    onClick={() => removeFilter(activeFilters[activeFilters.length - 1])}
                    className="pill-lg border border-emerald-500/40 bg-[var(--brand)] font-bold text-white shadow-md hover:bg-[var(--brand-hover)] cursor-pointer transition-colors"
                  >
                    Remove &ldquo;{activeFilters[activeFilters.length - 1].label}&rdquo;
                  </button>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="pill-lg border border-slate-300 bg-white/80 font-bold text-slate-800 hover:bg-white cursor-pointer dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-200"
                  >
                    Clear all filters
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCategoryChange(listingCategory === "rent" ? "buy" : "rent")}
                  className="pill-lg border border-emerald-500/40 bg-[var(--brand)] font-bold text-white shadow-md hover:bg-[var(--brand-hover)] cursor-pointer transition-colors"
                >
                  {listingCategory === "rent" ? "Show homes for sale" : "Show homes to rent"}
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-transparent px-4 py-5 text-slate-900 dark:text-slate-100 md:px-6 lg:px-8 transition-colors duration-300">
      <Suspense fallback={<div className="text-center py-20 text-slate-600 dark:text-slate-400">Loading search engine...</div>}>
        <SearchContent />
      </Suspense>
    </main>
  );
}
