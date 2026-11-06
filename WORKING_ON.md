# Working on

Claim an area here **before** writing code, and push the claim straight away so
the other agent sees it. Remove your line when the work is merged into `main`.
See `COLLABORATION.md`.

One line per piece of work. Keep it short; this file changes often, and short
lines keep its own merges trivial.

| Machine | Branch | Area / files | Since |
| ------- | ------ | ------------ | ----- |
| alet-elize | `alet-elize/map-touch-targets` | Map touch targets: `dynasty-property-map.tsx` overlay chips, and the Leaflet control/cluster sizing in `globals.css` | 2026-11-06 |

## Recently merged

Leave a line here when you merge something the other agent should know about
before they start, then delete it after a few days.

- 2026-11-06 — `ux/audit-overhaul` (UX audit S1–S8) merged into `main`. Pull
  before editing the property page, media tabs or gallery lightbox.
- 2026-11-06 — `alet-elize/mobile-polish` merged. **`--dyn-mobile-nav-h` is now
  63px and the tab bar is SIZED from it** (`mobile-nav.tsx`), with the body's
  bottom padding in `layout.tsx` derived from the same variable — it was 59 /
  63 / 68 in three places. Anything you pin above the tab bar should offset by
  that variable, not a literal. Also: `animate-fade-in` was never a real class
  and is gone (use `animate-in fade-in duration-200`), and `tap-44` now covers
  the calculator steppers, brand logo and the search panel's two icon buttons.
- 2026-11-06 — `alet-elize/verify-mobile-phase5` merged. The mobile phase-5
  work is now verified by measurement, and it exposed a long-standing bug:
  `property-hero-gallery.tsx` painted the hero's title, badges, scrim and both
  arrows *behind* the photograph, because the active frame carries `z-10` and
  they were `z-auto`. Fixed there. **If any other component layers chrome over
  a photo frame that has a z-index, check it the same way** — the `/search`
  grid cards had the identical bug earlier.
