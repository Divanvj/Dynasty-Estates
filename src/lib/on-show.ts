/**
 * Show-day helpers, shared by the listing page's viewing section and the grid
 * card badge. Not a client module, so server components can use it too.
 */

export type OnShow = {
  /** Display text, e.g. "Sunday, 16 Nov". */
  date: string;
  /** `YYYY-MM-DD`. Without it a show is never advertised: "Sunday" alone can't be checked against today. */
  isoDate?: string;
  time: string;
  directionsNote?: string;
};

/**
 * Whether a show is still worth advertising, and the honest label for it.
 *
 * The past cut-off is yesterday rather than today on purpose: this renders on
 * the server (UTC on Vercel) and in the browser (SAST, +2), so a same-day
 * comparison can disagree between the two and change whether the section
 * exists, which React reports as a hydration mismatch.
 */
export function describeShow(onShow: OnShow | undefined | null, now: Date = new Date()) {
  if (!onShow?.isoDate) return null;
  const when = new Date(`${onShow.isoDate}T12:00:00`);
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
  return { label, when };
}

/** "Sunday, 16 Nov" for an ISO date. */
export function showDateLabel(isoDate: string): string {
  const when = new Date(`${isoDate}T12:00:00`);
  // Built by hand: en-ZA's own format pads the day ("08 Nov") and its order
  // varies between runtimes, which would differ between server and browser.
  const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][when.getDay()];
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][when.getMonth()];
  return `${weekday}, ${when.getDate()} ${month}`;
}

/**
 * The coming Sunday, for MOCK listings only, so the demo catalogue shows a
 * viewing section that is actually upcoming instead of a yearless "Sunday,
 * 14 Sep" that went stale. Real listings get their date from the agent
 * (listing wizard, step 5).
 */
export function nextSundayShow(now: Date = new Date()): Pick<OnShow, "date" | "isoDate"> {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const add = (7 - d.getDay()) % 7 || 7; // always a future Sunday
  d.setDate(d.getDate() + add);
  const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { isoDate, date: showDateLabel(isoDate) };
}
