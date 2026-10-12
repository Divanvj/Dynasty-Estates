"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { CheckIcon, ChevronDownIcon } from "@/components/icons";

export type SelectOption = {
  value: string;
  label: string;
  sublabel?: string;
};

export interface CustomSelectProps {
  id?: string;
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  options: (string | { value: string | number; label: string; sublabel?: string })[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  searchable?: boolean;
  disabled?: boolean;
  align?: "left" | "right" | "mobile-right";
  ariaLabel?: string;
  icon?: React.ReactNode;
}

export default function CustomSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
  buttonClassName = "",
  menuClassName = "",
  searchable,
  disabled = false,
  align = "left",
  ariaLabel,
  icon,
}: CustomSelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options into { value, label, sublabel }
  const normalizedOptions: SelectOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt };
      }
      return {
        value: String(opt.value),
        label: opt.label,
        sublabel: opt.sublabel,
      };
    });
  }, [options]);

  const strValue = String(value ?? "");

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => opt.value === strValue);
  }, [normalizedOptions, strValue]);

  // Should show search input? (explicitly enabled or if list is large)
  const isSearchable = searchable ?? normalizedOptions.length > 8;

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  }, [normalizedOptions, searchQuery]);

  function closeMenu() {
    setIsOpen(false);
    setSearchQuery("");
  }

  function toggleMenu() {
    if (disabled) return;
    setIsOpen((prev) => {
      if (prev) setSearchQuery("");
      return !prev;
    });
  }

  // Auto-focus search input when menu opens
  useEffect(() => {
    if (isOpen && isSearchable) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isSearchable]);

  // Handle click outside and Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleSelect(val: string) {
    onChange(val);
    closeMenu();
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${isOpen ? "z-[60]" : "z-10"} ${className}`}
    >
      {/* Trigger Button */}
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || label || placeholder}
        onClick={toggleMenu}
        className={`w-full h-full text-left transition-all duration-200 cursor-pointer select-none ${
          buttonClassName ||
          `flex items-center justify-between rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#0c181a] px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-[0_0_16px_rgba(16,185,129,0.35)] dark:hover:shadow-[0_0_20px_rgba(52,211,153,0.35)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:shadow-[0_0_20px_rgba(16,185,129,0.4)] ${
            isOpen
              ? "border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/20 shadow-[0_0_16px_rgba(16,185,129,0.3)] dark:shadow-[0_0_20px_rgba(52,211,153,0.35)]"
              : ""
          }`
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <div className="min-w-0 flex-1 pr-2 flex items-center gap-2 text-left">
          {icon && <span className="shrink-0 text-emerald-600 dark:text-emerald-400">{icon}</span>}
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            {label && (
              <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none truncate mb-0.5">
                {label}
              </span>
            )}
            <span
              className={`block truncate text-xs font-semibold leading-tight ${
                selectedOption?.label
                  ? "text-slate-900 dark:text-slate-100"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {selectedOption?.label || placeholder}
            </span>
          </div>
        </div>

        <ChevronDownIcon
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-emerald-600 dark:text-emerald-400" : ""
          }`}
        />
      </button>

      {/* Floating Custom Dropdown Menu */}
      {isOpen && (
        <>
          {/* Transparent Backdrop Shield */}
          <div
            className="fixed inset-0 z-[70] bg-black/5 sm:bg-transparent"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            role="listbox"
            aria-labelledby={selectId}
            className={`absolute ${
              align === "right"
                ? "right-0"
                : align === "mobile-right"
                ? "right-0 md:left-0 md:right-auto"
                : "left-0"
            } top-[calc(100%+6px)] z-[80] w-full min-w-[200px] sm:min-w-[220px] max-w-[calc(100vw-32px)] rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/98 dark:bg-[#0c181a]/98 p-1.5 shadow-[0_20px_50px_rgba(15,23,42,0.18)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl ring-1 ring-slate-950/5 dark:ring-white/10 animate-in fade-in zoom-in-95 duration-150 ${menuClassName}`}
          >
            {/* Quick Search Filter (for long lists like provinces / towns) */}
            {isSearchable && (
              <div className="p-1 pb-1.5 border-b border-slate-100 dark:border-white/10">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quick search..."
                  className="w-full rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-[#081012] focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-3 text-center text-xs text-slate-400 dark:text-slate-500">
                  No matching options
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option.value === strValue;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(option.value)}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#0b4d4e] dark:bg-emerald-600 text-white font-bold shadow-sm dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                          : "text-slate-700 dark:text-slate-200 font-semibold hover:bg-emerald-50/90 dark:hover:bg-emerald-500/20 hover:text-emerald-950 dark:hover:text-emerald-300"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="block truncate">{option.label}</span>
                        {option.sublabel && (
                          <span
                            className={`block truncate text-[10px] font-normal ${
                              isSelected ? "text-emerald-100" : "text-slate-400 dark:text-slate-500"
                            }`}
                          >
                            {option.sublabel}
                          </span>
                        )}
                      </div>

                      {isSelected && (
                        <CheckIcon className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
