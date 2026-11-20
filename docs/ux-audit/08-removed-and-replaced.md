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
| Audit trail "Every moderation decision"; only moderation entries | "Every moderation and agent-verification decision"; practitioner verify / turn-down entries in plain language (2026-11-12, Phase F) | `admin/audit/page.tsx` |
| *(no way to become an agent except a script)* | **Added:** Apply for agent access (`/join/agent`, linked from /sell), agent Profile tab with the FFC card, admin Agents tab that verifies (grants the agent role) or turns down with a reason | `join/agent`, `agent/profile`, `admin/agents`, `api/admin/practitioners` |
| "Needs you today": enquiries and sent-back listings only | Also: file / correct your certificate, record a missing mandate; FFC expiry warning 60 days ahead above the tiles | `agent/dashboard/page.tsx` |
| Listing Overview: facts only | Mandate panel (sole / open, disclosure signed on) for agents | `components/listing-detail.tsx` |
| Account menu promise "My Agency / Console" with no agency anywhere; "+ Register Agency" removed earlier because nothing existed | **Added:** Agency tab in the agent console → `/agency` (register an agency, overview + agent leaderboard), `/agency/team` (invite by e-mail, remove), `/agency/enquiries` (hand an enquiry to an agent) (2026-11-12, Phase G) | `app/agency/*` |
| Agent inbox: only enquiries on the agent's own listings | Also enquiries the principal handed to them ("Assigned to you by your agency"); ones handed to someone else leave it | `components/enquiry-inbox.tsx`, `lib/seller-inquiries.ts` |
| Agent profile: certificate only | Agency section: accept / decline invitations, leave the agency; open invitations also in "Needs you today" | `components/agency-membership.tsx` |

## Blaze switch-on (12 Nov, docs/blaze/SETUP-PLAN.md)

| Was | Now | Where |
| --- | --- | --- |
| Console Site switches: one "Features" panel (Map search, AI search) | Panels per group: Pages; **Listing photo checks** (AI-generated, duplicates, screenshots, blur, resolution); Sign-in (phone) — each with an "n off" count | `console/flags/page.tsx`, `lib/platform-config.ts` |
| Photo checks always on | The console can turn each one off; the wizard skips it (file type and 10 MB stay enforced by storage.rules) | `lib/photo-intake.ts`, `components/listing-photo-uploader.tsx` |
| Login always offered Email / Phone | The Phone tab hides when the console turns phone sign-in off | `auth/login/page.tsx` |
| Console texts "until Blaze" (overview, Firebase "Spark plan limits", integrity, tools, go-live) | Blaze is on; what is still missing is the scheduler, an owner decision. Go-live gains "Storage rules match main" | `console/*`, `lib/server/platform-checks.ts` |
| storage.rules allowed overwriting a checked photo (Storage counts it as a create) | Create requires `resource == null` | `storage.rules` |

## Nightly jobs (12 Nov)

| Was | Now | Where |
| --- | --- | --- |
| Go-live "Scheduled jobs and alerts", always blocked | "Nightly jobs ran": green after a run in the last 26 hours, red if never or stale (says to add CRON_SECRET) | `lib/server/platform-checks.ts` |
| Health check and integrity scan only on demand | Also every night at 02:00 SAST (Vercel Cron), plus listing_stats older than 13 months deleted; entries in the event log as "Nightly job (Vercel Cron)", failures as warnings | `vercel.json`, `api/cron/nightly/route.ts`, `lib/server/health.ts`, `lib/server/console-data.ts` |

## Calmer dark mode + premium dashboards (13 Nov, docs/dashboards/REDESIGN-PLAN.md)

| Was | Now | Where |
| --- | --- | --- |
| Dark mode: teal-tinted surfaces (#081012, panels #0c1a1c) and bright emerald buttons, links and chips | Near-neutral charcoal (#0b0e0f, panels #121617); the emerald scale re-pointed at a muted sea-glass ramp with the same lightness steps; champagne #cfb27a. Light mode and the developer console unchanged | `app/globals.css` (`html.dark`) |
| Console tab rows: filled pill per tab | Underline tabs (teal line under the current page) | `components/dashboard-ui.tsx` `SectionNav` |
| Frosted-glass panels and tiles on /agent, /agency, /admin | Solid cards (white / charcoal, hairline, soft shadow) | `dashboard-ui.tsx` `panelClass`, `rowClass`, `StatTile` |
| Agent dashboard: heading, five number tiles, "Needs you today" | Petrol statement card (greeting, waiting buyers, top listing with its photo), speed-to-lead ring (1 h target), four KPIs with 30-day trend and change, Needs you today, buyer pipeline funnel with stuck flags, daily views chart, FFC compliance ring, listings table with photo, health and views trend | `agent/dashboard/page.tsx`, `components/charts/*`, `lib/dashboard-math.ts` |
| Agency overview: four tiles + agents table | Statement card, agency speed-to-lead ring, KPIs with change, leaderboard with top-three podium (3+ agents) and inline bars, reply time per agent against 1 h, enquiries per day | `agency/page.tsx`, `components/agency-team.tsx` (60 days of stats) |
| Admin overview: five tiles + "Needs action" list; tile "Enquiries last 7 days" | Marketplace statement card, queues-within-24 h ring, KPIs (new listings, enquiries with change, verified agents, open package requests), queues with age bars, supply mix (sale/rent, top cities), enquiries per day, honest Revenue placeholder until payments | `admin/page.tsx`, `lib/admin-overview.ts` (`getLiveListings`, `getEnquiryTimesSince`) |

## Petrol inner pages (16 Nov, REDESIGN-PLAN.md R5)

Replaced, nothing removed. Every figure still comes from stored data.

- **Filter chips**: navy/emerald pills → deep-teal selected chip with a count badge; one scrolling row on phones (was up to five wrapped rows).
- **Primary button**: slate-900 → the Petrol hero colour in light; dark unchanged (sea-glass). Secondary buttons, empty boxes, search boxes and tables now use the `--dash-*` tokens.
- **New figures strip** (`SummaryStrip`) under the heading of Enquiries, Listings, Price snapshot, Team, Agency enquiries, Moderation, Agents and Support. Overdue figures turn rose and say why (1 h reply target; 24 h for admin queues, `QUEUE_TARGET_MS`).
- **Enquiry rows** (agent, agency, seller portal, listing detail): buyer initials, buyer name first, kind as a chip, message in its own box, "Waiting" chip that turns rose after 1 h. The emerald left border on new rows → a thin teal rail plus tint.
- **Listings table**: cover photo, status chip, a views bar per row.
- **Price snapshot**: four tiles → figures strip plus a new price-spread chart (`charts/price-strip.tsx`: one dot per listing, middle half shaded, median in champagne).
- **Profile**: certificate ring with days left beside the details; badge colours → shared chip tones (also on /admin/agents).
- **Team**: agent list → one card per agent with initials and four figures (active listings, enquiries 30 d, waiting, median reply).
- **Moderation**: queue rows with photo thumbnails and age chips; selected row gets a teal rail; no-photo box → a short Petrol panel; quality as a bar.
- **Support / Agents**: same row pattern as the inbox; package requests as a champagne chip. **Audit trail**: list → timeline. **Packages**: solid cards.
- Not touched: the developer console. Still open: `lib/moderation.ts` keeps made-up sample listings used only when Firebase is not configured (older code).

## Listing edit (18 Nov)

Added, nothing removed. The seller portal's "Manage" button (removed earlier because no edit screen existed) now has a real replacement.

- **New `/seller/listings/[id]/edit`**: the six-step listing wizard opened on an existing listing, pre-filled (photos, floor plan, show day, tour, suburb). Save from any step. One editor for sellers and agents; `?from=` sends Save and Back to the page that opened it.
- **What saving does**: a private seller's edit of a filed or live listing goes back to moderation (Submitted; a live listing is hidden until approved again, and the editor says so before saving). Agents and admins keep the listing's status. Drafts keep Save as Draft / Submit. Sold, Rented and Archived listings can't be edited.
- **Edit links**: "Edit listing" on the listing page (agent and seller), "Edit" on seller-portal rows and in the agent listings table.
- **Wizard moved** from `app/seller/listings/new/page.tsx` to `components/listing-wizard.tsx` (the new-listing page now only wraps it). Photos added during an edit get duplicate-check fingerprints; existing ones keep theirs. Edits are not autosaved in the browser, so they can't overwrite an unfinished new-listing draft.
- **Fixed on the way**: an untouched province picker showed Gauteng but saved an empty province (the location read "Pretoria, "). On phones the six step tabs squashed their labels into each other; they now show numbers only below 640 px (names kept for screen readers).
- **Not done**: photos removed in an edit stay in storage (and their fingerprints stay, so the same photo can't be re-used on another listing); the health checklist doesn't jump to a wizard step.

## E-mail sending (18 Nov)

Added, nothing removed.

- **New-enquiry e-mail** to the agent or seller who listed the home (buyer's name, phone, e-mail and message; Reply goes to the buyer; button to their enquiries). Sent once per enquiry, after it is saved; a failed e-mail never fails the enquiry.
- **Agency invitation e-mail** to the invited agent (how to accept; how to register as an agent first).
- **Nightly job alert** to MAIL_ALERTS_TO when a nightly job fails.
- **Developer console → E-mail** (`/console/email`): set-up (provider, sender, alerts address; never the key), test send to yourself or the alerts address, last 50 attempts with sent / skipped / failed and why. Three new switches under Site switches → E-mails. Go-live list: "E-mail sending".
- **Fixed on the way**: a viewing booked from the show-day banner on a listing didn't carry the listing's owner, so the agent never saw it in their inbox (and would have had no e-mail).
- **Not done**: weekly seller report, FFC expiry reminders, saved-search alerts (saved searches don't exist yet); an owner can't yet turn off their own enquiry e-mails; no per-sender limit beyond one e-mail per enquiry.

## Phone header (18 Nov)

- Removed: the Account/profile button in the phone top bar (MobileAppBar). Replaced by the bottom tab bar's Account tab, which now shows the signed-in initial.
- Changed: the phone logo is centred and larger (44px mark, was 36px) and shows the wordmark at every width. Desktop unchanged.

## Alerts, weekly reports and tidy-ups (18–19 Nov)

- **Removed**: the greyed-out "Alerts & Notifications – Soon" entry in the site menu. **Replaced by** a working "Alerts & E-mails" link to the new `/alerts` page (also in the account menu). Its line no longer promises price-drop alerts, which aren't built.
- **Removed**: the note on a listing's Overview tab saying "There is no edit screen yet … contact Dynasty through Support". The Edit listing button replaced it in the listing-edit work; the note was stale.
- **Added – saved searches**: "Save this search" beside the result count on `/search` once a filter is set (signed out: "Sign in to save this search"). Up to 10 per account; saving the same search twice keeps one.
- **Added – `/alerts`** (Alerts & e-mails): the saved searches, each with an alerts switch and Delete (named confirmation); and three e-mail switches — new enquiries on my listings, weekly listing report, saved-search alerts.
- **Added – saved-search alert e-mails**: each night, homes published since the search was last checked; one e-mail per person, five homes per search, "See N more".
- **Added – weekly listing report e-mail**: Mondays, to each agent and private seller with live listings — views, saves, contact clicks and enquiries per listing for the past seven days.
- **Added – "Stop these e-mails"** at the foot of enquiry, weekly-report and alert e-mails, opening `/email/unsubscribe` (asks before turning anything off), plus one-click List-Unsubscribe headers for mail apps. Agency invitations and nightly alerts have none (account and operations e-mails).
- **Added – listing checklist links**: each unfinished item on a listing's Performance tab links to the editor at the field that fixes it (`?fix=photos|size|description|floorplan|tour|showday`).
- **Added – photo clean-up**: photos and a floor plan removed in an edit are deleted from storage when it is saved; each night, listing files no listing uses and older than 30 days are deleted, and photo fingerprints for removed photos are dropped (so the duplicate check stops refusing a photo that was taken off).
- **Console**: two new switches under Site switches → E-mails (weekly reports, saved-search alerts); `/console/email` gains "Send me my weekly report" and "Run my saved-search alerts" (own account only).
- **Not done**: price-drop alerts; FFC expiry reminders; signing in from `/alerts` doesn't return there afterwards (the login page always goes home); a per-search "stop" link (the e-mail link turns off all saved-search alerts; each search has its own switch on `/alerts`).

## Sold prices recorded on Dynasty (19 Nov)

- **Changed**: the public listing's "Sold by Dynasty Estates" badge now says **Sold** (a private seller's home isn't sold by Dynasty), and the concluded box says "Sold on <date> for R …" — or "· price not disclosed" — instead of "This mandate has been successfully sold".
- **Changed**: `/agent/market` no longer says sold prices aren't included; its description and source line now cover recorded sales.
- **Added – Mark as sold / Mark as rented** on a live listing's page in the agent and seller portals: price, date the offer was accepted (or lease signed), and "The seller agreed to show the price on the listing" (off by default). Once recorded: the price, % of asking, days on the market, **Correct the details** and **Not sold after all** (named confirmation; the listing goes back live).
- **Added – Recorded sales** on `/agent/market` (same filters): median sold price, sold vs asking, days to sell, per m², and the sales whose price may be shown. Figures need 3 or more sales.
- **Added – Recent sales in <city>** in the printable seller report.
- **Not done**: Deeds Office / Lightstone data (paid feed, not bought); "Under offer" still can't be set from the portals; a home's earlier sale isn't shown when it is listed again (each listing is its own record); sold prices on the public area pages (`/for-sale/...`, `/insights`).

## Built-in sample listings removed (19 Nov, S1-1 / S1-2)

- **Removed – the 20 built-in sample homes** (`fallbackProperties` in `property-data.ts`). They were mixed into every catalogue, filled the home page when Firestore was empty or failed, and were the only homes `/compare` and Collections could show. The catalogue is now stored listings only; old sample URLs (e.g. `/property/rosebank-vantage`) return 404.
- **Replaced – sample photo on photo-less listings** with a neutral "No photos yet" image (`/listing-no-photo.png`). It used to borrow the first sample home's photo.
- **Changed – `/compare`** reads the real catalogue. With `?ids=` it opens those homes; without, it starts empty ("No homes to compare yet" + Browse listings) instead of three sample homes.
- **Removed – `/saved` seeding**: a new visitor no longer sees two sample homes they never saved.
- **Changed – Collections** look homes up in the real catalogue (real listings in a collection now show).
- **Changed – AI Search ranking and "homes like this"** take the catalogue they are given; there is no sample default.
- **Removed – the category pill and the "Example listing" pill** on the listing page's photo (owner, 19 Nov). The category is in the specs; example homes keep the sidebar notice and have no tag on their card photo.
- **Kept**: the data-integrity scan still reports old enquiries that point at sample homes (`RETIRED_SAMPLE_LISTING_IDS`).
- **Not done (S1-3)**: `/saved` still falls back to a localStorage list for signed-out visitors; Collections still use a `demo-user-1` owner when signed out and the invite button only shows "Invite dispatched" without sending anything.

## Saved homes and Collections: stand-ins removed (19 Nov, S1-3)

- **Removed – browser-only saved list.** The heart kept a localStorage list for signed-out visitors and as a silent fallback when a save failed. Saves now go to the account only; a signed-out visitor who taps the heart goes to sign in. A save that fails says "Couldn't save. Try again." instead of looking saved.
- **Changed – `/saved` signed out** shows "Sign in to see your saved homes" instead of reading the browser list. Homes left in a browser by the old list move into the account the first time that person opens `/saved` signed in.
- **Removed – the made-up "Our Pretoria East Shortlist"** (comments from "Sarah" and "David"), shown to any account with no collections and whenever Firebase was off. An account with none sees "No collections yet" + Create a collection.
- **Removed – `demo-user-1`**: signed-out visitors see "Sign in to see your collections" instead of a demo owner's collections.
- **Removed – "+ Invite Partner"**, its "Invite dispatched" message and "Direct invite link copied". Nothing was sent or shared, and the rules only let the owner read a collection. Replaced by "Only you can see this collection." The "Collaborative" labels became "Your shortlists" / "Shortlist".
- **Fixed – adding a home to a stored collection replaced the homes already in it**, and **posting a comment replaced the earlier comments** (both wrote a one-item array). Both now append.
- **Not done**: sharing a collection with someone else (needs rules for members, an invite and accept flow, and e-mail). Kept on the plan under Later.

## Firestore rules tightened by the new rule tests (19 Nov, S1-4)

- **Added – `npm run test:rules`**: 129 checks of `firestore.rules` against the local emulator (every collection; signed out, buyer, seller, agent, principal, member, admin, and a made-up role). Runs in CI.
- **Removed – agents' access to tenancy applications.** Any agent could read every application on the platform (ID numbers, income). Now only the applicant and admins; no agent screen used it.
- **Changed – a listing's own (non-practitioner) owner can no longer set `example`, `sale` or `agentId`**, on create or edit. The listing editor never sent them; the sale is recorded by the server.
- **Changed – a new enquiry must be `new`, unassigned and without a first reply.** The app already sent exactly that.
- **Not done (D7)**: any agent can still edit or delete any other agent's listing.

## E-mail verification (20 Nov, S1-6)

- **Added – "Confirm your e-mail address" e-mail** on sign-up (Dynasty template, sent through the site's mail provider, logged on /console/email as "Confirm e-mail address").
- **Added – banner** under the header for signed-in e-mail-and-password accounts that haven't confirmed: "Confirm your e-mail address: we sent a link to …" + **Send the link again** (one a minute, five a day). It disappears once the account is confirmed (re-checked when the tab regains focus). Not shown on /auth, /console, for Google accounts or developer accounts.
- **Added – /auth/verified**, where Firebase's confirmation page returns people.
- **Added – one reminder e-mail** from the nightly job to accounts 3–30 days old that still haven't confirmed.
- **Not done**: nothing is blocked for unconfirmed accounts (they can still enquire); the old `isVerified` field on users/{uid} is still written as false and not updated.

## Back to your page after signing in (20 Nov, S1-7)

- **Changed – sign-in links** (save heart, Saved, Collections, alerts, saved search, enquiries, agents, role-guarded pages, the account menu, package requests) now return to the page you were on, via `?next=`. Sign-in, sign-up, Google and phone sign-in all honour it; only paths on this site are followed.
- **Changed – the enquiry form for signed-out visitors** shows "Sign in to send this request" with a link back to the listing, instead of a Send button that always failed with "check your connection" (it submitted as `guest-…`, which the rules refuse). The made-up `anonymous@buyer.co.za` fallback is gone.
- **Not done**: guest enquiries without an account (decision D8); /console sign-in links are unchanged.

## Phone review: controls next to what they change (20 Nov, U8)

- **Moved – /search view switch and sort** from the search card to one line directly above the results: switch left, sort right ("Newest", "Lowest price", "Highest price", "Most bedrooms"; "Sort by" label from `sm`). The result count is screen-reader-only on phones (it showed as "7 hom…"), visible from `sm`.
- **Removed – "Reset All"** in the search card; the removable filter chips and "Clear all" under the results line do the same.
- **Moved – area pages** (/for-sale, /to-rent, province and city): the listings come straight after the title; the province/city directory and the related links come after the listings.
- **Renamed – "Related Nodes" / "Related Hubs"** to "Also see".
- **Removed – "← Back to Map" and "Exit Street View & Return to Map"** on the listing page; the Street View / Map switch does that.
- **Changed – /compare** "← Back to Collections" (right) is now "Back" (left), returning to the previous page (search if opened directly).
- **Changed – card photo dots** bottom-right instead of centred, clear of the price.
- **Changed – /map-search**: fade on the right edge of the chip rows; the layer buttons say "Solar" and "Water" on phones too, and stay clear of the zoom buttons.
- **Changed – True Cost calculator**: the offer price never wraps; "Custom Offer" wraps under its label.

## Under offer, and back on the market (20 Nov, S1-8)

- **Added - "Mark as under offer" / "Back on the market"** on a listing's page in both portals (agent and seller), next to Mark as sold. Each move asks first and says what buyers will see.
- **Added - the status now shows publicly**, which it never did: an "Under offer" pill on the listing hero (beside where Sold and Rented already sit), a badge on the list and grid card, and `LimitedAvailability` instead of `InStock` in the listing's structured data. The listing stays in search and still takes enquiries.
- **Changed - who makes the move**: `PUT /api/listings/[id]/status` (Admin SDK) rather than a client write. `firestore.rules` is unchanged on purpose - letting an owner write "Under offer" would also let them push an unmoderated Draft into a publicly readable status. The route allows Published <-> Under offer only; a draft, paused or sold listing is refused (409), a repeat is a no-op, and each real move files an `audit_logs` entry.
- **Not done**: no e-mail to the people who enquired when a home goes under offer; "Under offer" is not a search filter; the sticky price bar at the foot of the listing page doesn't repeat the label.
