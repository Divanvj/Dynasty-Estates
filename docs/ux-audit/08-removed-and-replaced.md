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

## Owner fixes — floor plans, listing badges, show day (merged 7 Nov)

| Was | Now | Where |
|---|---|---|
| Mock "floor plan" on 5 listings: the same stock photo of a house exterior | Removed from the data; the Floor Plan tab is hidden until an agent uploads a real plan | `property-data.ts` |
| "FOR SALE" / "TO RENT" pill on the listing photo / caption | Removed (the visitor chose sale or rent to get there) | `property/[slug]/page.tsx` |
| "ON SHOW SUNDAY" pill (no date, no time, stayed up after the show) | Removed; replaced by a show-day section under the photo: "On show this weekend · Sunday, 8 Nov · 14:00 – 17:00", how to get there, Add to calendar, Directions, "Can’t make it? Book a private viewing". Only shown while the show is ahead | `on-show-banner.tsx`, new `lib/on-show.ts` |
| The old rose on-show banner ("Showboard Route:", pulsing pill) — never visible because no listing had a full date | The section above | same |
| Mock show dates "Sunday, 14 Sep" (no year, long past) | Mock listings use the coming Sunday | `property-data.ts` |
| *(no way for agents to set a show day)* | **Added:** optional Show day in the listing wizard, step 5 (date, from, until, how to get there) | new `listing-show-day-field.tsx`, `seller-listings.ts`, `property-data.ts` |
| Listing card badge "On Show Sunday" shown regardless of date | "On show Sun 8 Nov", only while upcoming | `property-grid-card.tsx` |
| Bottom bar "RENT PER MONTH" (ran under the WhatsApp button) | "PER MONTH" | `property/[slug]/page.tsx` |

## Owner fixes — 3D tour, phone thumbnails, tab icon (merged 8 Nov)

| Was | Now | Where |
|---|---|---|
| "3D Tour" tab on every listing, built from the ordinary photos: panned stills, invented room hotspots ("Walk to Kitchen"), a "Dollhouse" view, a "Laser Tape" with made-up measurements, and a "Tip: click and drag to pan 360°" line | **Removed** (the whole 782-line viewer). The tour tab now appears only when the agent supplied a real link: "3D tour" (Matterport, embedded), "Video tour" (YouTube or Vimeo, embedded) or "Virtual tour" (any other https site, as an "Open tour ↗" link) | deleted `virtual-tour-3d-viewer.tsx`; `property-media-tabs.tsx`, new `lib/virtual-tour.ts` |
| Mock tour link `my.matterport.com/show/?m=sample-matterport-tour` on 3 listings (not a real tour) | Removed from the data | `property-data.ts` |
| *(no way for agents to add a tour)* | **Added:** optional "Virtual tour link" in the listing wizard, step 5, with a hint that says how it will show | new `listing-tour-field.tsx`, `seller-listings.ts`, `property-data.ts` |
| Listing with no plan and no tour opened the media panel on the fake tour | Opens on Street View & Map | `property-media-tabs.tsx` |
| Phones: thumbnail rail under the listing photo (half under the bottom bar; repeats swipe, counter and tap-to-enlarge) | Hidden on phones; still shown from tablet width up | `property-hero-gallery.tsx` |
| "🗺️ Street View & Map" tab, "👁️ Street View 360°" and "🗺️ Google Map" buttons | Line map icon + "Street View & Map"; buttons "Street View" and "Map" | `property-media-tabs.tsx` |
| Media tabs wrapping one per line on phones | One row (scrolls sideways if ever too wide) | `property-media-tabs.tsx` |

## Dashboards Phases C + E — seller report and price snapshot (branch, 11 Nov; not merged)

| Was | Now | Where |
|---|---|---|
| Nothing an agent could hand a seller | **Seller report**: A4 print page per listing — agent/agency and contact at the top; this week vs the week before (views, saves, contact clicks, enquiries, viewing requests); 30-day views; price against the area; an optional note typed for the print (not stored); one small Dynasty mark + "Report prepared with Dynasty Estates" in the footer. "Seller report" button on each listing page | new `components/seller-report.tsx`, `agent/listings/[id]/report`, `seller/listings/[id]/report`, `globals.css` (`.report-mark`) |
| No market figures for a listing appointment | **Price snapshot** `/agent/market` (new "Price snapshot" tab): sale/rent, home type, suburb or city → median, middle half (8+), range, median per m² and the listings themselves; live Dynasty listings only, nothing from fewer than 5; printable | new `agent/market/page.tsx`, `lib/listing-insights.ts` |
| Agent console tab row printed on paper | Marked `no-print` | `components/dashboard-ui.tsx` |

## Dashboards Phase B — view tracking and listing performance (branch, 11 Nov; not merged)

| Was | Now | Where |
|---|---|---|
| No record of views, saves or contact clicks anywhere | Anonymous daily counts per listing in `listing_stats` (views once per browser session, the owner's own visits excluded; saves; WhatsApp / Call clicks), written only by the server at `/api/track`; owner and admins read them. Rules + 2 indexes need deploying | new `api/track`, `lib/listing-stats*.ts`, `lib/server/listing-stats.ts`, `firestore.rules`, `firestore.indexes.json` |
| Listings had no page of their own in the consoles | `/agent/listings/{id}` and `/seller/listings/{id}`: Overview · Performance (30-day views, saves, contact clicks and enquiries with daily table, enquiries per 100 views, price vs ≥5 live comparables in suburb/city, listing checklist) · Enquiries | new `components/listing-detail.tsx`, `sparkline.tsx` |
| Agent listings: "View" link; no views | Title opens the listing page; "Public page" link; **Views, 30 d** column | `agent/listings/page.tsx` |
| Agent dashboard: 4 tiles | 5 tiles: **Views (7 days)** added | `agent/dashboard/page.tsx` |
| Seller portal: three cards; "View" link per listing | Fourth card **Views, 30 days**; per listing "Performance" and "Public page", views in 30 days | `seller/portal/page.tsx` |

## Dashboards Phase A — one page per job (11 Nov, docs/dashboards/PLAN.md)

| Was | Now | Where |
|---|---|---|
| /admin: one page with five tab *buttons* (Moderation Queue, Fraud Signals, Commercial Packages, Audit Trail, Support); a refresh or link always landed on Moderation | Five routes with a tab row: **Overview** `/admin`, **Moderation** `/admin/moderation`, **Support** `/admin/support`, **Audit trail** `/admin/audit`, **Packages** `/admin/packages` | `admin/layout.tsx`, new `admin/admin-shell.tsx`, new route folders |
| /admin header "Governance & Trust · ADMIN · Platform Command Console" and an "Agent View" pill | **Removed**; page heading per route. The agent console stays reachable from the account menu | `admin/page.tsx` |
| /admin had no overview | **Overview**: Live listings · Waiting for review (+ oldest) · Enquiries, 7 days · Support requests (new) · Package requests (open), and a "Needs action" list linking to each item | `admin/page.tsx`, new `lib/admin-overview.ts` |
| Moderation: stacked cards with an optional feedback box and Approve / Request Changes / Reject that fired at once (Reject archived the listing with no confirmation); newest first; 20 items | Split pane: compact list (oldest first, 50 items, search, All / Fraud signals filter, arrow keys) and the selected listing (cover photo, details, fraud signals, note). "Send back for changes" and "Reject…" need a note; **Reject asks "Reject '{title}'?" first** (Cancel focused) | `admin/moderation/page.tsx`, `lib/moderation.ts` |
| "Fraud Signals" tab (a second list of the same items) | **Removed**; signals show on the item and as a filter | same |
| Support: read-only list | Inbox with New / In progress / Closed filters and status buttons (Mark in progress, Close, Reopen); package requests tagged | `admin/support/page.tsx`, `lib/support-requests.ts` |
| Audit trail: table of raw codes (`moderation.approved`, `properties/abc`), last 25 | Feed in plain words ("… approved and published listing abc"), newest first, **Load more** | `admin/audit/page.tsx` |
| Agent dashboard: four counters plus an editable enquiry inbox and the listing rows on one page | Read-only **Dashboard** (New enquiries · Oldest unanswered · Viewing requests, 7 days · Active listings + "Needs you today"), **Enquiries** `/agent/enquiries` (All / New / Contacted), **Listings** `/agent/listings` (search, status filter, enquiries per listing, moderator's note on sent-back listings). Tab row on all three | `agent/*`, new `agent/agent-shell.tsx` |
| Agent phone tab bar: Console · Mandate · Browse · **Directory** · Account | Console · Mandate · Browse · **Enquiries** · Account (the agent directory is still in the header) | `mobile-nav.tsx` |
| New enquiries looked like contacted ones apart from the chip | Bold title and a green leading bar (agent and seller portal) | `enquiry-inbox.tsx` |

## Agent dashboard fixes (10 Nov)

| Was | Now | Where |
|---|---|---|
| Agent dashboard "Recent enquiries": any 20 enquiries on the platform (other agents' and private sellers' buyers), unordered, undated; rules let every agent read and edit every enquiry | Only enquiries on the agent's own listings, newest first; rules: admin, sender or listing owner (deployed) | `agent/dashboard`, `firestore.rules`, `lib/agent-inquiries.ts` (deleted) |
| "Property views" figure and "0 views" per listing (nothing records views) | **Removed** until view tracking exists (plan Phase B) | `agent/dashboard`, `seller/portal` |

## Seller enquiries (10 Nov)

| Was | Now | Where |
|---|---|---|
| A buyer's enquiry on a private listing was stored without the listing's owner, and only agents, admins and the sender could read it, so private sellers never saw one | Enquiries carry the listing's `ownerId` (rules check it against the listing). The seller portal has an **Enquiries** section: name, email, phone, message, date, and "Mark as contacted" / "Mark as new" (the owner may change the status only). Enquiries filed before this have no owner and stay hidden from sellers | `firestore.rules`, `lib/inquiries.ts`, new `lib/seller-inquiries.ts`, `seller/portal/page.tsx` |
| The enquiry form asked for a name and phone number and threw both away | Saved as `contactName` and `contactPhone` | `property-inquiry-button.tsx` |
| "Notes or Questions for Practitioner", "Send Message to Practitioner" (wrong on a private listing) | "Notes or questions", "Send message"; on a listing with an owner, "Your name, phone number and email go to the person who listed this home." and the sent notice says they can now see it | same |

## S13 — sell page and prices, phase 1 (merged 10 Nov)

| Was | Now | Where |
|---|---|---|
| Three hardcoded packages on /admin: Standard R1,450 / 30 days, Showcase R2,950 / 45 days, Prestige Spotlight R5,800 / 60 days, listing "Featured Obsidian Glass glow badge", "AI MatchScore recommendation boost", "Homepage flagship banner rotation", "Real-time lead SMS and instant WhatsApp alert", "Dedicated social media showcase" (none of which exist) | **Removed.** Published price list in `lib/pricing.ts`: sale 30 / 90 / 180 days R399 / R799 / R1,399, +30 days R299; rental 14 / 30 / 90 days R149 / R249 / R449, +14 days R129 (incl. VAT); agent plans Starter free (3) · Solo R399 (10) · Team R799 (25) · Agency R1,499 (60) · Branch R2,999 (150) · Enterprise quoted (excl. VAT). /admin shows the same list | `lib/billing.ts` (deleted), `lib/pricing.ts`, `admin/page.tsx` |
| `MockSouthAfricanPaymentGateway` ("PayFast / Ozow"), which reported every payment as successful; unused | **Removed.** No payment code until a provider is chosen; buttons say payment is by emailed invoice | `lib/billing.ts` (deleted) |
| No seller landing page; no published prices anywhere | `/sell` (how it works, example listing, the sale packages, agent link) and `/pricing` (Selling / Renting / Agents tabs, "Not available yet" list, FAQ) | new routes |
| Header Sell menu: "Sell Privately" → /seller/portal (sign-in wall) and "Sell as an Agency" → /agent/dashboard (role-guarded), "Agent console, team mandates & listing distribution" | "Sell Privately" → /sell; "Plans for agents" → /pricing?for=agents; new "Prices" → /pricing | `site-navigation.tsx` |
| Sell menu blurb "List directly to buyers with zero agent commissions." | "Advertise it yourself for a once-off fee, with no commission." | same |
| Home footer had no sell or price links | "Sell Your Home Privately" and "Prices for Sellers & Agents" added (seller portal link kept) | `app/page.tsx` |

## Phase 10 — dark mode, accessibility, signed-in pages (merged 8 Nov)

| Was | Now | Where |
|---|---|---|
| Dark mode: every filled green button / active chip in emerald-600 (#009966), white text at 3.65:1 | emerald-700 (5.36:1); hovers emerald-800; gradients 700→800. 214 class swaps in 41 files; tinted greens (`/10`, `/20`…) unchanged | site-wide |
| Dark mode: seller portal top panel kept its light gradient, white title on light grey (2.4:1) | Dark panel like the rest | `seller/portal/page.tsx` |
| Dark mode: "Quick Filters:" and the login/sign-up "or" divider in slate-500 (3.8:1) | slate-400 | `search/page.tsx`, `auth/login`, `auth/signup` |
| Dark mode: map credit links in Leaflet blue (3.7:1) | Light blue | `globals.css` |
| Slider handles had no visible keyboard focus | Focus ring on the handle | `globals.css` |
| Calculator inputs "Body Corporate Levy", "Municipal Rates & Taxes", "Interest Rate" not tied to their labels (screen readers read "edit, number") | Labelled | `calculators-view.tsx` |
| /compare and /agents jumped from h1 to h3 | h2 | `compare/page.tsx`, `agents/page.tsx` |
| Login side panel: "Recommended for you · R 8.9M · Morningside · 4 bed · 3 bath · 4.8 match" (a made-up home) | **Removed**; one line: "Your saved homes, collections and enquiries in one place." | `auth/login/page.tsx` |
| Seller portal: slogan "Sell smarter, faster, and with more confidence." under a "Seller portal" eyebrow | Heading "Seller portal" + "Listings owned by …" | `seller/portal/page.tsx` |
| Seller portal: "Publish listing" | "List a home" | same |
| Seller portal: "Manage" button (opened the new-listing form) | **Removed** (no edit screen exists) | same |
| Seller portal: "Next steps" checklist (Upload media, Refine pricing, Set visibility, Review leads), never clickable or ticked | **Removed** | same |
| Seller portal: counters showed 0 while loading; a failed load stayed at 0 silently; empty list showed nothing | "–" while loading, an error message on failure, and an empty state with "List a home" | same |
| Seller portal / agent dashboard: listing rows could not be opened | "View" link on public listings | `seller/portal`, `agent/dashboard` |
| Agent dashboard: "Live data" badge on all four numbers (also on zeros) | **Removed** | `agent/dashboard/page.tsx` |
| Agent dashboard: no page heading | "Agent dashboard" | same |
| Agent dashboard: "New leads", "Tour bookings", "Listings overview" (+ "Portfolio" eyebrow), "Hot leads" (+ "Pipeline" eyebrow) | "New enquiries", "Viewing requests", "Your listings", "Recent enquiries" | same |
| Agent dashboard: "Last contact" label over the enquiry's status ("new") | "Status" ("New") | same |
| Agent dashboard: "View all leads →" (went to /inquiries, the enquiries *you sent*, so always empty for an agent) | **Removed** | same |
| Agent dashboard: zeros while loading; raw Firebase error text on failure | "–" / "Loading…"; plain-language error | same |
| /inquiries: link bar (Saved Homes, Browse Catalogue) | **Removed** (both in the header and tab bar) | `inquiries/page.tsx` |
| /inquiries: "Buyer Communication Hub" pill, "My Appointments & Requests", "…property brochures, and practitioner correspondences" | "My enquiries", "Viewings you've asked for and messages you've sent to agents." | same |
| /inquiries tabs "All Requests / Viewing Appointments / Practitioner Messages" | "All / Viewings / Messages" (now announce which is selected) | same |
| Admin: an empty moderation queue or audit trail was filled with demo entries ("mod-1", "Perceptual hash match 98%") that could be "approved" | Real empty list: "Nothing is waiting for review." / "No actions recorded yet." / "No submitted listing has a fraud signal."; "Loading the queue…" while loading | `lib/moderation.ts`, `admin/page.tsx` |

| Four shared test logins (demo.buyer/seller/agent/admin@dynastyestates-demo.com) | **Disabled** (2026-11-10; data kept). Testing uses developer accounts that switch role: "Developer" pill on every page, "Use the site as" in the /console sidebar | Firebase Auth, `TEST_ACCOUNTS.md` |
| `scripts/seed-firebase-roles.mjs` (created the four, passwords in plain text) and `npm run firebase:seed-roles` | **Removed**; `scripts/create-dev-account.mjs` makes a developer account with a random password | `scripts/` |
| Offline demo sign-in (`src/lib/demo-accounts.ts`, the four passwords in the client bundle) | **Removed**; without Firebase config, sign-in says it is not configured | `lib/auth.ts` |
| Go-live check "No passwords in the public repo" | "Old test accounts disabled" | `lib/server/platform-checks.ts` |
| Console Users page: "Test accounts" health panel | Panel only appears if an old test account can sign in again; "testing as …" tag on developer accounts | `console/users/page.tsx` |
| Enquiry, support and audit times as "2026-11-10 10:30 UTC" | South African time, "10 Nov 2026, 12:30" (2026-11-12) | `lib/formatters.ts` `formatDateTime` |
| Agent dashboard tile "Viewing requests (last 7 days)" | "Reply time": median first reply over 30 days (viewings are now a stage, filterable in Enquiries) (2026-11-12, Phase D) | `agent/dashboard/page.tsx` |
| Agent inbox "Mark as contacted / Mark as new" button and New / Contacted chips | A labelled Stage control per enquiry (New, Contacted, Viewing booked, Offer made, Won, Lost) and a chip per stage; private sellers keep the button | `components/enquiry-inbox.tsx`, `agent/enquiries/page.tsx` |
