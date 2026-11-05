"use client";

import { CalendarIcon, LocationPinIcon } from "@/components/icons";

interface OnShowBannerProps {
  propertyTitle: string;
  location: string;
  onShow: {
    date: string;
    /**
     * Machine-readable date, `YYYY-MM-DD`. `date` above is display text with
     * no year ("Sunday, 14 Sep"), which cannot be compared to today — which is
     * how every listing came to advertise a show seven weeks in the past under
     * a "This Weekend" badge. Without this field the banner does not render.
     */
    isoDate?: string;
    time: string;
    directionsNote?: string;
  };
}

/**
 * Whether a show is still worth advertising, and whether "this weekend" is
 * honest.
 *
 * The past cut-off is yesterday rather than today on purpose. This is a client
 * component that also renders on the server: Vercel runs UTC and the reader is
 * on SAST (+2), so a same-day comparison can disagree across the two and
 * change whether the banner exists, which React reports as a hydration
 * mismatch. A full day of slack makes that practically impossible while still
 * catching the case this fixes, where the date is weeks stale.
 */
function describeShow(isoDate: string | undefined, now: Date) {
  if (!isoDate) return null;
  const when = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(when.getTime())) return null;

  const dayMs = 24 * 60 * 60 * 1000;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysAway = Math.round((when.getTime() - startOfToday.getTime()) / dayMs);

  if (daysAway < -1) return null;

  const weekday = when.getDay(); // 0 Sun, 6 Sat
  const isWeekend = weekday === 0 || weekday === 6;
  const label =
    daysAway >= 0 && daysAway <= 7 && isWeekend
      ? "On show this weekend"
      : daysAway === 0
        ? "On show today"
        : "On show";

  return { label };
}

export default function OnShowBanner({ propertyTitle, location, onShow }: OnShowBannerProps) {
  const show = describeShow(onShow.isoDate, new Date());
  // Nothing to advertise: a past or undated viewing is worse than none, because
  // a reader can act on it.
  if (!show) return null;

  // Generate Google Calendar Link
  const calendarEventTitle = encodeURIComponent(`Dynasty Estates On Show: ${propertyTitle}`);
  const calendarLocation = encodeURIComponent(location);
  const calendarDetails = encodeURIComponent(
    `Viewing hours: ${onShow.time}\n${onShow.directionsNote || "Follow pointer boards"}\nProperty: ${propertyTitle}`
  );
  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calendarEventTitle}&location=${calendarLocation}&details=${calendarDetails}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

  return (
    <div className="overflow-hidden rounded-card border border-rose-200/90 bg-gradient-to-r from-rose-50 via-rose-50/70 to-amber-50/40 p-4 sm:p-5 shadow-sm backdrop-blur-xl dark:border-rose-500/20 dark:from-rose-950/40 dark:via-rose-950/20 dark:to-amber-950/20 dark:shadow-[0_12px_30px_rgba(0,0,0,0.4)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-full bg-rose-600 px-3 py-0.5 text-xs font-extrabold uppercase tracking-widest text-white shadow-xs flex items-center gap-1.5 dark:shadow-[0_0_12px_rgba(225,29,72,0.4)]">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              <span>{show.label}</span>
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {onShow.date} · {onShow.time}
            </span>
          </div>

          {onShow.directionsNote && (
            <p className="text-xs text-rose-950/80 flex items-start sm:items-center gap-1.5 pt-0.5 dark:text-rose-200/80">
              <LocationPinIcon className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5 sm:mt-0 dark:text-rose-400" />
              <span>
                <strong className="font-semibold text-rose-900 dark:text-rose-300">Showboard Route: </strong>
                {onShow.directionsNote}
              </span>
            </p>
          )}
        </div>

        {/* Links, not buttons, so the print rules do not catch them: a dead
            "Directions" pill on paper is clutter, while the date, time and
            showboard route beside it are what a reader actually needs. */}
        <div className="no-print flex items-center gap-2 shrink-0">
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            // `.pill`, like Directions beside it. Hand-rolled, the primary of
            // this pair rendered 32px at 12px type against the outlined
            // control's 40px at 16px — the quiet one was taller and larger
            // than the loud one.
            className="pill gap-1.5 bg-slate-900 font-bold text-white shadow-sm hover:bg-slate-800 transition-all cursor-pointer dark:bg-rose-600 dark:hover:bg-rose-500 dark:shadow-[0_0_16px_rgba(225,29,72,0.3)]"
          >
            <CalendarIcon className="h-3.5 w-3.5 text-rose-300 dark:text-white" />
            <span>Add to Calendar</span>
          </a>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pill gap-1.5 border border-slate-300 bg-white/90 font-bold text-slate-800 shadow-2xs hover:bg-white transition-all cursor-pointer dark:border-white/10 dark:bg-surface-ink/80 dark:text-slate-200 dark:hover:bg-surface-panel dark:hover:text-white"
          >
            <span>Directions ↗</span>
          </a>
        </div>
      </div>
    </div>
  );
}

