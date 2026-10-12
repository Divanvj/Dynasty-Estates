"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { CheckIcon, LocationPinIcon, XMarkIcon } from "@/components/icons";
import {
  getAllCitiesAlphabetical,
  getAllSuburbsAlphabetical,
  searchCities,
  searchSuburbs,
  type CityItem,
  type SuburbItem,
  type SouthAfricanProvince,
} from "@/lib/location-data";

export interface SelectedLocationData {
  name: string;
  city?: string;
  province?: string;
  type: "city" | "suburb";
}

export interface PredictiveLocationInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSelectLocation?: (data: SelectedLocationData) => void;
  type: "city" | "suburb";
  selectedProvince?: string;
  selectedCity?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
}

/**
 * High-visibility substring matcher that bolds and highlights matching letters
 */
function HighlightLetters({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim()) {
    return <span>{text}</span>;
  }

  const clean = query.trim().toLowerCase();
  const index = text.toLowerCase().indexOf(clean);

  if (index === -1) {
    return <span>{text}</span>;
  }

  const before = text.slice(0, index);
  const match = text.slice(index, index + clean.length);
  const after = text.slice(index + clean.length);

  return (
    <span>
      {before}
      <span className="font-extrabold text-emerald-800 bg-emerald-100/90 px-0.5 rounded shadow-2xs">
        {match}
      </span>
      {after}
    </span>
  );
}

export default function PredictiveLocationInput({
  id,
  label,
  value,
  onChange,
  onSelectLocation,
  type,
  selectedProvince,
  selectedCity,
  placeholder,
  className = "",
  inputClassName = "",
  disabled = false,
}: PredictiveLocationInputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isTyping, setIsTyping] = useState(false);
  const [typedQuery, setTypedQuery] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Compute suggestions:
  // If actively typing, filter by typed characters in real time
  // If not typing (or query is empty), show full list in alphabetical order (A–Z)
  const suggestions = useMemo(() => {
    const activeSearch = isTyping ? typedQuery.trim() : "";

    if (type === "city") {
      if (!activeSearch) {
        // Automatically list all South African cities in alphabetical order
        return getAllCitiesAlphabetical(selectedProvince);
      }
      // Real-time letter matching across SA cities
      return searchCities(activeSearch, selectedProvince);
    }

    // Suburb type
    if (!activeSearch) {
      // List all suburbs in alphabetical order (prioritizing selected city)
      return getAllSuburbsAlphabetical(selectedCity, selectedProvince);
    }
    return searchSuburbs(activeSearch, selectedCity, selectedProvince);
  }, [isTyping, typedQuery, type, selectedProvince, selectedCity]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsTyping(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Handle ESC key to dismiss
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setIsTyping(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Keep highlighted item visible in scroll container
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const itemEl = dropdownRef.current.children[highlightedIndex] as HTMLElement | undefined;
      if (itemEl) {
        itemEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  function handleSelectCity(city: CityItem) {
    onChange(city.name);
    setTypedQuery("");
    setIsTyping(false);
    if (onSelectLocation) {
      onSelectLocation({
        name: city.name,
        city: city.name,
        province: city.province,
        type: "city",
      });
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
  }

  function handleSelectSuburb(suburb: SuburbItem) {
    onChange(suburb.name);
    setTypedQuery("");
    setIsTyping(false);
    if (onSelectLocation) {
      onSelectLocation({
        name: suburb.name,
        city: suburb.city,
        province: suburb.province,
        type: "suburb",
      });
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
  }

  function handleClear() {
    onChange("");
    setTypedQuery("");
    setIsTyping(false);
    setIsOpen(true);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setIsOpen(true);
        setIsTyping(false);
      }
      return;
    }

    const count = suggestions.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < count - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : count - 1));
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < count) {
        e.preventDefault();
        const selected = suggestions[highlightedIndex];
        if (type === "city") {
          handleSelectCity(selected as CityItem);
        } else {
          handleSelectSuburb(selected as SuburbItem);
        }
      } else if (suggestions.length > 0) {
        e.preventDefault();
        const top = suggestions[0];
        if (type === "city") {
          handleSelectCity(top as CityItem);
        } else {
          handleSelectSuburb(top as SuburbItem);
        }
      } else {
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setIsTyping(false);
    }
  }

  // Check if current input matches any suggestion exactly
  const hasExactMatch = useMemo(() => {
    const clean = value.trim().toLowerCase();
    if (!clean) return false;
    return suggestions.some((s) => s.name.toLowerCase() === clean);
  }, [suggestions, value]);

  const defaultInputClass =
    "w-full h-[48px] rounded-[18px] border border-white/70 bg-white/60 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 backdrop-blur-md transition-all";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300"
        >
          {label}
        </label>
      )}

      {/* Input container with relative positioning for clear button and icon */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => {
            const nextVal = e.target.value;
            onChange(nextVal);
            setTypedQuery(nextVal);
            setIsTyping(true);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={(e) => {
            setIsOpen(true);
            setIsTyping(false);
            setHighlightedIndex(-1);
            // Select text on focus so user can immediately type to replace or scroll to browse
            e.currentTarget.select();
          }}
          onClick={() => {
            if (!isOpen) {
              setIsOpen(true);
              setIsTyping(false);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            placeholder ||
            (type === "city"
              ? "Select or search city / metro..."
              : "Select or search suburb...")
          }
          className={`${inputClassName || defaultInputClass} pr-14`}
          autoComplete="off"
          spellCheck="false"
        />

        {/* Clear Button (✕) and Dropdown Indicator Arrow (▼) */}
        <div className="absolute right-2 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors cursor-pointer dark:text-slate-300"
              title="Clear selection"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              setIsOpen((prev) => {
                const next = !prev;
                if (next) {
                  setIsTyping(false);
                  setTypedQuery("");
                  inputRef.current?.focus();
                }
                return next;
              });
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer dark:text-slate-300"
            title={isOpen ? "Close suggestions" : "Open suggestions"}
          >
            <span className="text-[10px] select-none text-slate-500 font-bold dark:text-slate-400">
              {isOpen ? "▲" : "▼"}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PREDICTIVE RECOMMENDATIONS DROPDOWN (Strict Search Bar Rules & Styling)     */}
      {/* ========================================================================= */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 flex max-h-72 flex-col overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/98 dark:bg-[#0c1a1c] shadow-[0_20px_50px_rgba(15,23,42,0.18)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl ring-1 ring-slate-950/5 animate-in fade-in zoom-in-95 duration-150">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 bg-slate-50/85 dark:bg-[#060d0e]/90 px-3.5 py-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <LocationPinIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                {type === "city"
                  ? isTyping && typedQuery.trim()
                    ? `Matching Cities (${suggestions.length})`
                    : "South African Cities (A–Z)"
                  : isTyping && typedQuery.trim()
                  ? `Matching Suburbs (${suggestions.length})`
                  : "Suburbs & Estates (A–Z)"}
              </span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400">
              {isTyping && typedQuery.trim()
                ? "Type to filter"
                : "Scroll & click"}
            </span>
          </div>

          {/* Scrollable Recommendations List */}
          <div
            ref={dropdownRef}
            className="overflow-y-auto divide-y divide-slate-100/70 dark:divide-white/5 py-1 max-h-60 scrollbar-thin"
          >
            {suggestions.length > 0 ? (
              suggestions.map((item, idx) => {
                const isSelected = item.name.toLowerCase() === value.trim().toLowerCase();
                const isHighlighted = idx === highlightedIndex;
                const activeFilterText = isTyping ? typedQuery : "";

                if (type === "city") {
                  const city = item as CityItem;
                  return (
                    <button
                      key={`${city.name}-${city.province}`}
                      type="button"
                      onClick={() => handleSelectCity(city)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors cursor-pointer ${
                        isHighlighted
                          ? "bg-emerald-50 dark:bg-[#0c1a1c] text-emerald-950 dark:text-emerald-300"
                          : isSelected
                          ? "bg-slate-50 dark:bg-[#060d0e]/80 text-slate-950 dark:text-white font-semibold"
                          : "text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#060d0e]/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                            isSelected
                              ? "bg-emerald-700 text-white"
                              : isHighlighted
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-600/30 dark:text-emerald-300 dark:border dark:border-emerald-500/40"
                              : "bg-slate-100 text-slate-500 dark:bg-[#060d0e]/80 dark:text-slate-400"
                          }`}
                        >
                          <LocationPinIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-900 block truncate dark:text-white">
                            <HighlightLetters text={city.name} query={activeFilterText} />
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate dark:text-slate-400">
                            {city.province}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pl-2">
                        <span className="rounded-md bg-slate-100 dark:bg-[#060d0e]/80 dark:border dark:border-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                          {city.province}
                        </span>
                        {isSelected && (
                          <CheckIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                }

                // Suburb render
                const suburb = item as SuburbItem;
                const isCityLevel = suburb.name === suburb.city;

                return (
                  <button
                    key={`${suburb.name}-${suburb.city}-${suburb.province}`}
                    type="button"
                    onClick={() => handleSelectSuburb(suburb)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors cursor-pointer ${
                      isHighlighted
                        ? "bg-emerald-50 dark:bg-[#0c1a1c] text-emerald-950 dark:text-emerald-300"
                        : isSelected
                        ? "bg-slate-50 dark:bg-[#060d0e]/80 text-slate-950 dark:text-white font-semibold"
                        : "text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#060d0e]/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                          isSelected
                            ? "bg-emerald-700 text-white"
                            : isHighlighted
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-600/30 dark:text-emerald-300 dark:border dark:border-emerald-500/40"
                            : "bg-slate-100 text-slate-500 dark:bg-[#060d0e]/80 dark:text-slate-400"
                        }`}
                      >
                        <LocationPinIcon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 block truncate dark:text-white">
                          <HighlightLetters text={suburb.name} query={activeFilterText} />
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate dark:text-slate-400">
                          {isCityLevel
                            ? `City / Metro in ${suburb.province}`
                            : `${suburb.city} • ${suburb.province}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      <span className="rounded-md bg-slate-100 dark:bg-[#060d0e]/80 dark:border dark:border-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                        {suburb.city}
                      </span>
                      {isSelected && (
                        <CheckIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  No matching {type === "city" ? "cities" : "suburbs"} found.
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 dark:text-slate-400">
                  Try checking your spelling or select from the list.
                </p>
              </div>
            )}

            {/* Custom Input Option if user is adding an unlisted private estate or area */}
            {value.trim() && !hasExactMatch && (
              <button
                type="button"
                onClick={() => {
                  if (type === "city") {
                    handleSelectCity({
                      name: value.trim(),
                      province: (selectedProvince as SouthAfricanProvince) || "Gauteng",
                    });
                  } else {
                    handleSelectSuburb({
                      name: value.trim(),
                      city: selectedCity || "Johannesburg",
                      province: (selectedProvince as SouthAfricanProvince) || "Gauteng",
                    });
                  }
                }}
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs bg-amber-50/70 hover:bg-amber-100/80 text-amber-950 transition-colors cursor-pointer border-t border-amber-200/50"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-800 text-sm">+</span>
                  <span>
                    Use custom {type}: <strong>&ldquo;{value.trim()}&rdquo;</strong>
                  </span>
                </div>
                <span className="rounded-md bg-amber-200/70 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                  Use custom
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
