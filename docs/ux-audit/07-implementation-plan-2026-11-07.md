# Implementation plan — UI/UX pitch of 7 November 2026

Turns [06-ui-ux-pitch-2026-11-07.md](06-ui-ux-pitch-2026-11-07.md) into work that can be shipped one piece at a time, and folds in the still-open steps S9–S15 from [04-implementation-plan.md](04-implementation-plan.md) so there is **one** list, not two.

**Out of scope on purpose:** the rotating home headline (it rotates every ~7 s by design and stays).

---

## Already done since the audit — do not redo

The audit ran on a checkout 8 commits behind GitHub. After pulling, these are already fixed by the other agent:

- **Listing title and price hidden behind the photo** — fixed in `71b8e03` (`property-hero-gallery.tsx`, z-index layering).
- **Phone chrome heights, dead space, `100vh` on phones, touch targets on calculator steppers / logo / search buttons** — fixed in `d05188d`.

Step 2.1 below re-checks the related card-price problem, which may share the same cause.

**Currently claimed by the other agent:** map touch targets (`dynasty-property-map.tsx` overlay chips, Leaflet sizing in `globals.css`). Anything touching the map waits for that claim to clear.

---

## How every step runs

Per `COLLABORATION.md`, for **each** step:

1. `git fetch origin` → `git pull --ff-only` on `main`; read `WORKING_ON.md`.
2. Claim the step's files in `WORKING_ON.md`, commit that line, push it.
3. Branch `DESKTOP-1R37EBU/<step-name>`.
4. Make the change.
5. Checks — must actually run and pass:
   - `npx tsc --noEmit` — clean
   - `npx eslint src` — 0 errors (7 pre-existing warnings allowed)
   - Browser at **375 px and 1280 px**: the changed pages render, console clean, and the step's acceptance check passes. Screenshot before/after into `docs/ux-audit/after/<step>/`.
6. Merge latest `main` in, merge to `main`, push, remove the claim, delete the branch — **same day**.

Each step is sized to finish in one sitting so no branch lives overnight. Rollback for any step = revert its merge commit.

---

## Phase 1 — Remove things that aren't real *(highest priority, ~1 day)*

No design decisions needed except where marked ⚠.

### Step 1.1 — Floor Plan tab only when a plan exists
- **File:** `src/components/property-media-tabs.tsx` (fallback at ~line 41, footer at ~110–117); caller `src/app/property/[slug]/page.tsx` (~line 487).
- **Change:** delete the Unsplash fallback image. If `floorPlanImage` is empty, don't render the Floor Plan tab and open on the next tab (3D Tour or Street View & Map). Remove "verified by practitioner" wording. Show "Download floor plan" only when a real file exists.
- **Accept:** a listing with no plan shows no Floor Plan tab and no stock photo; a listing with a plan still shows it.

### Step 1.2 — Remove the dead "Continue with Apple" button
- **File:** `src/app/auth/login/page.tsx` (~line 202–209).
- **Change:** remove the button (it has no handler and an empty icon). Also replace the plain-text "G" with a proper Google icon while there.
- **Accept:** sign-in shows Google + email/phone only; Google sign-in still works.

### Step 1.3 — Home "Metros at a Glance" panel ⚠
- **File:** `src/app/page.tsx` (~line 115–160).
- **Change:** *decision needed* — either (a) remove the panel from the home page, or (b) keep it with a visible "Sample figures" tag like `/insights` has. Recommendation: **(a)**; the link to `/insights` can live in Tools.
- **Accept:** no unlabelled percentages on the home page.

### Step 1.4 — Home "Collaboration & Shortlisting" teaser
- **File:** `src/app/page.tsx` (~line 160–175, hard-coded "2 collaborators / 4 votes cast").
- **Change:** replace the two fake shortlists with a short explanation of what Collections does, plus a "Start a collection" button to `/collections`. No invented counts.
- **Accept:** no hard-coded collaborator or vote numbers anywhere (`grep "votes cast"` returns nothing).

### Step 1.5 — Over-claim wording sweep ⚠
- **Files:** `src/app/property/[slug]/page.tsx` ("Verified South African Features & Resilience" ~455, "Sold by Dynasty Estates" ~240); `src/app/agents/*` and `src/app/page.tsx` footer ("PPRA Verified…"); `src/app/agents/layout.tsx` titles.
- **Change:** "Verified…" → "Features & resilience" unless something actually verifies it. **Decision needed:** are the agent records real, PPRA-checked people? If not, "PPRA Verified" comes off everywhere until a real check exists.
- **Accept:** every "verified" claim on a public page is backed by a real check, or is gone.

---

## Phase 2 — Phone legibility quick wins *(~½ day)*

### Step 2.1 — Prices readable on bright photos
- **Files:** `src/components/property-list-card.tsx`, `property-grid-card.tsx`, `property-card-photos.tsx`, `home-spotlight.tsx`.
- **First:** re-test on current `main` — commit `71b8e03` notes the `/search` grid price had the same z-index cause. Run `document.elementFromPoint` over each card's price at 375 px.
- **Then, if still unreadable:** give the photo a bottom scrim (dark gradient behind the price, sitting above the photo layer), or move the price under the photo on phones.
- **Accept:** price legible on the brightest sample photo (Summerstrand listing) at 375 px; price hit-tests to itself; `tabular-nums` on prices (old S10).

### Step 2.2 — Truncated text on phones
- **Files:** `src/components/home-hero-search.tsx`, `expandable-search-panel.tsx` (placeholder "Search city or subu…"), `home-spotlight.tsx` (address cut off).
- **Change:** shorter placeholder ("Suburb or city"); spotlight shows suburb + city only on phones, not the full street address.
- **Accept:** no ellipsis-truncated placeholder or address at 375 px.
- *Map area chips cut off ("Pre…") belong to the other agent's map claim — leave a note in `WORKING_ON.md` for them instead of editing.*

---

## Phase 3 — One header on every page *(⚠ needs your approval — structural change, ~2–3 days)*

**Today:** `SiteNavigation` is rendered only on the home and for-sale/to-rent pages; **~22 other pages draw their own `<header>`** (search, property, map, calculators, agents, saved, compare, collections, insights, seller, agent, admin, auth…). That is why each section has a different menu.

### Step 3.1 — Make `SiteNavigation` the single desktop header
- **Files:** `src/components/site-navigation.tsx`, `src/app/layout.tsx`.
- **Change:** render `SiteNavigation` once in the root layout for `lg` and up (phones keep `MobileAppBar`). Keep the existing click-only dropdowns. Remove it from the 7 pages that render it themselves.
- **Accept:** home and for-sale/to-rent pages look exactly as now; header appears once (no doubles).

### Step 3.2 — Remove per-page headers, batch A: search, property, map, calculators
- **Files:** `src/app/search/page.tsx` (~412), `src/app/property/[slug]/page.tsx` (~143), `src/app/map-search/page.tsx` (~63), `src/components/calculators-view.tsx` (~281).
- **Change:** delete each page's own header. Page-specific actions move into the page body:
  - **Property:** Back / Print / Share / Save / Collection go into a row beside the listing title (Step 4.4).
  - **Map / Calculators:** "List view" / "Browse properties" become in-page links.
- **Accept:** these 4 routes show the identical header at 1280 px; no action lost (checklist per page).

### Step 3.3 — Batch B: remaining public pages
- agents, agents/[slug], ai-search, saved, compare, collections, insights, legal/privacy, auth/login, auth/signup.

### Step 3.4 — Batch C: signed-in pages
- seller/portal, seller/listings/new, agent/dashboard, admin, inquiries. Test signed in with the matching role from `TEST_ACCOUNTS.md`.

### Step 3.5 — One logo everywhere
- **Files:** wherever a dark "D" square is drawn instead of the real mark — seen on the property header, home footer and login panel.
- **Change:** use `<BrandLogo />` (per project rule).
- **Accept:** the same mark on every page.

**Overall accept for Phase 3:** `grep -rl "<header" src/app` returns no page files; every route shows the same header at 1280 px.

---

## Phase 4 — Listing page: contact first *(= old S11, ~1 day, busiest file — claim it)*

**Files:** `src/app/property/[slug]/page.tsx`, `src/components/true-cost-calculator.tsx`, `property-inquiry-button.tsx`.

### Step 4.1 — Agent card above the calculator (desktop)
- In the right column, the agent card moves to the top and stays sticky. True Cost sits below it as a collapsed card with a one-line summary ("About R 33,022 / month — see breakdown"), expanded by tap.

### Step 4.2 — One main action
- "Book a viewing" becomes the single filled button. WhatsApp, Call and Message become smaller secondary buttons. The phone sticky bar keeps its current layout, which already works.

### Step 4.3 — Price on one line
- `whitespace-nowrap` on the hero asking price, so "R" never wraps away from the number.

### Step 4.4 — Title action row
- Share / Save / Collection / Print sit beside the title (depends on 3.2).
- **Phone:** this replaces the separate icon row under the app bar, giving roughly 60 px back to the photo.

**Accept:** at 1280 px the agent's name and "Book a viewing" are visible without scrolling. At 375 px the page shows only the app bar on top and the sticky bar + tab bar at the bottom, with no extra icon row.

---

## Phase 5 — Search page *(= old S9 + S10, ~2 days)*

**Files:** `src/app/search/page.tsx`, `src/components/expandable-search-panel.tsx`, `property-list-card.tsx`, `property-grid-card.tsx`.

### Step 5.1 — One For Sale / To Rent switch
- Remove the duplicate; keep the one inside the search panel.

### Step 5.2 — Results first on phones
- Below `sm`: sort, view switch and "Reset all" move into the Filters sheet. The Filters button shows a count ("Filters · 2").
- A plain "24 homes for sale" line sits directly above the first card (count on results is allowed by the product rules; only the home page has no counts).
- Find and remove the empty grey bar at the top of the mobile search page.
- **Accept:** at 375 × 812 the first card's photo starts in the top half of the screen.

### Step 5.3 — Helpful empty state
- Name the active filters ("No 3-bed homes under R 2m in Rosebank"). Each filter becomes a removable chip, with one suggested fix ("Remove price limit").
- Unknown URL values (e.g. `?type=sale`) fall back to "All" instead of silently returning zero.

### Step 5.4 — Card polish
- Make the whole card clickable. Rename "View Property Experience →" to "View home". Compare becomes a small icon button.
- On desktop list cards, trim descriptions to 2 lines.
- Keep the agreed phone card layout (photo / price / suburb / specs / agency).

### Step 5.5 — Filter panel cleanup
- Replace the A–Z strip of every suburb with ~6 popular places (typing still finds the rest).
- Rename "Estate Portfolio / Asset class" to "Property type", and "Premier metros & locations" to "Popular areas".

---

## Phase 6 — Home page length *(~½ day)*

- **File:** `src/components/home-trending-listings.tsx`.
- **Change:** show 6–8 featured homes, then a "See all homes for sale" / "See all rentals" button to `/search?intent=…`.
- Rename "Curated Luxury Homes & Estates" to "Homes for sale" ("Homes to rent" for rentals).
- No total-listing counts on the home page (existing product rule).
- **Accept:** home page under ~3,500 px tall at 1280 px (from ~6,500 px).

---

## Phase 7 — Phone bottom tab bar *(⚠ decision, ~½ day)*

- **File:** `src/components/mobile-nav.tsx`. The other agent changed it recently: size the bar from `--dyn-mobile-nav-h`, never a literal number.
- **Change:** in the visitor/buyer tab set, replace **Insights** (a sample-data page) with **Account** *or* **Sell**. **Decision needed: which one?** Insights stays reachable from Tools.
- **Accept:** 5 tabs, all leading to real features; active state still correct.

---

## Phase 8 — Plain language sweep *(~½ day)*

| Today | New | File |
|---|---|---|
| View Property Experience → | View home | `property-list-card.tsx`, `home-trending-listings.tsx` |
| Curated Luxury Homes & Estates | Homes for sale / Homes to rent | `home-trending-listings.tsx` |
| Estate Portfolio · Asset class | Property type | `expandable-search-panel.tsx` |
| Mandate Property Practitioner | Listing agent | `property/[slug]/page.tsx` |
| Message Practitioner | Message agent | `property/[slug]/page.tsx` |
| Geospatial Intelligence | Map search | `map-search/page.tsx` (after the map claim clears) |
| Benchmark Prime | Prime rate | `true-cost-calculator.tsx`, `calculators-view.tsx` |
| Include HOC & Life Assurance | Include home insurance (HOC) & life cover | same |
| "Role-based access" box on sign-in | *(remove)* | `auth/login/page.tsx` |

**Accept:** `grep` for each old string returns nothing in `src/`. Page titles and metadata were updated to match.

---

## Phase 9 — Polish *(when time allows)*

- **9.1 Map loading message:** "Loading map…" in the empty map panel until tiles arrive (`dynasty-property-map.tsx`, after the other agent's claim clears).
- **9.2 Smooth motion:** replace the bounce curve at `theme-toggle.tsx:245` and `animate-bounce` at `virtual-tour-3d-viewer.tsx:377` with a smooth ease-out.
- **9.4 Smoother search panel opening** *(owner request, 7 Nov)*:
  - Make `expandable-search-panel.tsx` open and close as one smooth motion: the height or grid-rows expands with an ease-out curve, and the content fades in slightly after.
  - Respect `prefers-reduced-motion`.
  - Accept: no jump or snap when opening at 375 and 1280 px.
- **9.3 Fewer eyebrow labels:** keep the small spaced-out labels only where they add meaning (e.g. Spotlight); remove the rest on home, search and listing.

---

## Phase 11 — Owner requests, 7 Nov *(~2 days)*

### Step 11.1 — 3D tour: calm it down on phones (~½ day)
- **Seen at 375 px:** about 17 controls sit on top of a ~430 px photo:
  - a large pink title pill and a room-name bubble;
  - the 360° Walk / Dollhouse / Laser Tape tabs;
  - two "Walk to…" bubbles and two info dots;
  - a four-room list covering the lower half;
  - Auto-Pan and the − 100% + zoom.
  The house is barely visible.
- **File:** `src/components/virtual-tour-3d-viewer.tsx`. Its bounce animation is Phase 9.2, so do both together.
- **Change (phones):** the photo comes first, with only:
  - a small room name, top-left;
  - one row under the photo: ‹ previous room · room name · next room ›;
  - a "More" button that opens a bottom sheet with Dollhouse, Laser Tape, Auto-Pan, zoom and the room list.

  Then:
  - Drop the title pill; the page already says which house it is.
  - Remove the hotspot bubbles below `sm`.
  - Desktop keeps today's layout, minus the title pill.
- **Accept:** at 375 px, at least 80% of the tour frame shows the photo, ≤ 4 controls are visible before tapping More, and every feature can still be reached.

### Step 11.2 — Map view: full screen, opens on your town (~1–1½ days)
- **Seen at 375 px:** the map starts 406 px down the page, under five stacked bars:
  - the title;
  - the type chips;
  - the Map / List toggle;
  - a second Map / Street View toggle;
  - the area chips plus Radius / Draw.

  It then fills only about half the screen.
- **Files:**
  - `src/app/map-search/page.tsx`
  - `src/components/property-split-map-view.tsx`
  - `src/components/dynasty-property-map.tsx` — ⚠ currently claimed by the other agent (map touch targets). Wait for that claim to clear, or coordinate in `WORKING_ON.md`.
- **Change:**
  1. **Full-screen map.** On phones and desktop the map fills the screen between the top bar and the tab bar. Type, Radius and Draw float over it as one slim control row. The duplicate Map / Street View toggle goes.
  2. **Opens on the visitor's town.** On first open, ask for the browser's location (the browser's own permission prompt). If allowed, centre on that point at about city zoom. If refused or unavailable, open on all of South Africa, as now. Remember the choice in the viewer's browser so they aren't asked again.
  3. **Select or draw, then see listings.** Results stay hidden until the visitor picks an area (radius, freehand draw, or tapping a cluster or suburb). Then a bottom sheet (phones) or side panel (desktop) slides up listing the homes inside that area, with "Clear area" to start again.
- **Accept:**
  - At 375 × 812 the map covers ≥ 85% of the space between the bars.
  - Allowing location centres on the visitor's town.
  - Refusing it opens on all of South Africa with no error.
  - Drawing an area shows only the homes inside it, with a count.
- **Caveat:** listings have no real coordinates yet; pins are placed at synthetic suburb centres (`geo-data.ts`). "Inside the area" means inside by those approximate points until real coordinates exist.

---

## Phase 10 — Remaining work from the earlier plan, plus areas not yet audited

| Step | What | Status |
|---|---|---|
| S12 | Seller portal truth (no test listings, counters match the list) | **done** 8 Nov (code). Stored test listings remain in the database (see report) |
| S13 | Seller landing page | **blocked** on decision: portal or brokerage |
| S14 | Agent dashboard empty states (no "LIVE DATA" on a zero) | **done** 8 Nov |
| S15 | Mobile performance (home LCP ≤ 4 s, search TBT ≤ 1,200 ms) | **blocked**: needs a production build or the deployed site; dev-server timings are not meaningful |
| — | Audit signed-in pages (seller, agent, admin) with test accounts | **done** 8 Nov |
| — | Dark mode pass across all changed pages | **done** 8 Nov (axe + contrast probe, 19 pages: 0 violations left) |
| — | Keyboard-only and screen-reader pass | **partly done** 8 Nov: axe rules (labels, headings, names) clean; live Tab-through not possible in this environment |

---

## Decisions needed from you

1. **Home metros panel:** remove it, or keep it labelled "Sample"? *(Step 1.3; recommend remove)*
2. **"PPRA Verified":** are the agents real and PPRA-checked? If not, the claim comes off. *(Step 1.5)*
3. **Approve Phase 3:** one shared header, removing ~22 per-page headers. This is a structural change.
4. **Phone tab bar:** replace Insights with **Account** or **Sell**? *(Phase 7)*
5. Still open from the earlier plan: **portal or brokerage** (blocks S13).

---

## Suggested order

1. **Phase 1** — honesty fixes (today; no approval needed except 1.3 / 1.5 wording)
2. **Phase 2** — phone legibility
3. **Phase 3** — one header *(after approval)*
4. **Phase 4** — listing page
5. **Phase 5** — search page
6. **Phase 6, Phase 8** — home length and plain language (can run alongside each other; different files)
7. **Phase 7** — tab bar *(after decision)*
8. **Phase 11** — 3D tour on phones; full-screen map that opens on your town *(map waits for the other agent's map claim)*
9. **Phase 9** — polish
10. **Phase 10** — signed-in audit, S12/S14, then S15 performance last

Total: roughly **9–11 working days** for Phases 1–9. Phase 10 depends on what the signed-in audit finds.
