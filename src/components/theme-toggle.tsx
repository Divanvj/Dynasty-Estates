"use client";

import React from "react";
import { useTheme } from "@/components/theme-provider";

export interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function SunIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

export function MoonIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

/**
 * Dynasty Estates Skeuomorphic Tactile Theme Switcher
 *
 * Light Mode ("LIGHT"):
 * - Luxury ceramic white casing and slider knob
 * - Solar daylight amber illuminated chamber ("LIGHT")
 * - Molded ceramic tactile grip micro-dots
 *
 * Dark Mode ("DARK"):
 * - Obsidian casing and dark gunmetal slider knob
 * - Dynasty signature Electric Emerald neon chamber ("DARK")
 * - Molded dark tactile grip micro-dots
 */
export default function ThemeToggle({
  className = "",
  size = "md",
  showLabel = false,
}: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  // Read straight from the provider. This used to keep a second source of truth
  // — a `mounted` flag plus a MutationObserver watching the `dark` class — to
  // avoid a hydration mismatch, and both setState calls ran inside an effect,
  // which React 19 flags as a cascading render. The provider now reads the
  // preference through `useSyncExternalStore`, so React renders the server
  // snapshot during hydration and swaps to the client value without a mismatch.
  // The observer was tracking a class the provider itself owns.
  const isDark = resolvedTheme === "dark";

  // Symmetrical dimensional scale:
  // trackW = knobW + chamberW + 4 (2px margin each side)
  // travel = chamberW
  const config = {
    sm: {
      trackW: 72,
      trackH: 26,
      knobW: 34,
      knobH: 22,
      travel: 34,
      chamberW: 34,
      textSize: "text-[7.5px]",
      dotCols: "grid-cols-4",
      dotCount: 12,
      dotSize: "w-[2px] h-[2px]",
    },
    md: {
      trackW: 88,
      trackH: 32,
      knobW: 42,
      knobH: 28,
      travel: 42,
      chamberW: 42,
      textSize: "text-[8.5px]",
      dotCols: "grid-cols-4",
      dotCount: 12,
      dotSize: "w-[2.5px] h-[2.5px]",
    },
    lg: {
      trackW: 108,
      trackH: 40,
      knobW: 52,
      knobH: 34,
      travel: 52,
      chamberW: 52,
      textSize: "text-[10px]",
      dotCols: "grid-cols-5",
      dotCount: 15,
      dotSize: "w-[3.5px] h-[3.5px]",
    },
  }[size];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={
          isDark
            ? "Dark mode active — click for light mode"
            : "Light mode active — click for dark mode"
        }
        onClick={toggleTheme}
        suppressHydrationWarning
        style={{
          width: `${config.trackW}px`,
          height: `${config.trackH}px`,
        }}
        className="group relative shrink-0 select-none cursor-pointer rounded-full p-[2px] outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#071315] active:scale-[0.97] transition-transform duration-150"
      >
        {/* ================================================================= */}
        {/* 1. PHYSICAL RECESSED HOUSING TRACK (DEEP WELL INSET SHADOW)       */}
        {/* ================================================================= */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden transition-all duration-300"
          style={{
            backgroundColor: isDark ? "#060e10" : "#f1f5f9",
            border: isDark
              ? "1px solid rgba(16, 185, 129, 0.35)"
              : "1px solid rgba(203, 213, 225, 0.9)",
            boxShadow: isDark
              ? "inset 0 3px 6px rgba(0,0,0,0.95), inset 0 -1px 2px rgba(255,255,255,0.06), 0 0 16px rgba(16,185,129,0.25)"
              : "inset 0 2px 4px rgba(0,0,0,0.12), inset 0 1px 2px rgba(0,0,0,0.08), inset 0 -1px 2px #ffffff, 0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          {/* Subtle outer metallic/bezel rim line */}
          <div
            className={`absolute inset-0 rounded-full pointer-events-none transition-colors duration-300 ${
              isDark ? "border border-black/50" : "border border-white/80"
            }`}
          />

          {/* =============================================================== */}
          {/* 2. ILLUMINATED NEON CHAMBERS                                    */}
          {/* =============================================================== */}

          {/* RIGHT CHAMBER: DYNASTY ELECTRIC EMERALD ("DARK" / DARK MODE) */}
          <div
            className={`absolute top-[2px] bottom-[2px] right-[2px] flex items-center justify-center rounded-r-full transition-all duration-300 ${
              isDark ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
            }`}
            style={{
              width: `${config.chamberW}px`,
              background:
                "radial-gradient(ellipse at 55% 50%, #00ffaa 0%, #10b981 35%, #059669 65%, #022c22 100%)",
              boxShadow:
                "inset 0 2px 4px rgba(0,0,0,0.45), inset 0 -2px 4px rgba(0,0,0,0.35), 0 0 16px rgba(16,185,129,0.85)",
            }}
          >
            {/* Glowing Typography */}
            <span
              className={`font-black tracking-wider text-white uppercase select-none ${config.textSize}`}
              style={{
                textShadow:
                  "0 0 4px #ffffff, 0 0 10px #10b981, 0 0 18px #059669, 0 1px 2px rgba(0,0,0,0.8)",
              }}
            >
              DARK
            </span>
          </div>

          {/* LEFT CHAMBER: WARM SOLAR DAYLIGHT ("LIGHT" / LIGHT MODE) */}
          <div
            className={`absolute top-[2px] bottom-[2px] left-[2px] flex items-center justify-center rounded-l-full transition-all duration-300 ${
              !isDark ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
            }`}
            style={{
              width: `${config.chamberW}px`,
              background:
                "radial-gradient(ellipse at 45% 50%, #fef3c7 0%, #fde68a 35%, #f59e0b 70%, #d97706 100%)",
              boxShadow:
                "inset 0 2px 4px rgba(0,0,0,0.18), inset 0 -1px 2px rgba(255,255,255,0.4), 0 0 12px rgba(245,158,11,0.5)",
            }}
          >
            {/* Glowing Typography */}
            <span
              className={`font-black tracking-wider text-white uppercase select-none ${config.textSize}`}
              style={{
                textShadow:
                  "0 0 4px #ffffff, 0 0 10px #f59e0b, 0 0 14px #d97706, 0 1px 2px rgba(0,0,0,0.5)",
              }}
            >
              LIGHT
            </span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. TACTILE SLIDING KNOB (THUMB WITH EMBOSSED GRIP NUBS)           */}
        {/* ================================================================= */}
        <div
          className="absolute top-[2px] left-[2px] z-20 flex items-center justify-center rounded-full pointer-events-none transition-all duration-300"
          style={{
            width: `${config.knobW}px`,
            height: `${config.knobH}px`,
            transform: !isDark ? `translateX(${config.travel}px)` : "translateX(0px)",
            transition:
              "transform 300ms cubic-bezier(0.34, 1.4, 0.64, 1), background 300ms ease, box-shadow 300ms ease, border-color 300ms ease",
            background: isDark
              ? "linear-gradient(180deg, #444c52 0%, #2f363c 45%, #21272c 95%, #191f23 100%)"
              : "linear-gradient(180deg, #ffffff 0%, #ffffff 40%, #f8fafc 75%, #f1f5f9 100%)",
            boxShadow: isDark
              ? "0 4px 10px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 2px rgba(0,0,0,0.7)"
              : "0 3px 8px rgba(0,0,0,0.14), 0 1px 3px rgba(0,0,0,0.08), inset 0 1px 0 #ffffff, inset 0 -1px 2px rgba(0,0,0,0.06)",
            border: isDark
              ? "1px solid rgba(255,255,255,0.14)"
              : "1px solid rgba(203, 213, 225, 0.8)",
          }}
        >
          {/* Top rim specular highlight */}
          <div
            className={`absolute top-[1px] inset-x-2 h-[1px] rounded-full pointer-events-none ${
              isDark
                ? "bg-gradient-to-r from-transparent via-white/40 to-transparent"
                : "bg-gradient-to-r from-transparent via-white to-transparent"
            }`}
          />

          {/* TACTILE GRIP: EMBOSSED MICRO-DOT GRID */}
          <div className={`grid ${config.dotCols} gap-[3px] items-center justify-center pointer-events-none`}>
            {Array.from({ length: config.dotCount }).map((_, idx) => (
              <span
                key={idx}
                className={`${config.dotSize} rounded-full transition-colors duration-300`}
                style={{
                  backgroundColor: isDark ? "#151b1f" : "#94a3b8",
                  boxShadow: isDark
                    ? "0 1px 0 rgba(255,255,255,0.2), inset 0 1px 1px rgba(0,0,0,0.95)"
                    : "inset 0 1px 1px rgba(0,0,0,0.35), 0 1px 0 #ffffff",
                }}
              />
            ))}
          </div>

          {/* Subtle edge reflection on the knob rim */}
          <div
            className={`absolute inset-0 rounded-full pointer-events-none transition-opacity duration-300 ${
              isDark
                ? "shadow-[inset_-2px_0_4px_rgba(52,211,153,0.3)] opacity-90"
                : "shadow-[inset_2px_0_4px_rgba(245,158,11,0.2)] opacity-80"
            }`}
          />
        </div>
      </button>

      {showLabel && (
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 select-none">
          {isDark ? "Dark" : "Light"}
        </span>
      )}
    </div>
  );
}
