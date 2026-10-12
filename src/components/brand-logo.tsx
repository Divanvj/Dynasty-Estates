import Link from "next/link";
import Image from "next/image";

interface BrandLogoProps {
  href?: string;
  /** Second line of the wordmark. */
  subtitle?: string;
  /** Eyebrow line above it. */
  category?: string;
  /** Hide the wordmark entirely and show only the mark. */
  markOnly?: boolean;
  /**
   * Force the light-on-dark wordmark. Needed on surfaces that are dark in both
   * themes (the agent console), where the theme-driven colours would otherwise
   * render near-black text on a near-black panel.
   */
  onDark?: boolean;
  className?: string;
}

export default function BrandLogo({
  href = "/",
  subtitle = "Estates",
  category = "Dynasty",
  markOnly = false,
  onDark = false,
  className = "",
}: BrandLogoProps) {
  return (
    <Link
      href={href}
      aria-label="Dynasty Estates — home"
      className={`group flex shrink-0 items-center gap-2.5 sm:gap-3 ${className}`}
    >
      {/*
        Three brand PNGs exist and only one suits a tile. Measured opaque
        bounding boxes:
          dynasty-logo.png       glyph is 29% of canvas width -> renders tiny
          dynasty-app-icon.png   has its own rounded corners + 8% margin, so
                                 nesting it produced a double radius and halo
          dynasty-icon-square.png full-bleed, zero padding  <- this one
        A ring rather than a border, so no inset gap appears against the art.
      */}
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl overflow-hidden shadow-md border border-emerald-400/40 bg-gradient-to-br from-[#0c4e50] to-[#07393a] dark:from-[#092224] dark:to-[#041315] p-2 group-hover:scale-105 group-hover:border-emerald-400 group-hover:shadow-[0_0_16px_rgba(16,185,129,0.4)] transition-all">
        <Image
          src="/dynasty-logo.png"
          alt="Dynasty Estates"
          width={28}
          height={28}
          className="h-full w-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
          priority
        />
      </div>

      {!markOnly && (
        <span className="hidden min-[400px]:block">
          <span
            className={`block text-[10px] font-bold uppercase leading-tight tracking-[0.24em] ${
              onDark ? "text-emerald-400/80" : "text-slate-500 dark:text-emerald-400/80"
            }`}
          >
            {category}
          </span>
          <span
            className={`block text-sm font-bold leading-tight ${
              onDark ? "text-white" : "text-slate-900 dark:text-white"
            }`}
          >
            {subtitle}
          </span>
        </span>
      )}
    </Link>
  );
}
