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

- 2026-11-07 — header dropdown fix merged: **layer contract** — page content
  ≤ z-50, `SiteHeader` z-[60], dialogs z-[80]+ rendered via `createPortal` to
  body (backdrop-blur ancestors trap `position: fixed`). Phase 6+8 merged too:
  home feed shows 6 + See all; wording sweep (see the merge commit).
- 2026-11-07 — `DESKTOP-1R37EBU/ux-phase5-search` merged. /search: count line +
  removable filter chips above results; `ExpandableSearchPanel` has a new
  `hideIntentToggle` prop; `/compare?ids=a,b` now opens with those homes
  (also touched `compare/page.tsx`, not in the original claim).
- 2026-11-07 — `DESKTOP-1R37EBU/ux-phase4-listing-contact-first` merged. Listing
  sidebar: agent card first, then True Cost (now collapsed behind "Adjust the
  figures" at every width). "Book a viewing" is the only filled CTA.
- 2026-11-07 — `DESKTOP-1R37EBU/ux-phase3-one-header` merged. **Pages no longer draw
  their own header.** `SiteHeader` (root layout, lg+) is the site header;
  `MobileAppBar` below lg. A page keeps only a title/action row (a `<div>`) —
  do not add `BrandLogo` / `AccountActions` / `SiteNavigation` to a page.
- 2026-11-07 — `DESKTOP-1R37EBU/ux-phase2-phone-legibility` merged. List-card
  photo layers are now: frames z-10, scrim z-[11], badges/price z-[12],
  card link z-15, arrows z-20, Save z-30 (`property-list-card.tsx`).
- 2026-11-07 — `DESKTOP-1R37EBU/ux-phase1-honesty` merged (UX Phase 1, see
  `docs/ux-audit/07-implementation-plan-2026-11-07.md`). Floor Plan tab only
  shows when a listing has `floorPlanImage`; agents attach one in the wizard
  (step 5) → `floorPlanUrl` on the listing, `floor-plans/` rule added to
  `storage.rules` (not deployed). Home metros panel and fake shortlists removed.
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
