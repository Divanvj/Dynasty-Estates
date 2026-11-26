# Working on

Claim an area here **before** writing code, and push the claim straight away so
the other agent sees it. Remove your line when the work is merged into `main`.
See `COLLABORATION.md`.

One line per piece of work. Keep it short; this file changes often, and short
lines keep its own merges trivial.

| Machine | Branch | Area / files | Since |
| ------- | ------ | ------------ | ----- |
| DESKTOP-1R37EBU | `DESKTOP-1R37EBU/hero-phone-smooth` | `home-hero-scene.tsx`, `public/hero/frames/p/` — smoother scroll move on phones | 2026-11-26 |
| ALET-ELIZE | `ALET-ELIZE/dark-hero-text` | `globals.css` hero headline block (`.hh-*`) — dark-mode hero text | 2026-11-20 |

## Recently merged

Leave a line here when you merge something the other agent should know about
before they start, then delete it after a few days.

- 2026-11-26 — `DESKTOP-1R37EBU/hero-glide` merged (owner). Hero scroll move glides to the scroll position and cross-fades between frames (`home-hero-scene.tsx`).
- 2026-11-26 — `DESKTOP-1R37EBU/hero-speed` merged (owner). Hero photo preloaded per screen size from the head; phone scroll frames wait for the first touch/scroll or 3 s; frames decoded with `createImageBitmap`.
- 2026-11-25 — `DESKTOP-1R37EBU/photo-hero` merged (owner). **Home hero** is a full-width photo (our Blender render) with a scroll-driven camera move:
  `home-hero-photo.tsx` + `home-hero-scene.tsx` (canvas over the still; frames in `public/hero/frames/`; desktop hero held sticky via a `motion-safe:lg:h-[…]` on #discover in `app/page.tsx`).
  **Desktop header is now sticky** (`site-header-reveal.tsx`): hides on scroll down, returns on a small scroll up. Page bars that pin to `top-0` on desktop will sit under it when shown.
  Home listings default to **List** again (owner). "Popular in SA" chips under the hero search removed.

- 2026-11-24 — `DESKTOP-1R37EBU/search-ssr` merged. **`src/app/search/page.tsx` is now a server page**; the old client page moved to
  `search/search-content.tsx` (default export `SearchContent`, prop `initialProperties`). Edit the search UI there. The catalogue is cached 5 minutes
  (`unstable_cache`), so listing changes can take up to 5 minutes to show on /search.

- 2026-11-24 — `DESKTOP-1R37EBU/listing-paywall` merged (owner). **A new listing needs a paid package** (sellers, landlords, agents, admins). Until online
  payment exists only accounts with the `developer` claim may create `properties` docs (`mayStartListing()` in `firestore.rules`; rule tests use `devSeller`),
  and `/seller/listings/new` shows non-developers "Choose a package first". When P4 lands, add the paid condition to `mayStartListing()`.
  Also: wizard autosave is per account (`dynasty_seller_wizard_autosave:<uid>`); agent Starter is R 99 for 2 listings.

- 2026-11-24 — `DESKTOP-1R37EBU/phone-speed-u2` merged (U2). **Firebase Auth is now created with `initializeAuth` (no popup resolver)** in `lib/firebase.ts`,
  so Google's sign-in iframe and gapi load only when `signInWithGoogle` passes `browserPopupRedirectResolver`. Any NEW popup/redirect call
  (`signInWithPopup`, `linkWithPopup`, `reauthenticateWithPopup`, `signInWithRedirect`, `getRedirectResult`) must pass that resolver too, or it throws.
  `PropertyCardPhotos` takes `preload` (default false; was on for every card); `PropertyListCard` takes `preloadPhoto`. Home spotlight uses next/image.

- 2026-11-24 — `DESKTOP-1R37EBU/page-heights-u3` merged (U3, owner chose the layouts). **Listing page**: `PropertyHeroGallery` and the on-show / off-plan /
  sold banners now sit at the top of the LEFT column of the details grid, so the aside (agent card) starts beside the photos at lg. **Home**: the homes
  start in Grid on desktop (list below lg). **/search**: slightly tighter vertical spacing below `sm`.

- 2026-11-24 — `DESKTOP-1R37EBU/phone-pass-u1` merged (U1), then fixed (`tap-44-fix`). **`tap-44` is the existing helper** in `globals.css` (below 1024px: an
  invisible 44px tap layer). It does NOT set `position` — the element needs Tailwind `relative` or `absolute` itself (U1 briefly added a rule that set it and
  knocked the card photo arrows to the left edge on phones). `linkClass` now carries `tap-44 relative`; a `tap-44` inside a `<p>` gets no layer.

- 2026-11-23 — `DESKTOP-1R37EBU/phone-fixes` merged (U4–U6). New `components/google-logo.tsx` on the Google buttons. The listing page works out its price box once
  (`priceLabel` / `priceText` in `property/[slug]/page.tsx`): a Sold/Rented home shows the recorded sale, never the asking price. `dashboard-ui.tsx` gains
  `attentionBoxClass` (champagne) and `urgentBoxClass` (`--dash-down`) — use them for dashboard notices instead of amber/rose.

- 2026-11-23 — `DESKTOP-1R37EBU/firebase-scripts` merged (S1-12). **`npm run firebase:deploy:rules` / `:indexes` / `:storage` work now** and always deploy the file from `origin/main`
  (refused if your copy differs; rules run `test:rules` first; `-- --dry-run` checks only). **`firebase:deploy:auth` is gone** on purpose: the `auth` block in
  `firebase.json` leaves out `dynasty-estates.vercel.app`, so deploying it would break live sign-in. Still ask the owner before any deploy.

- 2026-11-20 — `DESKTOP-1R37EBU/mobile-placement` merged (U8, owner's phone review). **Controls sit with what they change.**
  /search: view switch + sort moved from the search card to the results line (`aria-label="Sort listings"` kept). Area pages:
  listings first, directory + "Also see" after. `PropertyCardPhotos` dots are bottom-right (keep card prices bottom-left).
  `property-media-tabs`: one Street View / Map switch. Please keep this order when adding the "Under offer" badge.
  (Order kept: the badge sits top-left on the card, clear of the dots and the price.)

- 2026-11-20 — `ALET-ELIZE/per-search-stop` merged (S1-11). **Unsubscribe tokens moved to `lib/unsubscribe-token.ts`** (pure, no Firebase,
  tested in CI): `uid.target.signature`, target being a preference key or `search-<id>`. Preference links already sent are signed
  exactly as before. `verifyUnsubscribeToken()` now returns either `{uid, pref}` or `{uid, searchId}`, so anything reading it must handle
  both. A per-search link sets `alerts: false` on that search only — it does not delete it and does not touch `email_prefs`.

- 2026-11-20 — `ALET-ELIZE/price-drops` merged (S1-10). **New server-only `price_watch/{listingId}`** (the asking price the nightly
  job last saw) and a `price_drop` mail kind with the `priceDropAlerts` preference / `emailPriceDropAlerts` switch. If you change how a
  listing's price is stored or formatted, `priceNumber()` in `lib/price-drops.ts` is what reads it; a cut under 1% is recorded but not
  e-mailed. Saved homes are read with a collection-group query over `savedProperties` with no filter — fine at this size, needs an
  index on `propertyId` if saved homes ever run to five figures.

- 2026-11-20 — `ALET-ELIZE/ffc-reminders` merged (S1-9). **A new e-mail preference and a new mail kind.** `EMAIL_PREFS` gains
  `complianceReminders` and `MailKind` gains `ffc_reminder` (switch `emailComplianceReminders` in `/console/flags`) — if you add a
  preference, both lists and `DEFAULT_EMAIL_PREFS` need the key or `tsc` will say so. New server-only collection
  `compliance_reminders/{uid}`, keyed to one expiry date so a renewed certificate starts the 60/30/7 run again. The nightly job has
  one more step (`runFfcReminders`); `lib/ffc-reminders.ts` holds the pure logic and `tests/ffc-reminders.test.mjs` covers it in CI.

- 2026-11-20 — `ALET-ELIZE/under-offer` merged (S1-8). **The build lane is now on ALET-ELIZE** (the owner moved it here; `docs/HANDOVER.md` says so at the top and is kept for its reference sections).
  A live listing moves between Published and Under offer through **`PUT /api/listings/[id]/status`**, never a client write — `firestore.rules`
  is unchanged, because letting an owner write a public status would also let a Draft reach the catalogue. Use `nextMarketStatus()`
  (`lib/listing-status.ts`) for anything that offers the move; the route refuses anything else with 409 and files an `audit_logs` entry.
  "Under offer" is now visible to buyers for the first time: a pill on the listing hero, a badge on `property-list-card.tsx`, and
  `LimitedAvailability` in the structured data. New `tests/listing-status.test.mjs` runs in CI.

- 2026-11-20 — **Build-lane handover: read `docs/HANDOVER.md` first.** DESKTOP-1R37EBU stopped before S1-8 ("Under offer"),
  nothing started. The note has the state, open decisions, the working routine and XCORE.

- 2026-11-20 — `DESKTOP-1R37EBU/return-after-signin` merged (S1-7). For any new "Sign in" link use `const signInHref = useAuthHref()`
  (`lib/use-return-path.ts`) instead of a bare "/auth/login"; it adds `?next=<this page>`. `safeReturnPath()` in `lib/return-path.ts`.

- 2026-11-20 — `DESKTOP-1R37EBU/verify-email` merged (S1-6). **E-mail verification.** `<VerifyEmailBanner />` sits in layout.tsx under
  `<MaintenanceBanner />` (please keep it if you restyle the header area); page `/auth/verified`. Server: `lib/server/email-verification.ts`,
  `POST /api/auth/verify-email`, nightly reminder; new server-only collection `email_verification`, mail kind `verify_email`.

- 2026-11-19 — `DESKTOP-1R37EBU/data-integrity` merged (S1-5). `createSellerListing` writes the physical record in the listing batch.
  Server pages that read the catalogue (home, /for-sale, /to-rent, /agents/[slug], sitemap) now `export const revalidate = 300`;
  keep it if you restructure those pages. The 5 TEST comparable listings are deleted from live.

- 2026-11-19 — `DESKTOP-1R37EBU/rules-tests` merged (S1-4). **`npm run test:rules`** runs `tests/firestore-rules.test.mjs` against the
  Firestore emulator (Java 21; also in CI). Add a check there whenever you change `firestore.rules`. Rules tightened: listing owners
  can't set `example` / `sale` / `agentId`; applications are applicant + admin only; enquiries are created as `new` and unassigned.

- 2026-11-19 — `DESKTOP-1R37EBU/stand-ins` merged (S1-3). **Saves and collections are account-only.** `SavePropertyButton` no longer
  uses localStorage; signed out it sends to /auth/login. `/saved` and `/collections` show a sign-in state when signed out
  (`importBrowserSaves()` moves old browser lists into the account). The demo collection, `demo-user-1` and the fake
  "+ Invite Partner" dialog are gone; `addPropertyToCollection` / comments use `arrayUnion` (they used to overwrite).

- 2026-11-19 — `DESKTOP-1R37EBU/remove-samples` merged. **The 20 built-in sample listings are gone** (`fallbackProperties` deleted).
  `getPropertyList()` returns stored listings only (empty array when Firebase is off). A listing without a photo uses `NO_PHOTO_IMAGE`.
  `generateGroundedRecommendations`, `findHomesLikeThis`, `getPropertiesForCollection`, `getEnrichedListings` and
  `checkListingForDuplicates` now take the catalogue as an argument. `/compare` loads the real catalogue. The category and
  example pills on the listing-page photo were removed at the owner's request; please don't bring them back.

- 2026-11-19 — **Example listings.** 6 labelled example homes live in Firestore (`properties/claude-example-1..6`, `example: true`,
  tag "Example listing"; seeded from outside the repo). `PropertyRecord.example` → the property page shows a notice instead of the
  agent card and no enquiry buttons. Keep that behaviour if you restyle the page.

- 2026-11-19 — **Read `docs/TO-DO.md` before starting.** It is the working to-do list (mirrored in XCORE). Two lanes: the **UI lane**
  (mobile-first UI/UX: items U1–U7) and the **build lane** (data, API, e-mail, security, payments). It lists the shared files to claim
  first. The build lane starts with S1-1 (built-in sample listings) once the owner decides D1.

- 2026-11-19 — `DESKTOP-1R37EBU/sold-prices` merged. **Sold prices recorded on Dynasty.** New server-only collection `sales/{listingId}`
  (via `/api/listings/[id]/sale`, owner or admin); listings gain `sale: { soldOn, price? }` (price only if the seller agreed) — read it as
  `PropertyRecord.sale`. Area figures: `/api/market/sales` + `<RecentSales>`. `useOwnerListings()` now returns `reload()`. No rules change.

- 2026-11-18 — `DESKTOP-1R37EBU/email-features` merged. **Saved searches + alerts, weekly reports, e-mail opt-out.** Search matching now
  lives in `lib/search-criteria.ts` (`criteriaFromParams` / `matchesCriteria`), used by /search and the alerts — change filters there.
  New server-only collections `saved_searches`, `email_prefs` (Admin SDK via `/api/saved-searches`, `/api/email/preferences`; no rules).
  `sendMail({ optOut: { uid, pref } })` skips e-mail a person turned off and adds List-Unsubscribe. Nightly cron also runs alerts,
  Monday reports and `cleanUpListingFiles()`. Wizard takes `edit.fix` (checklist links, `#fix-<key>` ids). New page `/alerts`.

- 2026-11-18 — `DESKTOP-1R37EBU/email` merged. **E-mail sending** via `sendMail()` in `lib/server/mail.ts` (server only; provider from
  BREVO_API_KEY or RESEND_API_KEY; logs to `mail_log`; never throws). Templates in `lib/server/mail-templates.ts` (escape user text).
  After a browser write, call `requestNotification()` (`lib/notify-client.ts`) → `/api/notify/*`. New switches emailEnquiryAlerts /
  emailAgencyInvites / emailOpsAlerts; console page `/console/email`. Env: MAIL_FROM_EMAIL, MAIL_FROM_NAME, MAIL_ALERTS_TO.

- 2026-11-18 — `DESKTOP-1R37EBU/listing-edit` merged. **Listings can be edited**: `/seller/listings/[id]/edit` (one editor
  for sellers and agents, `?from=agent|seller|portal|agent-list`). The wizard now lives in `components/listing-wizard.tsx`;
  `app/seller/listings/new/page.tsx` only wraps it. Save edits with `updateSellerListing()` / load with `loadListingForEdit()`
  in `lib/seller-listings.ts` (shared `editableListingFields`). No rules change.

- 2026-11-16 — `DESKTOP-1R37EBU/petrol-inner` merged. Console inner pages in the Petrol style. New in `dashboard-ui.tsx`: `SummaryStrip`,
  `Initials`, `ListingThumb`, `listingStatusTone`, `tableFrameClass/HeadClass/RowClass`, `searchInputClass`; `QUEUE_TARGET_MS` in dashboard-math;
  `charts/price-strip.tsx`. `primaryButtonClass` and `FilterChips` changed look (also on the seller portal).

- 2026-11-13 — `DESKTOP-1R37EBU/site-dark-calm` merged. **Dark mode is calmer site-wide**: `html.dark` in globals.css re-points
  `--background`, `surface-ink/-panel` (now read through `--surface-*`) and the whole `emerald-*` scale to charcoal + muted sea-glass;
  the console keeps the old values via its own `.dark` wrapper. Dashboards use `--dash-*` tokens ("D · Petrol") and new
  `components/charts/*` + `KpiCard`, `StatementCard`, `RingCard`, `DashCard`, `Delta`, `AgeChip` in `dashboard-ui.tsx`.

- 2026-11-12 — `DESKTOP-1R37EBU/nightly-cron` merged. **`vercel.json` now has a cron**: `/api/cron/nightly` daily at 02:00 SAST
  (health probes, integrity scan, listing_stats older than 13 months deleted). Needs `CRON_SECRET` in Vercel (owner step;
  refuses with 503 until then). Health probes now live in `lib/server/health.ts`. Last run: `platform_config/nightly`.

- 2026-11-12 — `DESKTOP-1R37EBU/blaze-setup` merged. **Blaze is on; Cloud Storage live** (bucket
  `dynasty-estates.firebasestorage.app`), `storage.rules` **deployed** (create now also needs `resource == null`). Listing
  photos upload and listings can be submitted. `/console/flags` can switch off each photo check and phone sign-in: add new
  switches to `FEATURE_FLAGS` in `lib/platform-config.ts` (with a `group`). Scheduler + e-mail still await owner decisions.

- 2026-11-12 — `DESKTOP-1R37EBU/dashboards-phase-g` merged (agencies, F4). **New collections `agencies/{principalUid}`,
  `agency_invites/{principalUid}_{email}`, `agency_members/{principalUid}_{memberUid}`**; `inquiries` gain `assignedTo`, and
  inquiries / listing_stats reads now also admit the principal of the owner's agency and the assignee — rules **deployed
  live**. Use `getInboxInquiries()` (own + assigned) for an agent's inbox. New routes `/agency`, `/agency/team`,
  `/agency/enquiries`.

- 2026-11-12 — `DESKTOP-1R37EBU/dashboards-phase-f` merged (agent compliance, F3). **New collection `practitioners/{uid}`**
  (FFC number + expiry; owner files as "pending", only `/api/admin/practitioners` decides and grants the agent role) — rules
  **deployed live**. New routes `/agent/profile`, `/admin/agents`, `/join/agent`. Listings gain `mandateType` (sole|open) and
  `disclosureSignedOn` (YYYY-MM-DD) via `setListingMandate()`. Admin-only API auth: `lib/server/admin-auth.ts`.

- 2026-11-12 — `DESKTOP-1R37EBU/dashboards-phase-d` merged (enquiry stages, F2). **`inquiries` gains stages and two
  timestamps**: status `new|contacted|viewing|offer|won|lost` (later four for agents/admins only), `updatedAt` and
  `firstRespondedAt` (server time, set once as it leaves New). Owner updates may touch only those three fields — rules
  **deployed live**. Use `setInquiryStage()` in `lib/seller-inquiries.ts`, not a raw updateDoc. `formatDateTime` now
  prints SAST ("10 Nov 2026, 12:30").

- 2026-11-12 — `DESKTOP-1R37EBU/dashboards-phase-b` + `-phase-c` merged (Phases B, C, E of `docs/dashboards/PLAN.md`).
  **New collection `listing_stats`** (`{listingId}_{YYYYMMDD}`, SAST day): written only by `POST /api/track`
  (Admin SDK; views/saves/contact clicks, bots and repeats throttled), read by the owner or admin. Rules +
  2 composite indexes are **deployed live**. New routes: `/agent/listings/[id]` (+ `/report`),
  `/seller/listings/[id]` (+ `/report`), `/agent/market`. Pass `ownerId` to `RecordPropertyView`; use
  `TrackedContactLink` for Call/WhatsApp links on the listing page.

- 2026-11-11 — `DESKTOP-1R37EBU/dashboards-phase-a` merged (plan: `docs/dashboards/PLAN.md`). **/admin and
  /agent are now several routes** with a shared shell + tab row in each `layout.tsx` (`admin-shell.tsx`,
  `agent-shell.tsx`; RoleGuard lives there, not in the pages). New: `/agent/enquiries`, `/agent/listings`,
  `/admin/moderation|support|audit|packages`. Shared UI in `components/dashboard-ui.tsx` (tiles, tab row,
  `ConfirmDialog`). No schema or rules change.

- 2026-11-10 — `DESKTOP-1R37EBU/agent-dashboard-fixes` merged. **Agents no longer read every enquiry**:
  `inquiries` read/update/delete is admin, sender or listing owner (rules deployed live). The agent
  dashboard and seller portal share `components/enquiry-inbox.tsx` (`useOwnerInquiries` + `EnquiryList`);
  `lib/agent-inquiries.ts` is gone. "Property views" removed — nothing writes `views` yet.

- 2026-11-10 — `DESKTOP-1R37EBU/seller-enquiries` merged. **Enquiries carry `ownerId`** (the listing's owner;
  rules check it against `properties/{propertyId}`). Owners read them in the seller portal's new Enquiries
  section and may change `status` to new / contacted only. `contactName` / `contactPhone` are now saved.
  **Rules are deployed** to the live project. Pass `ownerId={property.ownerId}` to any new PropertyInquiryButton.

- 2026-11-10 — `alet-elize/map-touch-targets` merged (measured, finished). Map targets are 44px on
  phones: zoom buttons, pin hit areas (`tap-44`), clusters (44/52/60 at **every** width, so desktop
  clusters grew 6px), and the area/filter chips (`max-lg:min-h-11`). Leaflet's zoom rule needs
  `.leaflet-touch .leaflet-bar.leaflet-control-zoom a` to win on phones — a plainer selector loses
  silently. The `/map-search` hint sits at `max-lg:bottom-32` to clear the taller zoom bar.
  **Build warning for both machines:** `next build --webpack` now fails on `main` itself
  (`Can't resolve 'stream'` in firebase-admin's Firestore client), so the "build from a separate
  worktree" route in COLLABORATION.md no longer works when that worktree links `node_modules`
  (Turbopack refuses the link, webpack can't bundle the server code). Use a plain `npx next build`
  in a folder whose dev server is stopped. CI does not run `next build`, so nothing else catches it.

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
  plan limit in code yet. Private sellers cannot read enquiries on their own listings (rules) — fixed, see seller-enquiries above.

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
