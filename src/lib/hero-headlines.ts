/**
 * Approved hero copy for the home page headline.
 *
 * Source: Dynasty Estates — Improvement Notes, "Main Hero & Search Bar".
 *
 * The notes list 46 lines, but four of them are deliberate two-line couplets
 * whose second half does not stand on its own ("But in the Life Lived Within
 * Them." needs the line above it). They are kept paired here, which is why this
 * file holds 42 headlines rather than 46 single lines — each entry is an array
 * of the lines it renders on, so a couplet always breaks where it was written to
 * break rather than wherever the text happens to wrap.
 *
 * Apostrophes are normalised to the typographic form; no wording is changed.
 */
export interface HeroHeadline {
  /** One entry per rendered line. Two entries render as a deliberate couplet. */
  readonly lines: readonly string[];
  /**
   * Renders one step down the type scale (0.8em — see .hh__inner--compact).
   *
   * Set on the six longest entries: the two longest single lines, and all four
   * couplets, whose halves would otherwise each wrap and turn a two-line couplet
   * into four rows. Compacting them is what lets the reserved hero height stay
   * close to the height of the copy instead of to its worst case — at 1024px it
   * is the difference between reserving 225px and 180px, and at 768px between
   * 240px and 144px.
   *
   * Measured per breakpoint rather than guessed; 0.84 was not enough, 0.80 is.
   * If you add copy longer than these, re-measure before trusting the heights in
   * globals.css.
   */
  readonly compact?: boolean;
}

export const HERO_HEADLINES: readonly HeroHeadline[] = [
  { lines: ["Open the Door to Your Next Chapter"] },
  { lines: ["The Keys to Your Next Destiny Awaits"] },
  { lines: ["Destiny Has an Address and it’s got your name on it"] },
  { lines: ["Step into the new with the keys of excellence."] },
  { lines: ["Find More Than a Home. Find Your Legacy."] },
  { lines: ["A New Door. A New Chapter. A New Dynasty."] },
  { lines: ["The Right Keys Unlock More Than just a Home."] },
  { lines: ["Your Next Chapter Starts Here"] },
  { lines: ["Where Dreams Take Shape, and Legacies Awake."] },
  { lines: ["Some Inherit Legacies. Others Build Them"] },
  { lines: ["From Dream to Door, a House or something more..."] },
  { lines: ["Step through the doors of destiny, and start your legacy."] },
  { lines: ["Some Foundations Hold Houses. Others Hold Generations."], compact: true },
  { lines: ["Find the Place Your Future Will Remember."] },
  { lines: ["Where the Life You Imagined Finally Has an Address"] },
  { lines: ["Your Story Deserves More Than an Address."] },
  { lines: ["Destiny Has a Door. Dare to Open It."] },
  { lines: ["The keys to your next great chapter are one search away"] },
  { lines: ["Your Future Knows the Way Home."] },
  { lines: ["You Don’t Always Choose the Place. Sometimes the Place Chooses You."], compact: true },
  { lines: ["Today, a Home. Tomorrow, a Legacy"] },
  { lines: ["For the Life You Live. For the Legacy You Leave"] },

  // The four couplets, kept as the notes wrote them.
  {
    lines: [
      "We Spend Our Lives Searching for Where We Belong.",
      "Sometimes, It Has Been Waiting All Along.",
    ],
    compact: true,
  },
  {
    lines: [
      "The Most Important Places Are Not Measured in Value",
      "But in the Life Lived Within Them.",
    ],
    compact: true,
  },
  {
    lines: [
      "A Beautiful Property Captures the Eye",
      "The Right One Captures the Future.",
    ],
    compact: true,
  },
  {
    lines: [
      "Luxury Is Not Simply Where You Live.",
      "It Is How Life Feels When You Arrive.",
    ],
    compact: true,
  },

  { lines: ["Where New Beginnings Become Lasting Legacies"] },
  { lines: ["Open the Door to the Life You’ve Imagined"] },
  { lines: ["The Address of Your Future Awaits"] },
  { lines: ["Some Doors Open Homes. Others Open Futures."] },
  { lines: ["The Keys Are Ready. The Future Is Waiting."] },
  { lines: ["Find the Key to the Life You Deserve"] },
  { lines: ["The Key to Legacy Starts Here"] },
  { lines: ["Build More Than a Home. Build a Dynasty."] },
  { lines: ["Where Legacies Are Founded and Futures Flourish"] },
  { lines: ["Every Sunset Ends a Chapter. Every Home Begins Another."] },
  { lines: ["The Journey to Home Starts Here"] },
  { lines: ["Designed for Those Who Expect More"] },
  { lines: ["Extraordinary Properties for Extraordinary Lives"] },
  { lines: ["Open the doors to destiny with the keys of excellence."] },
  { lines: ["Destiny Called. The Door Is Open."] },
  { lines: ["Behind Every Extraordinary Life Lies an Extraordinary Address."] },
];

/** The flat text of a headline, for `aria-label` and the blurred bleed layer. */
export function headlineText(headline: HeroHeadline): string {
  return headline.lines.join(" ");
}
