"use client";

import { GridIcon, ListIcon, MapSplitIcon, TableIcon } from "@/components/icons";

export type ViewMode = "grid" | "list" | "map" | "compact";

const VIEWS = [
  { mode: "grid", label: "Grid", Icon: GridIcon, desktopOnly: true },
  { mode: "list", label: "List", Icon: ListIcon, desktopOnly: false },
  { mode: "map", label: "Map", Icon: MapSplitIcon, desktopOnly: false },
  { mode: "compact", label: "Table", Icon: TableIcon, desktopOnly: true },
] as const;

/**
 * Grid / List / Map / Table for a list of homes. Same height, corners, border
 * and background as the CustomSelect it sits beside (owner, 28 Nov 2026: a
 * pill next to a rounded square looked inconsistent). Pills stay for choosing
 * a side (For Sale / To Rent); rounded rectangles control the list.
 *
 * Phones get List and Map: Grid is one tall card per screen there, and the
 * seven-column table a horizontal scroll inside a vertical one. The page
 * coerces those modes to List below `lg` as well.
 */
export default function ViewSwitch({ value, onChange }: { value: ViewMode; onChange: (mode: ViewMode) => void }) {
  return (
    <div
      role="group"
      aria-label="How to show the homes"
      className="inline-flex h-11 shrink-0 items-stretch gap-0.5 rounded-xl border border-slate-300 bg-white p-[3px] shadow-2xs dark:border-white/10 dark:bg-[#0c181a]"
    >
      {VIEWS.map(({ mode, label, Icon, desktopOnly }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          aria-pressed={value === mode}
          aria-label={`${label} view`}
          title={`${label} view`}
          className={`tap-44 relative min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold transition-all lg:min-w-0 ${
            desktopOnly ? "hidden lg:flex" : "flex"
          } ${
            value === mode
              ? "border-emerald-400/50 bg-[#0b4d4e] text-white shadow-xs dark:border-emerald-400/60 dark:bg-emerald-700 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
              : "border-transparent text-slate-600 hover:bg-slate-100/80 hover:text-emerald-950 dark:text-slate-300 dark:hover:bg-surface-panel dark:hover:text-white"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
