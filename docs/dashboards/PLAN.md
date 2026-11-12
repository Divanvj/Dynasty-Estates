# Agent & admin dashboards — implementation plan

Written 2026-11-10 (DESKTOP-1R37EBU). Status (2026-11-12): **A–G DONE** (on main; listing_stats rules + indexes deployed live 2026-11-11; enquiry-stage rules (F2) practitioners rules (F3) and agency rules (F4) deployed live 2026-11-12). H needs pricing phase 2.
Scope: the agent console (`/agent/*`), the agency principal's view, the admin pages (`/admin/*`) and the
seller portal where it shares the same pieces. **The developer console (`/console`, `/api/console/*`) is out of
scope — do not touch it** (owner, 2026-11-10).

## Owner decisions (2026-11-10)

| Question | Answer |
| --- | --- |
| Who is the buyer? | Both the individual agent and the agency principal. Order is ours to choose (see "Order"). |
| Seller report branding | Dynasty branded, but not in your face — the agent/agency leads, a small Dynasty tag. Show the owner an example template when it is built. |
| View tracking | Approved: count listing views, never who viewed. |
| Bugs first | DONE 2026-11-10 (d4fedc2): agents read only their own enquiries (rules live), always-0 views removed, inbox ordered/dated/actionable. |

## Ground rules for every phase

1. **Real data only.** Nothing sample, mocked or "illustrative" on these pages. A figure we can't
   compute is not shown; an unbuilt feature is listed as planned, not drawn. Small samples say so ("Based on 3
   Dynasty listings — too few to compare").
2. **One page pattern per route**, named before any markup (`page-patterns`). Today's agent dashboard breaks this:
   it is a Dashboard (Pattern 4, read-only) with an editable inbox inside it. Phase A splits it.
3. **Charts follow `dataviz`**: form first, colour last; sparklines and plain bars drawn in SVG with no new chart
   dependency; one axis; a hover tooltip on every plotted chart; a table view; dark mode with its own validated
   steps (`scripts/validate_palette.js` run for light and dark); status colours only for status, with icon + label.
4. **Skills applied while building**: `page-patterns`, `dataviz`, `empty-states`, `loaders` (skeletons per region,
   no page spinner), `viewports` (375 → 1280, no horizontal scroll), `surfaces` (edits in slide-overs, named
   destructive confirms), `keyboard`, `labels`, `verbs`, `errors`, `typography`/`spacing`/`colour-palette` against
   the existing tokens (`bg-[var(--background)]`, `<BrandLogo />`). **`ux-audit` runs before each phase merges.**
5. **Verify by persistence**: every write path is driven in the browser with the developer account switched to the
   role, then read back from Firestore. Every rules change is tested on the local emulator (the
   `cloud-firestore-emulator` jar, rules loaded over its REST endpoint) for allowed *and* denied cases, then
   deployed with the owner's OK and re-checked live with a real token.
6. **Approvals needed before coding** (owner's standing rule): schema, rules, new dependencies, architecture. Each
   phase lists what it needs.
7. Each phase updates `docs/ux-audit/08` (removed/replaced log) and ends with a list of what is still unbuilt.

## Routes and their patterns

| Route | Pattern | Job | Phase |
| --- | --- | --- | --- |
| `/agent/dashboard` | 4 Dashboard | Glance: what needs me today, how my listings are doing. Read-only, ≤5 tiles, links out. | A, B, D |
| `/agent/enquiries` | 10 Inbox (A) | Work the enquiry queue: reply, change stage. Filters: All / New / In progress / Closed. | A, D |
| `/agent/listings` | 1 List | All my listings with status, days on market, views, enquiries, health. | A, B |
| `/agent/listings/[id]` | 2 Detail | One listing. Tabs: Overview · Performance · Enquiries · Seller report. | B, C |
| `/agent/listings/[id]/report` | Print document | The seller report (prints / saves as PDF from the browser). | C |
| `/agent/market` | 9 Analytics (report runner) | Price snapshot for a suburb + type, for listing appointments. | E |
| `/agent/profile` | 5 Settings | Practitioner details, FFC number and expiry, agency. | F |
| `/agency` | 4 Dashboard | Principal's glance across the agency. | G |
| `/agency/team` | 1 List | Agents with listings, enquiries, response time. | G |
| `/agency/enquiries` | 10 Inbox (A) | Unassigned enquiries → assign to an agent. | G |
| `/admin` | 4 Dashboard | Platform pulse (business, not engineering — that is `/console`). | A |
| `/admin/moderation` | 8 Split Pane | Triage submitted listings without leaving the page. Fraud signals inline. | A |
| `/admin/support` | 10 Inbox (A) | Support requests with status. | A |
| `/admin/audit` | 10 Inbox (B-style feed) | Append-only audit trail. | A |
| `/admin/agents` | 10 Inbox (A) | Practitioner verification queue. | F |
| `/admin/revenue` | 1 List | Package / plan requests: requested → invoiced → paid → expired. | H |
| `/seller/portal` | 4 Dashboard + links | Private sellers get the same Performance tab and seller report for their own listings. | B, C |

Mobile: the bottom tab bar (`mobile-nav.tsx`) for Agent gains Enquiries; admin sub-pages get a tab row that scrolls
(no wrapping) at 375px.

## Data foundations (need approval)

### F1 — Listing statistics (Phase B) — schema + rules + API route
- Collection `listing_stats`, one doc per listing per day: id `{listingId}_{YYYYMMDD}` (SAST date),
  fields `listingId, ownerId, agencyId?, date, views, saves, contactClicks`.
- Written **only by the server** (`/api/track` route, Admin SDK, `FieldValue.increment`) — Cloud Functions need
  Blaze, a Next route does not. Rules: read if `ownerId == auth.uid` or admin; client writes denied.
- Events: `view` (listing page, once per listing per browser session, bots skipped by user agent), `save`
  (from the save button), `contact` (Call / WhatsApp / email reveals on the listing page). Enquiry counts come
  from `inquiries`, not from here. No user id, IP or cookie is stored.
- Write budget: one write per counted event. Spark allows 20k writes/day; fine at launch. If it grows, batch in
  memory per instance and flush every few seconds.
- Retention: keep daily docs 13 months (for "same month last year" later); owner to confirm.

### F2 — Enquiry pipeline (Phase D) — schema + rules
- `status` widens to `new → contacted → viewing → offer → won | lost` for agents (private sellers keep
  New / Contacted). Adds `firstRespondedAt` (set when it first leaves `new`) and `updatedAt`.
- Owner update rule: `affectedKeys().hasOnly(['status','firstRespondedAt','updatedAt'])`, status in the list,
  `firstRespondedAt` only settable once.
- Gives: median response time, enquiry → viewing → offer funnel per listing.

### F3 — Practitioner compliance (Phase F) — schema + rules
- **As built:** its own collection `practitioners/{uid}` (`fullName, email, phone, ffcNumber, ffcExpiry, agencyName,
  status, submittedAt` by the owner, always as a fresh "pending"; `verifiedAt, verifiedBy, decisionNote` and
  verified/rejected only by `/api/admin/practitioners`), not a map on `users/{uid}`, because the owner may write
  anything on their user document. `agencyId` waits for Phase G (free-text agency name until then).
- Planned: `users/{uid}.practitioner`: `ffcNumber, ffcExpiry, verifiedAt, verifiedBy, agencyId`. Owner reads; only admin
  writes (verification). Listing fields `mandateType` (sole / open) and `disclosureSigned` (date, self-attested —
  no document upload while Storage is blocked).

### F4 — Agency (Phase G) — schema + rules (this is "Register Agency", already on the unbuilt list)
- **As built:** `agencies/{principalUid}` (`name, ppraFirmNumber, principalUid, createdAt`; only a verified practitioner
  may register one), `agency_invites/{principalUid}_{email}` and `agency_members/{principalUid}_{memberUid}`. The principal
  reads a member's enquiries and listing stats through the membership link (rule `exists()`), so nothing is copied onto
  listings or enquiries, no backfill was needed, and leaving ends access at once. Enquiries gain `assignedTo`; the
  principal may change only that, the assignee works the stages.
- Planned: `agencies/{id}`: `name, principalUid, memberUids[], ppraFirmNumber?`. Listings and enquiries carry `agencyId`.
- Principal reads every listing/enquiry/stat with their `agencyId` (rule `get()` on the agency doc). Enquiry gains
  `assignedTo`.

### F5 — Package & expiry (Phase H) — this is pricing plan phase 2; listed here because "expiring soon" and the
admin revenue list depend on it.

## Phases

Sizes: S ≈ half a day, M ≈ 1–2 days, L ≈ 3+ days.

### Phase A — Restructure to one pattern per page (M) · no schema · no approval needed · **DONE 2026-11-11**
- `/agent/dashboard` becomes read-only: 4 tiles (New enquiries · Oldest unanswered · Viewing requests (7 days) ·
  Active listings), a "Needs you today" list (unanswered enquiries, listings sent back by moderation) linking to
  `/agent/enquiries` and `/agent/listings`.
- `/agent/enquiries`: the existing `EnquiryList` moves here with All / New / Contacted filters.
- `/agent/listings`: list of the agent's listings (status, price, enquiries, created date), rows link to Detail.
- `/admin` splits into the routes above. `/admin` itself: 5 tiles from existing data via aggregate count queries —
  Live listings · Waiting for moderation (+ oldest age) · Enquiries (7 days) · New support requests ·
  Open package requests — plus a short "needs action" list.
- `/admin/support` gains status changes (new → in progress → closed); the rule already allows admin updates.
- Accept: each route names one pattern; empty/loading/error stay inside the frame; 375px no overflow; no console
  errors; status change on support persists (read back).

### Phase B — View tracking and listing performance (L) · F1 approved 2026-11-11 · **DONE 2026-11-12**
- `/api/track` + client hooks on the listing page, save button and contact links.
- Listing Detail **Performance** tab: views · saves · contact clicks · enquiries, last 30 days, as one
  small-multiples row of sparklines (one measure each, no dual axis) with a daily table view; enquiries per 100
  views; days on market.
- **Compared with the suburb**: price per m² against the median of *real* published Dynasty listings in the same
  suburb and type (reuse `buildSuburbStats` in `lib/geo-data.ts`), shown only with ≥5 comparables, otherwise the
  city tier, otherwise "not enough listings yet". Never computed from the sample `fallbackProperties`.
- Listing health checklist (photos, floor plan, tour, show day, description length, quality score) with the next
  thing to fix — each item links to where it is fixed. Note: there is no listing edit screen yet; until one exists
  the checklist says what is missing and offers nothing to click it would fake.
- Dashboard tile swap: "Views (7 days)" replaces "Viewing requests (7 days)" if five tiles would be exceeded.
- Seller portal gets the same Performance tab for private sellers.
- Accept: a view on a published listing increments the day doc once per session (read back); a bot UA does not;
  a non-owner cannot read another listing's stats (emulator + live).

### Phase C — Seller report + example template (M) · no schema beyond F1 · **DONE 2026-11-12**; example: `Dynasty-Seller-Report-Example.html/.pdf` in the project folder (outside the repo)
- `/agent/listings/[id]/report`, an A4 print layout (uses the existing print stylesheet): agent/agency name,
  photo and contact **at the top**; the listing; this week vs last week (views, saves, enquiries, viewings);
  30-day trend; position vs suburb; agent's note to the seller (typed on the page, not stored unless the owner
  approves a field).
- Branding (owner: subtle): no Dynasty header. A single footer line — small `BrandLogo` mark + "Report prepared
  with Dynasty Estates · {date}" — and the listing's public URL.
- Deliver to the owner: a filled example from a real test listing (screenshot + saved PDF in the project folder per
  the partner-report convention), before it is called done.
- "Download PDF" = the browser's Save as PDF. Server-side PDF and the weekly e-mail are unbuilt (need an e-mail
  provider; see Blocked).

### Phase D — Enquiry pipeline and response time (M) · F2 approved 2026-11-12 · **DONE 2026-11-12**
- Stages in `/agent/enquiries` (filter chips per stage, stage change in the row — no hover-only controls).
- Dashboard tiles: median first-response time (30 days), oldest unanswered.
- Listing Detail **Enquiries** tab with the funnel (enquiries → viewings → offers) as a plain horizontal bar.

### Phase E — Price snapshot (M) · no schema · **DONE 2026-11-12** (`/agent/market`)
- `/agent/market`: choose suburb, type, sale/rent → median price, price per m², active listings, price range
  (min–max, interquartile when ≥8), list of comparables. Printable.
- Labelled honestly everywhere: "Dynasty listings only — asking prices, not sale prices or a valuation." Sold prices
  (Deeds Office / Lightstone) are out of scope unless the owner buys a data feed.

### Phase F — Compliance and agent verification (M) · F3 approved 2026-11-12 · **DONE 2026-11-12**
- `/agent/profile`: FFC number + expiry; banner 60 days before expiry; a listing without mandate/disclosure shows
  it in "Needs you today".
- `/admin/agents`: verification queue — check FFC on the PPRA register (manual, link out), approve → sets the
  `agent` role claim via a server route + audit log entry. Today roles are set by script only.

### Phase G — Agency principal (L) · F4 approved 2026-11-12 · **DONE 2026-11-12**
- Register Agency flow (principal creates the agency, invites agents by e-mail address — the invite is shown in the
  agent's account, since no e-mail is sent yet).
- `/agency` dashboard: agency totals, leaderboard (enquiries, median response time, active listings), unassigned
  enquiries count. `/agency/team`, `/agency/enquiries` with assignment.

### Phase H — Admin revenue and insights (M) · pricing phase 2 (F5)
- `/admin/revenue` list of package/plan requests with status and expiry; MRR by plan once payments are recorded.
- Demand vs supply by suburb needs search logging or Saved Searches (both unbuilt) — planned, not in this phase.

## Order and why

A → B → C → D → E → F → G → H. Every agent, including a principal who lists, gets value from A–E without the agency
model; the seller report (C) is the strongest sales piece, so it comes as soon as there is data to put in it. G is
the principal's own view and needs the agency schema, so it follows once the individual agent's console is solid.

## Blocked or external

- E-mail / SMS / WhatsApp sending (weekly seller report, new-enquiry alerts, FFC reminders) — needs a provider and
  either Blaze (Functions) or Vercel Cron; owner decision.
- Listing photos (Storage needs Blaze): until then a listing can't be submitted, so the dashboards will have little
  real data. See open decision 1.
- Sold-price data (Lightstone / Deeds) — paid feed.
- Online payment (pricing phase 4).

## Open decisions for the owner

1. **Demo data for sales.** With few real listings the consoles will look empty in front of prospects. Options:
   (a) a real "demo agency" account on live with clearly marked test listings, enquiries and stats, never shown in
   public search; (b) a separate demo Firebase project; (c) show only real data and wait. Recommended: (a). No
   fake numbers inside the real product either way.
2. F1 approved 2026-11-11, F2 approved 2026-11-12, F3 and F4 approved 2026-11-12.
3. Stats retention (13 months proposed).
4. Seller report: may the agent's note be stored on the listing (new field), or typed per print only?
5. Agent role grant via `/admin/agents` (server route that sets claims) — taken as part of the F3 approval (2026-11-12); built as `/api/admin/practitioners` (admin claim only; never changes a developer or admin account's role; audit entry per decision).

## Unbuilt (keep listed until done)

Built: view tracking · listing performance · seller report + template · enquiry stages & response time · price snapshot · compliance card · agent verification queue · listing mandate · Register Agency · principal view + leaderboard · invitations · enquiry hand-out.
Still unbuilt: invitation e-mails · admin
pulse & sub-pages · revenue list · demand vs supply · e-mail/SMS/WhatsApp alerts · Saved Searches · listing edit
screen · online payment · package expiry · tenancy applications screen for agents/landlords.
