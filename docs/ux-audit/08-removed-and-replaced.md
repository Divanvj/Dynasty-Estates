# Removed and replaced — running log

Everything taken out of the site or swapped for something else while carrying out [07-implementation-plan-2026-11-07.md](07-implementation-plan-2026-11-07.md). It's kept up to date as each phase merges, and is the list to review when the plan is complete.

Each row: **what was there → what replaced it (or "removed")**, and where. "Added" items are listed only when they replace something.

---

## Phase 1 — things that weren't real (merged 7 Nov)

| Was | Now | Where |
|---|---|---|
| Floor Plan tab falling back to a stock Unsplash photo of another house's exterior when a listing had no plan | Tab hidden when there's no plan; the panel opens on the 3D tour instead | `property-media-tabs.tsx` |
| "Dimensions and layouts are indicative architectural representations verified by practitioner." | "Supplied by the listing agent. Confirm dimensions before you make an offer." | same |
| "Download PDF Blueprint ↗" (opened the stock photo) | "Open floor plan ↗" (opens the agent's real file); only shown when one exists | same |
| "Architectural Under-Roof Layout · …" caption | "Floor plan · …" | same |
| *(no way for agents to add a floor plan)* | **Added:** optional floor-plan upload (JPG/PNG/WebP/PDF, under 10 MB) at step 5 of the listing wizard, saved as `floorPlanUrl`; new `floor-plans/` rule in `storage.rules` (not deployed) | `listing-floor-plan-field.tsx`, `photo-intake.ts`, `seller-listings.ts`, `property-data.ts` |
| "Continue with Apple" button (did nothing) | Removed | `auth/login/page.tsx` |
| Home "South African Metros at a Glance" panel: Pretoria East +7.8%, Sandton +6.4%, Atlantic Seaboard +9.2%, Umhlanga +8.1% (typed into the page) | Removed (sample figures still on `/insights`, labelled as sample) | `app/page.tsx` |
| Home "Collaboration & Shortlisting" panel with two invented shortlists ("Our Pretoria East Shortlist · 2 collaborators · 4 votes cast", "Cape Town Oceanfront Search · 3 collaborators · 6 votes cast") and "Open Collections →" | One "Collections" panel explaining the feature, with "Start a collection →" | `app/page.tsx` |
| Footer hand-drawn "D" square + "Dynasty Estates" text | Real `<BrandLogo />` | `app/page.tsx` |
| "Verified South African Features & Resilience" heading | "South African Features & Resilience" | `property/[slug]/page.tsx` |
| PPRA "Verified Practitioner" badge shown on every agent profile | Shown only when the agent record has an FFC number (all current mock agents do, so it still shows) | `agents/[slug]/page.tsx` |

## Phase 2 — phone readability (merged 7 Nov)

| Was | Now | Where |
|---|---|---|
| Dark fade behind card prices drawn *under* the photo (prices unreadable on bright photos) | Fade drawn above the photo, price above the fade | `property-list-card.tsx` |
| Placeholder "Search city or suburb..." | "Suburb or city" | `home-hero-search.tsx`, `expandable-search-panel.tsx` |
| Placeholder "Search city, suburb, or province..." | "Suburb, city or province" | `expandable-search-panel.tsx` |
| Placeholder "Search by suburb, city, province or property ID..." | "Suburb or city" (searching by listing ID still works; it just isn't advertised in the hint) | `search/page.tsx` |
| Home spotlight on phones: full street address ("KEURBOOM ROAD, CLA…") | City only, without an alias in brackets ("GQEBERHA" not "GQEBERHA (PORT ELIZABETH)"); desktop still shows the full address | `home-spotlight.tsx` |
| Spotlight badge "Recently viewed by you" on phones (ran under the 01 / 02 counter) | "Recently viewed" on phones; "by you" from tablet width up | same |

## Phase 3 — one header (merged 7 Nov)

| Was | Now | Where |
|---|---|---|
| A separate header drawn by each page — 22 different ones | One shared header (logo · Buy · Rent · Sell your home · Tools · AI Search · Profile) on desktop; phones keep their top bar | new `site-header.tsx`, `layout.tsx` |
| Search page header: Home · Collections · Compare · Saved Homes | Removed (Saved/Collections in the Profile menu, Compare under Tools) | `search/page.tsx` |
| Agent dashboard bar: Home · Search · Dashboard | Removed | `agent/dashboard/page.tsx` |
| Seller portal bar: Home · Search · Seller portal | Removed | `seller/portal/page.tsx` |
| Home, For Sale and To Rent pages (×7): their own copy of the header | Removed (the shared header replaces it) | `page.tsx`, `for-sale/**`, `to-rent/**` |
| Logo and Profile button inside each remaining page's title bar | Removed from those bars (both are in the shared header); page titles, breadcrumbs, back links and page buttons stay | 15 pages incl. map, calculators, agents, compare, saved, insights, admin |
| Listing page: hand-drawn "D" tile + "Dynasty Estates" | Removed; the row keeps Back · Print · Share · Save · Collection | `property/[slug]/page.tsx` |
| Sign-in and sign-up: hand-drawn "D" tile + "Dynasty / Estates" | Real `<BrandLogo />` | `auth/login`, `auth/signup` |

## Phase 4 — listing page (merged 7 Nov)

| Was | Now | Where |
|---|---|---|
| Sidebar order: cost calculator → (rentals: move-in costs) → agent card | Agent card → cost calculator → move-in costs | `property/[slug]/page.tsx` |
| Calculator sliders open on desktop | Collapsed behind "Adjust the figures" at every width (was phones only) | `true-cost-calculator.tsx` |
| "Mandate Property Practitioner" | "Listing agent" | `property/[slug]/page.tsx` |
| "Schedule Private Viewing" | "Book a viewing" (still the only filled button) | same |
| "Message Practitioner" | "Message" | same |
| WhatsApp as a bright-green filled button beside Call | WhatsApp, Call and Message as one row of equal outlined buttons (WhatsApp icon keeps its green) | same |

## Phase 5 — search page (merged 7 Nov)

| Was | Now | Where |
|---|---|---|
| Second For Sale / To Rent switch inside the search box on `/search` | Removed (the one in the catalogue heading stays) | `search/page.tsx`, `expandable-search-panel.tsx` |
| "x matches" badge (only when filtered) | "10 homes for sale" line above results, always, plus removable filter chips and "Clear all" | `search/page.tsx` |
| "Reset All" link always visible | Only shown when something is filtered (hidden on phones; chips do the job there) | same |
| Empty state "No properties matched your criteria" + generic advice + "Reset All Filters" | "No homes for sale match 4+ beds · Under R 3m · …", "Remove '<last filter>'", "Clear all filters"; with no filters, "Show homes to rent / for sale" | same |
| A link with an unknown type (e.g. `?type=sale`) silently showing 0 homes | Unknown type ignored | same |
| "View Property Experience →" / "View Rental Experience →" / "View Home Experience →" | "View home →" | `property-list-card.tsx`, `search/page.tsx` |
| "Add to Compare →" (opened Compare without adding the home) | "Compare" → opens Compare with that home (`/compare?ids=…`) | `property-list-card.tsx`, `search/page.tsx`, `compare/page.tsx` |
| Filter panel "Premier Metros & Locations · Click to add to search" with the first 20 cities A–Z (Alberton, Amanzimtoti, Ballito…) | "Popular areas · Tap to add": Johannesburg, Cape Town, Pretoria, Durban, Sandton, Stellenbosch | `expandable-search-panel.tsx` |
| "Estate Portfolio" + "Asset Class" | "Property category" | same |

## Fix — header dropdowns and trapped pop-ups (merged 7 Nov)

| Was | Now | Where |
|---|---|---|
| Header at the same layer as page rows (dropdowns covered on the listing page and others) | Header above all page content | `site-header.tsx` |
| Five pop-ups trapped inside their card (e.g. "Book a viewing" was 469 × 284 px) | Rendered at page level, full screen, covering the header | `property-inquiry-button.tsx`, `account-actions.tsx`, `agents/page.tsx`, `collections/page.tsx` |

## Phase 6 + 8 — home length, plain wording (merged 7 Nov)

| Was | Now | Where |
|---|---|---|
| Home listing feed showing the whole catalogue | First 6 homes + "See all homes for sale / to rent →" (Map and Table views still show all) | `home-trending-listings.tsx` |
| "Curated Luxury Homes & Estates" / "Curated Rental Properties" | "Homes for sale" / "Homes to rent" | same |
| Eyebrow "Properties For Sale" / "Trending Rentals" | "Featured" | same |
| Sign-in "Role-based access" explanation box | Removed | `auth/login/page.tsx` |
| Map page "Geospatial Intelligence" + "Dynasty Live Map & Street View" | "Map search" + "Homes on the map" | `map-search/page.tsx` |
| "Benchmark Prime = 11.75%" | "Prime rate: 11.75%" | `true-cost-calculator.tsx`, `calculators-view.tsx` |
| "Include HOC & Life Assurance" | "Include home insurance (HOC) & life cover" | `true-cost-calculator.tsx` |
| "Interactive 3D Walkthrough Experience" | "3D walkthrough" | `property-media-tabs.tsx` |
| "Google Maps & 360° Street View Inspection" | "Street View and map" | same |
| "Spatial Navigation Active:" | "Tip:" | same |

## Phase 7 — phone tab bar (merged 7 Nov)

| Was | Now | Where |
|---|---|---|
| "Insights" tab (Buyer, Seller, Agent, Admin) | "Account" tab that opens the account menu (Insights still in Tools and in that menu) | `mobile-nav.tsx`, `account-actions.tsx` |
| Account menu slightly see-through on phones (blur didn't work inside the top bar; text behind showed through) | Solid background | `account-actions.tsx` |

## Phase 9 — polish (merged 7 Nov)

| Was | Now | Where |
|---|---|---|
| Page shifting sideways behind the search panel, pop-ups and the phone menu (the scrollbar vanished when scrolling locked) | Scrollbar space always reserved, so nothing moves | `globals.css` |
| Search panel: zoom origin sliding across the screen while it opened (a hidden 0.2 s transition on every property) | Removed; only the intended animations run | `expandable-search-panel.tsx` |
| Search panel opening in 0.2 s, everything at once | Card grows from the search bar over 0.26 s; the filters fade up 70 ms later; closing stays 0.2 s | same |
| Theme switch knob overshooting and springing back | Smooth ease-out, no overshoot | `theme-toggle.tsx` |
| 3D tour hotspot buttons bouncing up and down constantly | Still (the small pulsing dot on each stays) | `virtual-tour-3d-viewer.tsx` |
| Map panel blank for several seconds while tiles load | "Loading map…" until the first tiles arrive; "The map couldn’t load. Check your connection." if none do | `dynasty-property-map.tsx` |
| "Catalogue •" label above "South African Homes For Sale" | Removed | `search/page.tsx` |
| "Featured •" label above "Homes for sale" on the home feed | Removed | `home-trending-listings.tsx` |
| "Move-In Capital Transparency" label above "Estimated Move-In Schedule" (rentals) | Removed | `property/[slug]/page.tsx` |

## Phase 11.1 — 3D tour on phones (merged 7 Nov)

| Was | Now | Where |
|---|---|---|
| Pink title pill "<HOUSE NAME> · 3D TOUR" (and "3D Interactive Live Tour") on the tour | Removed at every width (the page already names the house) | `virtual-tour-3d-viewer.tsx` |
| Phones: room badge, 360° Walk / Dollhouse / Laser Tape tabs, two "Walk to…" bubbles, info dots, instruction banner, four-room list, Auto-Pan and zoom all over the photo (~17 controls) | One bottom row (‹ previous · room name · next › · ⋯) + full-screen button; everything else in a "Tour options" panel behind ⋯ ("Laser Tape" is called "Measure" there). Walk-to bubbles, info dots and the instruction banner are not shown on phones | same |
| Desktop tour | Unchanged apart from the title pill | same |
| Info card label "✓ Verified Specification" | "Specification" | same |
| Media panel padding on phones 24px | 12px (more room for the photo) | `property-media-tabs.tsx` |

## Phase 11.2 — full-screen map (merged 7 Nov)

| Was | Now | Where |
|---|---|---|
| Map page: title bar ("Map search / Homes on the map" + List View + AI Search), a separate Type toolbar with a "x matches" badge, a Map / List switch, and a second Map / Street View toggle above the map | One slim bar: property type · Near me · List view (title kept for screen readers only); the map fills the rest of the screen | `map-search/page.tsx` |
| AI Search button on the map page | Removed from this page (still in the site header and phone tab bar) | same |
| Street View inside the map page | Removed from this page (still on every listing's Street View & Map tab) | same |
| A listing column beside the map (desktop) / a List tab (phones) showing every home all the time | Listings appear only after drawing a radius or shape ("N homes in this area" + Clear area) or tapping a pin ("Selected home"); beside the map on desktop, under it on phones | same |
| Map always opening on all of South Africa | Asks for the visitor's location once; opens on their town (zoom 12) if allowed and inside South Africa, otherwise all of South Africa with a note. "Near me" asks again | same, `dynasty-property-map.tsx` (`focus`, `clearSignal` props) |
| Map re-zooming to the whole country whenever the type filter changed | Stays where the visitor is looking once it has a focus | `dynasty-property-map.tsx` |

Unchanged: the map views inside `/search` (Map view) and the home feed still use the older side-by-side layout.

## Owner fixes after Phase 11 — home feed toolbar, listing photo (merged 7 Nov)

| Was | Now | Where |
|---|---|---|
| Phones: home feed List / Map as two 44px squares on their own row, type chips wrapping onto two more rows | One 46px row: a compact round List / Map switch and a single swipeable row of type chips (desktop unchanged) | `home-trending-listings.tsx` |
| Phones: listing title, address and the To Rent / On Show badges printed over the photo, plus a dark fade, two arrows and a big "🔍 02 / 02" counter | Only a small "02 / 02" counter on the photo; title, address and badges sit below it in dark text; no arrows (swipe or thumbnails). Desktop keeps the overlay | `property-hero-gallery.tsx`, `property/[slug]/page.tsx` |
| Full screen only via the counter button | Tap or click anywhere on the photo opens it full screen (a swipe does not) | `property-hero-gallery.tsx` |
| "Full-screen" photo viewer confined to the photo card (349 × 530 at 375px) | Truly full screen (rendered at page level) | `property-gallery-lightbox.tsx` |
| Phone height of the listing photo 380px | 320px (the caption moved below it) | `property-hero-gallery.tsx` |
| Bottom bar "MONTHLY RENTAL / R 13,500 / mo…" (cut off) | "RENT PER MONTH / R 13,500"; "ASKING PRICE" became "Asking price" (shown in capitals) | `property/[slug]/page.tsx` |
