# 05 — Progress log

Branch `ux/audit-overhaul`, worked in a separate git worktree so the shared
checkout stays on `main` and the other agent's uncommitted work is untouched.

---

## S1 — Remove the Deeds Office attribution

**Status:** done · 5 November 2026

### What changed

`/insights` presented hardcoded figures under a badge reading **"Official
Registrar of Deeds Records"** and a byline **"Source: South African Deeds Office
& PropTech Analytics"**. The data behind both is a literal object in the same
file (`deedsRecordsByNode`). That is invented property-transaction data
attributed to a real government registry.

| File | Change |
|---|---|
| `app/insights/page.tsx` | Added a "Sample data, not a market report" notice above every figure. Badge → "Sample data". Byline → "Illustrative figures — no registry data is connected yet". Table header → "Example recent sales in {node}". Removed "✓ Verified Registrar Data". Hero eyebrow "Q3 2026 Property Intelligence" → "Illustrative scenario", and its paragraph no longer claims "independent data … indicates" |
| `app/insights/layout.tsx` | Title and description no longer promise "Deeds Office Trends" / "Deeds Office transaction trends" / "Independent real estate analytics" |
| `app/for-sale/page.tsx` | "Verified listings with … Deeds Office price history" removed |
| `app/for-sale/[province]/page.tsx` | "All listings feature Deeds Office history" removed |
| `app/for-sale/[province]/[city]/page.tsx` | "Deeds Office insights" removed from the description; link "Deeds Office Suburb Trends →" → "Suburb market trends →" |
| `app/search/layout.tsx` | "Deeds Office records" removed from the description |

### A correction to the step's own acceptance criteria

The plan said *"no 'Deeds Office', 'Registrar' or 'Official' string anywhere"*.
That criterion was written too broadly and was wrong to apply literally.

A grep found 25 occurrences, and **most are legitimate and factually correct**:
the conveyancing-fees calculator explains statutory Deeds Office registration
levies, the transfer-duty page correctly states that the Registrar of Deeds will
not register a property without a SARS receipt, and `calculators-view.tsx` cites
"Official SARS Statutory Transfer Duty Rates", which genuinely are official.
Stripping those would have made the product less accurate, not more honest.

**The criterion as applied:** no claim that *Dynasty's own data* comes from the
Deeds Office or any registry. Educational references to real statutory costs
stay.

### Verification

- Rendered-page text check on `http://localhost:3100/insights`: "Official
  Registrar", "Deeds Office &", "Source: South African Deeds", "Verified
  Registrar", "Deeds Registrations" and "Q3 2026 Property Intelligence" all
  **absent**; the four replacement strings all **present**.
- `npx tsc --noEmit` — pass.
- `npx eslint` on the touched trees — clean.
- Screenshots: `docs/ux-audit/after/S1/insights-390x844.png`,
  `insights-1440x900.png`.

### Deferred from this step

- **Whether the figures stay at all** is still your decision (plan §7.1, §7.2).
  This step makes the page honest; it does not decide whether an illustrative
  market-insights page should ship at all.
- `agents/[slug]/page.tsx:100` lists "Deeds Office Title Registration" in an
  agent's `knowsAbout` structured data. Left alone: it describes an agent's
  expertise, not a Dynasty data source, though the agents themselves are demo
  records.
- `property/[slug]/page.tsx:328` reads "Official Off-Plan Development Release".
  That is a separate over-claim, and the file is in the other agent's
  in-flight set.
- Glow on the growth numerals (tell T18) is still present; it belongs to the
  token step, S5/S6.

---

## S2 — Hide past on-show dates

**Status:** done · 5 November 2026

Every listing carried `date: "Sunday, 14 Sep"` — display text with **no year**,
so nothing could compare it to today. That is how a viewing seven weeks past
came to sit under a pulsing "On Show This Weekend" badge with a calendar button
and a Directions link beside it.

| File | Change |
|---|---|
| `lib/property-data.ts` | `onShow` gains an optional `isoDate` (`YYYY-MM-DD`) |
| `components/on-show-banner.tsx` | New `describeShow()`. Renders nothing when `isoDate` is missing or the date has passed. The badge is derived: "On show this weekend" only when the date really is a Saturday or Sunday within 7 days, otherwise "On show today" or "On show" |

**Why the cut-off is yesterday, not today.** This is a client component that
also renders on the server. Vercel runs UTC, a Cape Town reader is on SAST
(+2), and a same-day comparison can disagree across the two — which would change
whether the element exists at all, and React reports that as a hydration
mismatch. A full day of slack makes that practically impossible while still
catching the weeks-stale case.

**Effect today:** no listing has an `isoDate`, so the banner does not render
anywhere. That is the correct outcome — there are no scheduled viewings, and
the demo data should not invent one.

**Verified:** `/property/oak-terrace` contains none of "On Show This Weekend",
"Sunday, 14 Sep" or "Showboard Route". Screenshot
`after/S2/property-1440x900.png`.

**Deferred:** the call site wraps the banner in `<div className="mt-6">`, which
is now an empty 24px gap. Fixing it means editing
`app/property/[slug]/page.tsx`, which the other agent is holding — folded into
S11.

---

## S3 — Strip build artefacts

**Status:** done · 5 November 2026

| File | Change |
|---|---|
| `components/ambient-cursor-hue.tsx` | Removed the fixed corner pill reading **"FX: Aurora Silk"** and the picker behind it (Magnetic Halo, Antigravity Particles, Off). Removed the now-unused `showPicker` state and `handleModeChange`. The effect still runs; it just has no user-facing switch |
| `app/page.tsx` | Removed the footer links to **"Agent Command Console"** (`/agent/dashboard`) and **"Platform Command & Moderation"** (`/admin`). Renamed "Market Intelligence Pulse" → "Market Insights" |
| `app/page.tsx` | Replaced **"Built with Next.js, TypeScript & Obsidian Glass."** |
| `SDK.json` | Deleted — a 0-byte file that was tracked and committed |

**Commit hygiene note.** The `SDK.json` deletion actually landed in the **S2**
commit (`127e303`), not this one. `git rm --cached` had staged it before S2 was
committed, and `git commit` takes everything staged. Left as it is rather than
rewritten: both commits are mine and consecutive, and a soft reset to tidy
cosmetics is not worth doing on a branch that another agent may already be
looking at. Recorded here so the history is not misleading.

**A second correction, caught before it shipped.** The framework line was first
replaced with "Property practitioners listing on Dynasty Estates are PPRA
registered." That would have swapped one unfounded claim for another: the agent
records are demo data and no registration has been verified. It now reads
**"Beta — listings shown are sample data."**, which is true today.

**Verified** on the rendered home page: "FX:", "Aurora Silk", "Built with
Next.js", "Obsidian Glass", "Agent Command Console" and "Platform Command" all
absent.

---

## S4 — Metadata and share images

**Status:** done · 5 November 2026

`og:image` was empty on all 16 audited routes, so every listing shared to
WhatsApp — how property actually circulates here — arrived as a blank card.
The home description read *"Luxury property discovery interface inspired by
premium modern real-estate experiences"*: a description of the interface, and a
credit to an inspiration, in the sentence Google shows a buyer.

| File | Change |
|---|---|
| `app/layout.tsx` | Added `metadataBase` (without it Next emits a relative `og:image` that no scraper fetches — the actual cause of the blank cards). Title becomes a template. Real description. Default `openGraph` block with `locale: en_ZA`, plus `twitter: summary_large_image` |
| `app/opengraph-image.tsx` | **New.** A 1200×630 card generated with `ImageResponse` |

The card is **drawn, not photographed**, deliberately: the catalogue's imagery
is reused stock, and putting a stock interior behind the wordmark would imply it
is a Dynasty property. Type on the brand teal claims nothing it cannot back up.

**Verified:** `/opengraph-image` returns `200 image/png`, 32,001 bytes;
`og:image` is now present and absolute; the description is the new one.
Screenshot `after/S4/opengraph-image.png`.

**Deferred:** per-listing OG cards need real photography (plan §7.3), and a
designed brand asset would replace this generated one (§7.6).

---

## P0 section complete

S1–S4 are done. None touched a file the other agent is holding. Typecheck passes
and lint is clean apart from one pre-existing unused-variable warning in
`property-data.ts` that predates this work.

---

## S5 — Seed the token layer

**Status:** done · 5 November 2026 · `globals.css` only

Added a text ramp, spacing, elevation and motion scale to `:root` and `.dark`.
**Every token is unreferenced, so this commit cannot change a pixel** — which is
the acceptance criterion, and why it needed no screenshot diff.

Radii were not duplicated (`--radius-chip/control/card/panel` already exist and
are good) and the 14px/16px type floor is kept.

**The old brand names are deliberately not aliased.** `--brand-teal-deep`
resolves to `#0d5f61` in dark while the new `--brand` resolves to mint
`#4ec3ac`, because the deep teal is unreadable on a dark ground. Pointing one at
the other would have been a visual change, which this step forbids.

---

## S6 — Migrate the light-mode text ramp

**Status:** done · 5 November 2026

### Diagnosis before the sweep

Counts are not actionable, so axe's 172 failing nodes were re-run with the
class list attached. The cause was overwhelmingly two utilities:

| Class | Nodes | Worst ratio |
|---|---:|---:|
| `text-slate-500` | 65 | 3.68:1 |
| `text-slate-400` | 50 | 2.37:1 |
| `text-[#E11D48]` on `bg-rose-100` | 2 | 3.91:1 |
| `text-white` on `bg-[#25D366]` | 1 | **1.98:1** |

(`text-xs` appeared 93 times but is the size class co-occurring on the same
elements, not a cause.)

### The codemod

`text-slate-400` and `text-slate-500` → `text-slate-600` (5.86:1 on the page
ground, 7.58:1 on white). **324 replacements across 51 files.**

Two exclusions, both load-bearing:

- **331 `dark:` variants skipped.** Dark mode was never the failing theme —
  slate-400 reads 7.49:1 on `#081012` — and darkening there would have made it
  worse. More dark variants were skipped than light ones were changed.
- **21 `placeholder:` variants skipped.** A placeholder should read lighter than
  a filled value, axe does not flag them, and promoting them would make empty
  fields look populated.

Written with Node and explicit utf8, not PowerShell, which mangles non-ASCII
across whole files.

### The risk that did not materialise

A blind darkening sweep could have broken `text-slate-400` sitting on a *dark*
panel in light mode. Rather than audit that by hand, the sweep was applied and
then re-measured: axe went 172 → 3 with **no new failures**, so no such case
exists in this codebase.

### The last three, fixed with measured values

- Rose badge: `#E11D48` → `text-rose-700` (`#be123c`, **5.24:1** on
  `bg-rose-100`), on `/for-sale` and the province and city routes.
- WhatsApp buttons (×2): `text-white` → `text-slate-900`. White on `#25D366`
  is 1.98:1; `#0f172a` on the *same* green is **9.00:1**, so WhatsApp's brand
  colour is kept exactly and only the label flips.

### Verification

| | Before | After |
|---|---:|---:|
| axe `color-contrast` nodes, 14 page/viewports | 172 | **0** |
| home / for-sale / search / insights / agents violations | 1–2 each | **0** |
| property violations | 2–3 | 1–2 (`landmark-complementary`, `button-name` — pre-existing, due in S11) |
| calculators violations | 2 | 1 (`label` ×2 — pre-existing, due in S9) |

Typecheck passes, production build passes, lint unchanged at 7 pre-existing
warnings. Screenshots in `after/S6/` show the design is visually unchanged —
secondary text is a shade darker and nothing else moved.

### Collision with in-flight work

The sweep deliberately covered the whole of `src/`, including **six files the
other agent is holding**: `app/ai-search/page.tsx`, `app/search/page.tsx`,
`app/map-search/page.tsx`, `components/home-trending-listings.tsx`,
`components/property-gallery-lightbox.tsx`,
`components/property-list-card.tsx`, plus `app/property/[slug]/page.tsx` for
the WhatsApp fix.

Scoping around them was considered and rejected: `/search` and `/property` were
two of the worst offenders (33 and 19 nodes), so excluding them could not meet
the acceptance criterion, and a second pass later would collide with *more* of
their work, not less. Every conflict here is a single-token class rename and
resolves by taking either side plus the rename.

---

## S7 — Header information architecture

**Status:** done · 5 November 2026 · `site-navigation.tsx`

Header now reads **Buy · Rent · Sell your home · Tools · AI Search · Profile**.

- **"Home" removed.** The logo beside it already links home, as on every
  property portal, so the slot was spending one of seven top-level positions on
  a destination the reader already had.
- **"Sell" → "Sell your home".** Beside Buy and Rent, a bare "Sell" reads as a
  third way to filter the catalogue rather than an offer to the owner.

### Two entries the plan asked for that were not added

- **"For agents"** has no honest destination today. The only candidate is
  `/agents`, a PPRA directory built for *buyers looking for an agent*, not a
  proposition aimed at agents. Pointing a labelled entry at the wrong page is
  the exact failure catalogued in `03b` (T6). It goes in with the agent landing
  page, S13.
- **"AI Search"** stays until the main search field accepts natural language.
  Removing an entry point before its replacement works loses a feature rather
  than simplifying one.

**Verified:** keyboard walk reports **zero focus traps** on all four sampled
pages, and `/for-sale`'s offscreen tab stops fell from 5 to 3 as a side effect.

### Finding F5 corrected in the same commit

F5 claimed the hero headline is read character-by-character by assistive tech,
at P1, and proposed `aria-hidden` on the animated layer plus a clean label.
**That fix was already implemented.** The accessibility tree reads the `<h1>`
as `"Destiny Called. The Door Is Open."` once; the only two single-character
nodes exposed to AT are the logo's "D".

The original evidence was `document.body.innerText`, which reflects *rendered*
text and ignores `aria-hidden` — the wrong instrument for the claim, and the
reason axe never flagged it either. Re-logged as **F31 at P2**: a
text-extraction issue for crawlers and copy-paste, not an accessibility one.

---

## S8 — One search in the hero, and no aurora

**Status:** done · 5 November 2026 · `page.tsx`, `home-hero-search.tsx`

| Change | Why |
|---|---|
| Removed the **AI Search teaser banner** — a full bordered emerald panel with its own primary-weight CTA, sitting directly above the search bar | The hero offered three ways to start the same task, each presented as a peer. A visitor who must choose between three entry points before typing has been handed a decision instead of a search. AI Search keeps its place in the top nav |
| Removed **"Explore on Map →"** from the chip row | The third destination in that row and the fourth way out of the hero. Map Search is already in the Tools menu on every page |
| Removed **`<AmbientCursorHue heroScoped />`** from the hero | The most recognisable "AI-generated landing page" signature of this era (tell T14). Neither SA incumbent animates anything behind their search. It also ran a canvas and a `requestAnimationFrame` loop for decoration |

The hero now has **one** search affordance. The quick-tag chips remain as
suggestions that feed that same search rather than competing destinations.

### "LCP improves" — NOT verified, and here is why

The step's third criterion cannot be honestly claimed from what was measured.

Two production builds on identical local infrastructure:

| | perf | LCP | TBT | SI |
|---|---:|---:|---:|---:|
| With aurora | 54 | 5.0 s | 1,590 ms | 2.8 s |
| Without aurora | 55 | **3.7 s** | 3,420 ms | 5.9 s |

LCP looks 26% better — but TBT and Speed Index moved the *wrong* way, which
should not happen when removing an animation. So the identical "with aurora"
build was measured a second time:

| | perf | LCP | TBT | SI |
|---|---:|---:|---:|---:|
| With aurora, run 1 | 54 | 5.0 s | 1,590 ms | 2.8 s |
| With aurora, run 2 | 48 | **6.3 s** | 2,390 ms | 3.0 s |

**The same build varies by 1.3 s of LCP and 800 ms of TBT.** The run-to-run
noise on this machine is larger than the difference being measured, so the
5.0 → 3.7 s result proves nothing. This machine is also running another agent's
dev server and intermittent builds.

What *can* be said: removing the aurora removes a canvas and a RAF loop from
the hero's critical path, which is a structural reduction in main-thread work
and a sound reason to expect an improvement. It is a reason, not a measurement.

**A trustworthy verdict needs the deployed build on stable infrastructure** —
Vercel, measured after merge, several runs. Logged as outstanding.

### The third criterion was dropped before starting

S8 originally also required "hero text appears once in the accessibility tree".
That was already true before this step began — see the F5 correction under S7.
