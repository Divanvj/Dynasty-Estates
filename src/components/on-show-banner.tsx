"use client";

import { CalendarIcon, LocationPinIcon } from "@/components/icons";
import PropertyInquiryButton from "@/components/property-inquiry-button";
import { describeShow, type OnShow } from "@/lib/on-show";

interface OnShowBannerProps {
  propertyId: string;
  propertyTitle: string;
  location: string;
  onShow: OnShow;
}

/**
 * The listing's viewing section. Replaces the "ON SHOW SUNDAY" pill that sat
 * on the photo: that pill gave no date, no time and no way to act, and it read
 * a yearless date so it stayed up after the show was over. This says when,
 * how to get there, and offers a private viewing to anyone who can't make it.
 * Renders only when the show day is known and still ahead.
 */
export default function OnShowBanner({ propertyId, propertyTitle, location, onShow }: OnShowBannerProps) {
  const show = describeShow(onShow);
  if (!show) return null;

  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    `Show day: ${propertyTitle}`
  )}&location=${encodeURIComponent(location)}&details=${encodeURIComponent(
    `Viewing hours: ${onShow.time}${onShow.directionsNote ? `\nHow to get there: ${onShow.directionsNote}` : ""}`
  )}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

  return (
    <section
      aria-label="Show day"
      className="rounded-card border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur-xl sm:p-5 dark:border-white/10 dark:bg-surface-panel/80"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-quiet)] text-[var(--brand)] dark:bg-emerald-950/60 dark:text-emerald-300">
            <CalendarIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--brand)] dark:text-emerald-300">{show.label}</p>
            <p className="text-lg font-bold text-slate-950 dark:text-white">
              {onShow.date} · {onShow.time}
            </p>
            {onShow.directionsNote && (
              <p className="mt-0.5 flex items-start gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                <LocationPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                <span>{onShow.directionsNote}</span>
              </p>
            )}
          </div>
        </div>

        {/* Links, not buttons, for calendar and directions so the print rules
            keep the date and route on paper and drop only the controls. */}
        <div className="no-print flex flex-wrap items-center gap-2 md:shrink-0">
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pill gap-1.5 bg-slate-950 font-bold text-white hover:bg-slate-800 transition-colors dark:bg-emerald-700 dark:hover:bg-emerald-800"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            Add to calendar
          </a>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pill border border-slate-300 bg-white font-bold text-slate-800 hover:bg-slate-50 transition-colors dark:border-white/10 dark:bg-surface-ink dark:text-slate-200"
          >
            Directions ↗
          </a>
          <PropertyInquiryButton
            propertyId={propertyId}
            propertyTitle={propertyTitle}
            kind="viewing"
            className="pill border border-slate-300 bg-white font-bold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer dark:border-white/10 dark:bg-surface-ink dark:text-slate-200"
          >
            Can&rsquo;t make it? Book a private viewing
          </PropertyInquiryButton>
        </div>
      </div>
    </section>
  );
}
