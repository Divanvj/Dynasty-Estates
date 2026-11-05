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
