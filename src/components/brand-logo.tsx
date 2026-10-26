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
        Three brand PNGs exist. Measured opaque bounding boxes:
          dynasty-logo.png        transparent glyph, 29% of canvas width  <- this one
          dynasty-app-icon.png    carries its own rounded corners + 8% margin, so
                                  nesting it produced a double radius and a halo
          dynasty-icon-square.png full-bleed navy tile, zero padding

        The square tile renders the largest mark, but it brings its own navy
        background and would cover the black tile the brand calls for. So the
        transparent glyph stays, and the mark is enlarged by giving it more of
        the tile rather than by switching asset: 48px tile with 4px padding
        leaves a 38px image box, against 26.4px before (+44%).

        Keep `width`/`height` at 2x the rendered box so the optimiser serves a
        sharp source; at the old 31px it would upscale into the larger tile.
      */}
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl overflow-hidden shadow-md border border-neutral-800 dark:border-neutral-700/80 bg-black p-1 group-hover:scale-105 group-hover:border-emerald-500/50 group-hover:shadow-[0_0_16px_rgba(16,185,129,0.3)] transition-all">
        <Image
          src="/dynasty-logo.png"
          alt="Dynasty Estates"
          width={96}
          height={96}
          className="h-full w-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
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
