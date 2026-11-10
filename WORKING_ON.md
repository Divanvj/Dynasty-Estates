# Working on

Claim an area here **before** writing code, and push the claim straight away so
the other agent sees it. Remove your line when the work is merged into `main`.
See `COLLABORATION.md`.

One line per piece of work. Keep it short; this file changes often, and short
lines keep its own merges trivial.

| Machine | Branch | Area / files | Since |
| ------- | ------ | ------------ | ----- |

## Recently merged

Leave a line here when you merge something the other agent should know about
before they start, then delete it after a few days.

- 2026-11-10 — **alet-elize re-synced** to `main` 7c25b9e after four days away. Correction to
  the 2026-11-07 note below: the map touch work was **not** finished — it was sitting
  uncommitted here. It is now saved on `alet-elize/map-touch-targets` (pushed, WIP, unmerged,
  unmeasured; rebased onto Phase 10/11). Not claimed: it waits for the owner's decision, so
  leave map sizing alone until it is either claimed or deleted. `ux/audit-overhaul` and the
  `dyn-ux` worktree are gone (fully merged). alet-elize has no developer account or Admin key
  yet, so `/console` role switching does not work on this machine.

- 2026-11-10 — `DESKTOP-1R37EBU/pricing-sell` merged (S13). **Dynasty is a portal** (owner). New `/sell` and
  `/pricing`; one price list in `src/lib/pricing.ts` (`node scripts/check-pricing.mjs` checks its rules).
  `src/lib/billing.ts` and its mock payment gateway are gone. Package/plan requests go to
  `support_requests` (admin Support tab) and are invoiced by hand: there is no payment, expiry or
  plan limit in code yet. Private sellers cannot read enquiries on their own listings (rules).

- 2026-11-10 — **`docs/handover/` removed again** at the owner's request, once DESKTOP-1R37EBU
  had copied the brief locally. The brief is not kept in the repo; it is still in git history
  (commit 9b138dd) if the other machine needs it.

- 2026-11-10 — `alet-elize/market-intel-brief` merged. **`docs/handover/` is new**: the
  Market Intelligence & Monetisation brief (18 Oct 2026) as a self-contained HTML page,
  plus `BRIEF_HANDOVER.md` explaining how to read it. Docs only — nothing in `src/`.
  It is a **planning document, not a spec**: every figure is tagged Research / Model /
  Team estimate / Proposal / Added analysis, the incumbent revenue and payer figures are
  low-confidence models rather than disclosures, and the product surface it describes
  (pricing tiers, Intelligence Console, Ask Dynasty, Performance Wallet, feed ingestion)
  does not exist yet. Do not treat any of it as built or as agreed pricing.

- 2026-11-10 — `DESKTOP-1R37EBU/dev-role-switch` merged. **Test with a developer account, not
  the four demo.* logins** (now disabled; seed script and `lib/demo-accounts.ts` removed). A
  developer switches role via the "Developer" pill (every page) or "Use the site as" (console
  sidebar); it sets the real `role` claim plus `developer: true` (`lib/server/claims.ts`).
  Other machine: make your own with `scripts/create-dev-account.mjs` (needs the Admin key).
  CI now runs Node 24 (firebase-admin needs 22+; typecheck was red on main since the console merge).

- 2026-11-10 — `DESKTOP-1R37EBU/dev-console` merged. **Developer console at `/console`** and a
  new `developer` role (claim; persona "Developer", lands on /console). Root layout now
  mounts `TelemetryReporter`, `MaintenanceBanner` and wraps `SiteHeader` in `SiteChrome`;
  MobileNav/MobileAppBar return null on /console. `/map-search` and `/ai-search` have a
  `FeatureGate` layout. Server code uses `src/lib/server/firebase-admin.ts` (needs
  `FIREBASE_SERVICE_ACCOUNT_PATH` in .env.local). firebase-admin is now a dependency.

- 2026-11-08 — `DESKTOP-1R37EBU/ux-phase10-a11y-dark` merged. Dark-mode fills are
  emerald-700 (hover 800), not 600: white on 600 fails contrast. Use `dark:bg-emerald-700`
  for new filled buttons. `lib/moderation.ts` no longer returns demo items for an empty
  queue or audit trail.

- 2026-11-08 — `DESKTOP-1R37EBU/fix-fake-actions` merged. /agents contact now writes
  `inquiries` (propertyId `agent:<id>`; /inquiries does not link those), Support &
  Guidance writes `support_requests` (new rule, not deployed; admin Support tab).
  Sample enquiries/listings removed from /inquiries, agent dashboard, seller portal.

- 2026-11-08 — `DESKTOP-1R37EBU/ux-3d-tour-honesty` merged. `virtual-tour-3d-viewer.tsx`
  is deleted; the listing tour tab shows only a real agent link parsed by
  `lib/virtual-tour.ts` (`parseTourUrl`). Wizard step 5 has a tour link field
  (`virtualTourUrl`). `PropertyMediaTabs` no longer takes `gallery`.

- 2026-11-07 — UX Phase 11 merged: 3D tour phone layout (`virtual-tour-3d-viewer.tsx`),
  full-screen `/map-search`; `DynastyPropertyMap` gained `focus` and
  `clearSignal` props and resizes itself with a ResizeObserver.
- 2026-11-07 — `DESKTOP-1R37EBU/ux-phase9-polish` merged. `html` now has
  `scrollbar-gutter: stable`; the search panel card uses `transition-none`
  (`duration-*` alone animates every property).
- 2026-11-07 — the `alet-elize/map-touch-targets` claim was removed from the table:
  the owner confirmed no other agent is working. (It was believed finished; it was not —
  see the 2026-11-10 alet-elize re-sync note above.)
- 2026-11-07 — `DESKTOP-1R37EBU/ux-phase7-account-tab` merged. Phone tab bar: "Account"
  (opens the account menu via `OPEN_ACCOUNT_MENU_EVENT`) replaces "Insights" in
  every role.
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
