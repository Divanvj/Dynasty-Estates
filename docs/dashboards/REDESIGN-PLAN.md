# Premium dashboards — redesign plan (proposed 2026-11-12)

Status (2026-11-13): **calmer dark mode (1b), R1 shared pieces, R2 agent, R3 agency and R4 admin overviews BUILT and merged.** R5 (restyle the remaining inner pages in depth, partner walkthrough refresh) still to do. Original note: The concept to look at first is
`Desktop/Dynasty_Estates_V2.0/Dynasty-Dashboard-Concept.html` (open it in a browser and switch
between Agent, Agency and Admin, and between light and dark).

Scope: the agent console (`/agent/*`), the agency view (`/agency/*`) and the admin console
(`/admin/*`). **The developer console (`/console`) is not touched.**

The goal from the owner: the dashboards are what sells Dynasty to agents and agencies. They
should look premium and catch the eye at first glance. Today they are a heading, five plain
number tiles and a list.

---

## 1. What the five references have in common

| Reference | What works | What we take | What we leave |
|---|---|---|---|
| RevoNest (dark, house photo) | Greeting, a real property photo as the hero, KPI cards with a small trend chart, an actual-vs-target bar chart, a property table with photos, a ring | Hero with **the agent's own best listing photo**, sparkline KPI cards, photo thumbnails in tables, one ring | Rent/NOI/portfolio figures; Dynasty has no such data |
| Home Desk (light, lavender) | Calm light surfaces, a right rail with one property in focus, a status ring, upcoming units as photo cards | A light-mode version that still feels premium, the **focus rail** idea, photo cards | Lavender palette, the chat sidebar |
| Nexa bank (glass on interior photo) | Depth, a warm accent on charcoal, goal progress bars | Goal bars (e.g. reply-time target), warm accent on charcoal | Heavy glass blur over a photo; it hurts contrast |
| Orange gauges (dark) | One accent colour used with discipline, big ring numbers, dense bar chart | A **single accent**, large display figures, a dense daily bar chart | Unreadable tiny labels |
| (link 1 repeated) | — | — | — |

The pattern they share: **a near-black warm surface, one warm accent, real photography, very
large numbers, small trend charts next to every number, and a clear grid of differently sized
cards (bento).** Dynasty already has exactly this palette in `globals.css` and doesn't use it on
the dashboards: `--obsidian-bg #0b0f10`, `--obsidian-champagne #c5a059`, emerald `#10b981` and
deep teal `#0b4d4e`. So the redesign takes its look from the references while staying
Dynasty's own: obsidian + champagne + emerald, not their orange.

## 2. Market research — what agents and principals actually buy

- **Speed to lead is the number that matters.** Brokerages treat first-reply time as the top
  driver of conversion; Follow Up Boss sells "speed to lead" visibility for coaching, and
  BoldTrail's Vitals board ranks agents by reply rate and response time. Dynasty already
  measures the median first reply (Phase D), so it should be the **hero metric**, shown as a
  ring against a target and not as a small tile.
- **Pipeline by stage plus what's stuck.** Broker guides recommend a short weekly check:
  speed to lead, lead → viewing, pipeline by stage, follow-up discipline. Dynasty has the stages
  (New → Contacted → Viewing → Offer → Won/Lost), so we can show a funnel and "stuck for X days".
- **Leaderboards with a bit of game.** Vendors report agents like being ranked. The agency view
  gets a top-3 podium and inline bars, not a plain table.
- **Leading over lagging figures.** Waiting enquiries, oldest wait and reply time come before
  views and totals.
- **South African competitors** (Entegral Base, PropCon, Property24 PropCtrl, Private Property
  Fusion) sell on syndication and back-office features. Their dashboards are form-heavy and
  dated. **No local tool leads with a beautiful, honest performance view.** That's the gap
  Dynasty can own.
- **2026 SaaS dashboard trends:** dark-first for data screens, modular (bento) layouts, progressive
  disclosure (glance first, detail on click) and role-aware views. Financial apps such as Mercury
  are cited for "editorial polish" that makes numbers feel premium.

Sources: Follow Up Boss "Coach" page; BoldTrail Vitals (Inman, Feb 2025); iHomefinder agent
performance tracking; Luxury Presence / The Close CRM round-ups 2026; Entegral, PropCon and
Private Property product pages; SaaSFrame and 925studios 2026 dashboard trend articles. Most are
vendor marketing, so I've taken the direction from them, not any benchmark figures.

## 3. Design language — "Dynasty Obsidian"

- **Colour (60-30-10, revised 2026-11-12 after owner feedback: v1 had too much orange).**
  The concepts are in `Dynasty-Dashboard-Concepts-v2.html`, with three schemes for the owner to choose from.
  - **60% neutrals**: the page, the cards and the text.
  - **30% Dynasty teal**: the statement card and **all data**, as a sequential teal ramp
    (`#0b4d4e` → `#4a8a86` → `#a8c8c4`). In dark mode the ramp is a desaturated sea-glass
    (`#8bbdb7` → `#4f817c` → `#2a4846`), so it never reads as mint green.
  - **10% champagne**: one highlight per card at most. That covers the greeting name, the target
    ring on the statement card, today's bar, first place and the target line. It is `#c5a059` in
    light mode and `#cfb27a` (champagne-300, not yellow gold) in dark mode.
  - **Green and red** appear only inside the small change chips and on "late" items. They are
    never a fill or a chart colour.
  - **Champagne as text** is used only at display sizes (40px). Small champagne labels on teal
    use champagne-100 in the build to keep 4.5:1.
- **The hero card is always obsidian, in light mode too.** It's the first-glance moment: a dark
  card with the listing photo, the greeting and the speed-to-lead ring. The rest of the page
  follows the theme. So the site keeps its light default (an owner decision) and the dashboard
  still has the dramatic look of the references.
- **Type.** Geist for everything, with tabular figures. Display numbers 44–56px, semibold, tight
  tracking; labels 12px small caps; no more than two weights per card.
- **Bento grid.** A 12-column grid with cards of 3, 4, 5, 7, 8 and 12 columns. At 375px it becomes one column in
  priority order: hero, needs you, KPIs, then the rest.
- **Depth.** Hairline border, then a soft shadow. No glow and no heavy glass, which matches the
  owner's "avoid excessive glow, clutter and unnecessary animation".
- **Motion.** Charts draw in once (400ms, transform/opacity only), and numbers settle once. Nothing
  loops. `prefers-reduced-motion` turns it all off.
- **Honesty.** Every figure comes from stored data. Loading shows a skeleton, never a 0. "None yet"
  where there is no data. No estimates dressed up as facts.

## 4. The three dashboards

### Agent — `/agent/dashboard`
1. **Hero (8 cols, obsidian).** "Good evening, {first name}", the date (SAST) and one line ("2 buyers
   are waiting, the oldest for 3 h"). Behind it on the right is **the photo of the agent's
   best-performing listing this month**, with its title, price, 30-day views and enquiries. It
   links to the listing.
2. **Speed-to-lead ring (4 cols, obsidian, joined to the hero).** The median first reply over the
   last 30 days against the target. The ring fills champagne when on target and turns rose when
   over. It shows the number of enquiries counted.
3. **KPI strip (4 × 3 cols).** New enquiries, views, saves and contact clicks, each with a 30-day
   sparkline and a **change against the previous 30 days** (▲ emerald / ▼ rose).
4. **Needs you today (5 cols).** The current list, restyled. A coloured age chip per item (amber
   over 1 h, rose over 24 h) and an icon by type.
5. **Buyer pipeline (7 cols).** A horizontal funnel New → Contacted → Viewing → Offer → Won, with
   counts, the conversion between stages and "stuck > 7 days" flags.
6. **Performance chart (8 cols).** Daily views as bars with contact clicks as a line, over 30 days.
   Hover shows the day.
7. **Compliance card (4 cols).** FFC status with a countdown ring (days left of 365), plus the
   mandate gaps.
8. **Listings gallery (12 cols).** Photo-card rows: thumbnail, title, price, status pill, a health
   score bar (photos, floor plan, tour), a views sparkline and enquiries.

### Agency — `/agency`
1. **Hero (obsidian).** The agency name and PPRA number, the agents (initial avatars stacked) and
   the agency's speed-to-lead ring.
2. **KPI strip.** Active listings, enquiries over 30 days, waiting, won, each with a sparkline and a change.
3. **Leaderboard.** A **top-3 podium** (gold, silver, bronze in champagne tints) and a ranked table
   with inline bars for enquiries, views and won, plus a reply-time chip per agent (on or off target).
4. **Reply time by agent.** Horizontal bars against the target line. This is the coaching view the
   research points to.
5. **Waiting to hand out.** The new, unassigned enquiries, with a "Hand to…" link.
6. **Listings by agent.** A stacked bar of listing status per agent.

### Admin — `/admin`
1. **Hero (obsidian). Marketplace pulse:** live listings, a 30-day trend and new this week.
2. **KPI strip.** Live listings, enquiries over 7 days, new accounts over 7 days, verified agents.
3. **Queues with time limits.** Moderation, agent verification, support and package requests. Each row
   has an age bar against a 24 h service target, coloured by how late it is.
4. **Enquiries per day (30 days).** Bars.
5. **Supply mix.** A donut of sale vs rent and a bar chart of the top cities by live listings.
6. **Revenue card: honest placeholder.** "Payments aren't switched on yet. Package requests are
   invoiced by hand (n open)." It becomes real in Phase H (pricing phase 2 + payment).

## 5. Data: what exists, and what's new

| Widget | Source | New? |
|---|---|---|
| Hero listing photo, price, title | `listings.image`, `numericPrice`, `title` | Exists |
| Views / saves / contacts, sparklines, change | `listing_stats` (60 days, so we can compare periods) | Exists; reads double from 30 to 60 days |
| Speed to lead | `medianReplyMs` | Exists. **Target**: a constant of 1 h at first (decision 2) |
| Funnel, stuck flags | `inquiries.status` + `updatedAt` | Exists |
| FFC countdown | `practitioners/{uid}` | Exists |
| Agency figures | `useAgencyTeam` | Exists, plus 60-day stats per agent |
| Admin trends (listings, enquiries per day) | `listings.publishedAt`, `inquiries.createdAt` | **New admin queries**; may need composite indexes (a rules or index deploy) |
| Admin new accounts / verified agents | `users.createdAt`, `practitioners.status` | New queries; check that the admin read rules allow them |
| Supply mix by city and type | `listings.city`, `listingType` | New query |
| Revenue | Nothing yet | Phase H; honest placeholder until then |
| Agent avatar photos | Nothing stored | Initials for now; a profile photo upload can follow (Storage is now on Blaze) |

No schema changes are needed for phases R1–R3. R4 may need indexes (they need the owner's OK
to deploy).

## 6. Build plan

Each phase is its own branch `DESKTOP-1R37EBU/dash-premium-rN`, claimed in WORKING_ON.md, checked
on :3000 with tsc/eslint only, verified by driving to saved data, then merged.

- **R1 — design system and chart kit.** Tokens (champagne accent, obsidian hero, ivory light
  surfaces), plus `components/dashboard-ui.tsx` additions: `HeroPanel`, `KpiCard` (value, change,
  sparkline), `BentoGrid`, `AgeChip`. A new folder `components/charts/` with `AreaBars`, `Ring`,
  `Funnel`, `Donut`, `HBars` and `Podium`, all **hand-written SVG and no new dependency**
  (decision 3). Each chart has a screen-reader summary and, where useful, a table beside it.
- **R2 — Agent dashboard.** Phase 4 layout. The 60-day stats hook. The hero listing pick (most
  enquiries in 30 days, then most views).
- **R3 — Agency overview.** Podium, reply-by-agent bars, KPI changes.
- **R4 — Admin overview.** New admin queries and indexes, queues with time limits, supply mix,
  the revenue placeholder.
- **R5 — The finish.** Restyle the inner pages (Enquiries, Listings, Team, Moderation…) with the
  same cards and chips. Check 375px / 1280px in light and dark, run the ux-audit, update the
  partner walkthrough HTML/PDF and the removed/replaced log.

## 7. Decisions for the owner

1. **The colour scheme.** The owner asked for a middle ground between A Deep teal and B Obsidian.
   `Dynasty-Dashboard-Concepts-v3.html` has three:
   - **D Petrol**: teal fading into obsidian.
   - **E Teal-lit obsidian**: an obsidian card with teal only as light on it and a fine edge.
   - **F Smoked teal**: one flat blend of teal and graphite.

   **DECIDED 2026-11-12: D Petrol** (owner). The page follows the site theme (light by default).
1b. **A calmer site-wide dark mode (new, phase S).** Today's dark surfaces are tinted teal
   (`#081012`, `#0c1a1c`), and about 470 classes use bright emerald, so the whole screen reads
   green. The proposal:
   - Near-neutral charcoal: page `#0b0e0f`, panels `#121617`, inputs `#0f1314`.
   - Sea-glass `#8cc1ba` for links and data.
   - A light neutral primary button instead of emerald-700.
   - Champagne `#cfb27a`.

   This is done at the token level in `globals.css`, by redefining the surface colours and the
   emerald scale under `.dark`, followed by a visual pass of every page. The 2 000 `dark:`
   classes are not rewritten. Light mode is untouched. The comparison is the "Site dark mode"
   tab in the v3 concepts. Best done **before** R1, so the dashboards are built on the final
   dark tokens.
2. **The reply-time target.** Recommended: 1 hour to start, editable per agency later.
3. **Charts without a library.** Recommended: hand-written SVG, so no new dependency and full
   control of the look. The alternative is Recharts, a new dependency that needs approval.
4. **How much game.** Recommended: the podium and an on-target chip only. No badges or streaks for now.
5. **Approve the concept,** then I start R1.

## 8. Still unbuilt (kept on the list)

Phase H pricing phase 2 + payment; revenue card data; agent profile photos; SMS/e-mail alerts for
new enquiries; e-mailed agency invitations; per-agency reply targets; the Blaze switch-on list
(`docs/blaze/SETUP-PLAN.md`, handled in the main session).
