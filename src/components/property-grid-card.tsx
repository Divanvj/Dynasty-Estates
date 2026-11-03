import Image from "next/image";
import Link from "next/link";

import { BathIcon, BedIcon, CarIcon, LocationPinIcon } from "@/components/icons";
import type { PropertyRecord } from "@/lib/property-data";

type Props = {
  property: PropertyRecord;
  /**
   * The tile's title tag. The listing grids sit at different depths — a city
   * page's own <h1> is the city, so its tiles are <h2>; the national pages put
   * a section heading above the grid, so theirs are <h3>. Hardcoding either
   * one would break the outline on half the routes.
   */
  headingLevel?: "h2" | "h3";
  /** Set on the first row so the grid's visible photographs are not lazy. */
  priority?: boolean;
};

/**
 * The listing tile used by every "browse" grid: /for-sale and /to-rent, and
 * their province and city pages.
 *
 * It exists because those six routes each carried their own copy of this
 * markup, byte-identical apart from the heading level, the badge and the
 * wording of the button. They drifted, as copies do: a mobile sizing pass
 * reached the two national pages and left the four province and city pages
 * 455px tall against the others' 359px, on the most repeated element in the
 * product. One copy now, and the differences that are real are props.
 *
 * This is deliberately NOT merged with `PropertyListCard`. That one is the
 * horizontal row the home feed and /search use — a different layout for a
 * different job, not another copy of this.
 */
export default function PropertyGridCard({ property, headingLevel = "h3", priority = false }: Props) {
  // Both derived rather than passed. The six copies set them by hand to match
  // the route they sat on, which meant a rental appearing in a sale grid would
  // have been labelled "View Property Details". The listing itself knows.
  const isRental = property.listingType === "rent";
  const Heading = headingLevel;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/80 bg-white/70 shadow-md backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
      {/*
        Image Showcase.

        Mobile sizing here is measured against the market: this tile was 455px
        on a 375px screen where Private Property sits at 393 and Property24 at
        399. The photograph, the padding below and the footer button carry the
        difference.
      */}
      <div className="relative h-52 md:h-60 w-full overflow-hidden">
        <Image
          src={property.image}
          alt={property.title}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          {isRental && (
            <span className="rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-white backdrop-blur-md">
              To Rent
            </span>
          )}
          <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
            {property.type}
          </span>
          {/* Only the for-sale city page showed this before. It is driven by
              the listing's own data and appears only when a show day is set,
              so every grid can carry it. */}
          {property.onShow && (
            <span className="rounded-full bg-amber-500/90 px-2.5 py-1 text-xs font-extrabold text-white backdrop-blur-md">
              On Show Sunday
            </span>
          )}
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-baseline justify-between text-white z-10">
          <p className="text-xl font-extrabold tracking-tight">{property.price}</p>
          <span className="text-xs font-semibold text-slate-300">{property.area}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 md:p-5">
        <Heading className="text-base font-bold text-slate-900 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 dark:text-white">
          {/* The card's one real link. `card-link` stretches it over the whole
              tile, and naming it with the title replaces "View Property
              Details" as the link text, which said nothing about which
              property it led to. See globals.css. */}
          <Link className="card-link" href={`/property/${property.slug}`}>
            {property.title}
          </Link>
        </Heading>
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 line-clamp-1 dark:text-slate-400">
          <LocationPinIcon className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-400" />
          <span>{property.location}</span>
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-white/10 pt-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1">
            <BedIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
            <span>{property.beds} Beds</span>
          </div>
          <div className="flex items-center gap-1">
            <BathIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
            <span>{property.baths} Baths</span>
          </div>
          <div className="flex items-center gap-1">
            <CarIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
            <span>{property.parking} Garages</span>
          </div>
        </div>

        {/* A span, not a link: it leads to the same listing as the title, so as
            a link it was a second tab stop and a second announcement for one
            destination. The card overlay covers it, so clicking still opens the
            listing.

            Desktop only. It is already `aria-hidden` on a tile whose whole
            surface opens the listing, so on a phone it was 56px of every card
            restating what tapping anywhere already did. Neither Property24 nor
            Private Property puts a button on a feed tile. */}
        <span
          aria-hidden="true"
          className="mt-4 hidden md:flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white shadow-sm group-hover:bg-slate-800 dark:bg-gradient-to-r dark:from-emerald-600 dark:to-emerald-700 dark:text-white dark:border dark:border-emerald-500/30 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] dark:group-hover:from-emerald-500 dark:group-hover:to-emerald-600 transition-all"
        >
          <span>{isRental ? "View Rental Details" : "View Property Details"}</span>
          <span>→</span>
        </span>
      </div>
    </article>
  );
}
