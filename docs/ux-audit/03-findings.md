# 03 — Findings

Audit of **https://dynasty-estates.vercel.app** (deployed build), 5 November 2026.
47 page/viewport captures, 138 screenshots, axe-core on 11 page/viewports,
4 competitors benchmarked.

Severity: **P0** trust, legal or blocking. **P1** materially hurts a core task.
**P2** polish.

Labels: **OVERSIGHT** (nobody chose this) · **INTENTIONAL-TEMPORARY** (known
stand-in) · **DELIBERATE-FINAL** (a real decision, still worth judging).

---

## Method, and what it cannot tell you

Stated up front so no number here is read as more than it is.

- **Performance figures are a floor, not field data.** Single unthrottled run
  over a desktop connection from one location. No Lighthouse and no simulated
  slow 4G — **deferred, see "Not done"**. LCP/CLS come from
  `PerformanceObserver` in the page.
- **Contrast was measured twice and the first pass was wrong.** A
  computed-style walk reported ~36 failures per page at ratios near 1.01:1 on
  text that is plainly legible. Cause: the app authors colours in `oklch()`,
  Chrome serialises computed colour in its authored space, and the probe's
  regex read `oklch(0.7 0.1 180)` as `rgb(0.7, 0.1, 180)`. Rebuilt to resolve
  every colour through a 1×1 canvas. **The figures below are from the corrected
  pass, cross-checked against axe-core.**
- **The corrected pass still over-reports** where text sits on an
  absolutely-positioned backdrop that is not a DOM ancestor — the intent
  toggle's sliding pill, price text over a photo scrim. Those are excluded
  below and only flow-text failures are reported as confirmed. axe-core, which
  is pixel-aware, is the authority here.
- **Zillow blocked automated loads** on all three pages (16–18 requests,
  measurement script failed). No Zillow data. Redfin and Domain were out of the
  agreed scope.
- **Seller/agent pages were captured signed out**, so they show the role guard,
  not the working surface. The signed-in pass is **deferred**.

---

## Hypothesis verdicts

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| 1 | Three competing search paths; no location field | **SPLIT** | Three paths **confirmed**: `home-hero-search.tsx:65` "Try AI", `:74` search panel, `:81` "Popular in SA" chips, `:103` "Explore on Map". "No location field" **REFUTED** — `:75` placeholder is `"Search city or suburb..."` |
| 2 | Hero headline tripled in DOM | **SPLIT — the accessibility half is REFUTED** | The tripling is real in **rendered** text. It is **not** in the accessibility tree: `hero-headline.tsx` already sets `aria-hidden` on the animated layer and `aria-label` on the `<h1>`, so AT reads `"Destiny Called. The Door Is Open."` once. My original evidence was `innerText`, which ignores `aria-hidden` — the wrong instrument. Remains a P2 text-extraction issue (F31), not a P1 accessibility one. See F5 |
| 3 | "FX: Aurora Silk" visible to users | **CONFIRMED** P1 | `ambient-cursor-hue.tsx:543`; appears in page text at 1440 |
| 4 | Spotlight leads with a rental on a For-Sale page | **REFUTED** | `/for-sale` has no spotlight component and **no per-month prices at all**. The home spotlight shows "WATERKLOOF 02 / 05 … **R 6,950,000**" — a sale price, no "/month", no "• 12 Months" |
| 5 | 5 of 9 provinces show "0 listings" | **CONFIRMED, count corrected** P1 | It is **4 of 9**: Limpopo, Mpumalanga, North West, Northern Cape. Each remains a clickable "Explore … homes →". Screenshot `dynasty/for-sale/1440x900-atf.jpg` |
| 6 | Admin links in the public footer | **CONFIRMED** P1 | `page.tsx:227` "Agent Command Console" → `/agent/dashboard`; `page.tsx:239` "Platform Command & Moderation" → `/admin` |
| 7 | Jargon: Mandate, Practitioner, Command Console | **CONFIRMED** P1 | "Featured South African **Mandates** (10)" and "PPRA certified **practitioners**" on `/for-sale`; "Command Console" at `admin/page.tsx:105` and in the footer |
| 8 | Cards overloaded; type filters overlap | **MOSTLY REFUTED** | Four cards sampled on `/for-sale`: **16–21 words** each (not ~60), **1 price mention** (not two), **1 CTA — the linked title** (not two plus a title), **1–2 chips** (not up to 12). Cards are lean. Only the **type overlap stands**: House / Townhouse / Estate Home are separate labels. Caveat: `property-list-card.tsx` is in the other agent's in-flight set, so this may have been true recently |
| 9 | Listing page: repetition, "Printed …", stale date, 2 photos, reused stock | **SPLIT** | Stale date **CONFIRMED P0**: "ON SHOW THIS WEEKEND · **Sunday, 14 Sep**" shown on 5 Nov. Two photos **CONFIRMED** (thumbnail rail holds 2; the tab is labelled "Photos (2)"). "Printed 4 November 2026" on screen **REFUTED** — `.print-only` is `display:none` outside print and no "Printed" text appears in any captured page. Repetition **SPLIT**: the title appears **once**, not 3–4×; the **price appears 13 times** on the page, mostly as derived figures inside the True Cost block |
| 10 | Floor Plan / 3D Tour / Street View tabs may be empty | **PARTIAL** | Tabs are `Photos (2)`, `Floor Plan`, `3D Tour`, `🗺️ Street View & Map`. The **map is behind a tab — confirmed**. Only Photos carries a count; the other three give no indication of whether anything is inside. Whether they are empty is still **unverified**. The emoji in one tab label is itself a tell (T17) |
| 11 | Calculator has 9+ controls; four equal CTAs | **CONFIRMED, understated** | The True Cost block holds **29 controls** — steppers, range sliders, "−5% Offer / Asking Price / +5% Compete", deposit tiers "0% (100% Bond) / 10% / 15% / 20% / 30%". Contact CTAs are **exactly 4**: WhatsApp, Call, Schedule Private Viewing, Message Practitioner. `/calculators` separately shows 27 sub-44px controls and **2 unlabelled inputs** (axe) |
| 12 | Market stats unsourced; collections fake social proof | **CONFIRMED AND WORSE** P0 | See F1 below |
| 13 | Footer tech-stack text; placeholder meta | **CONFIRMED** P1 | `page.tsx:247` "Built with Next.js, TypeScript & Obsidian Glass."; home meta is "Luxury property discovery interface **inspired by** premium modern real-estate experiences"; **`og:image` empty on every page captured** |
| 14 | `/search` shows only "Loading search engine…" | **REFUTED** | `/search` renders the catalogue: "CATALOGUE • For Sale To Rent South African Rental Residences … 10 Available". No blank state observed at any of 5 viewports |
| 15 | Seller/agent value propositions missing | **CONFIRMED** P1 | Dynasty has no seller landing, no valuation hook, no pricing. Both SA incumbents do — see benchmark below |
| 16 | Competitors treat the map as core; Dynasty separates it | **CONFIRMED** | `/map-search` is a distinct route; the catalogue and the map never share a screen |

---

## P0 — trust, legal, blocking

### F1. Fabricated market data attributed to the SA Deeds Office
**Who:** buyers, sellers, agents · **OVERSIGHT** · `src/app/insights/page.tsx`

`/insights` presents hardcoded numbers under a badge reading **"Official
Registrar of Deeds Records"** (`insights/page.tsx:148`) and a byline **"Source:
South African Deeds Office & PropTech Analytics"** (`:155`).

The data behind it is a literal object in the same file: `deedsRecordsByNode`
(`:16`) holds invented street names, prices, dates and rand-per-m² figures, and
the regional table (`:10–13`) hardcodes `growth: "+7.8%"`, `avgPrice: "R 5.2M"`,
`daysOnMarket: 38`. Nothing is fetched and nothing is dated.

This is not an unsourced statistic. It is invented property-transaction data
presented as official records of a named government registry, on a site that
also solicits seller mandates. That is a consumer-protection and
misrepresentation exposure well beyond UX.

**Fix:** remove the Deeds Office badge and byline now. Either label the figures
as illustrative with a visible "sample data" treatment, or remove the section
until a real feed exists. **Needs an owner decision** on whether a licensed data
source will be bought.

### F2. Stale on-show date presented as "this weekend"
**Who:** buyers · **OVERSIGHT** · property page

`/property/oak-terrace` shows **"ON SHOW THIS WEEKEND · Sunday, 14 Sep ·
14:00 – 17:00"** on 5 November — a date seven weeks past, with a calendar CTA
and a "Directions" link beside it. A buyer who acts on this drives to a house
on a day with no show. Screenshot `dynasty/property/1440x900-atf.jpg`.

**Fix:** hide the banner when the date is in the past; never render a past date
under a "this weekend" label.

### F3. Seller and agent flows have the worst layout stability on the site
**Who:** sellers, agents · **OVERSIGHT**

| Page | Viewport | CLS |
|---|---|---:|
| `/seller/listings/new` | 390×844 | **3.073** |
| `/agent/dashboard` | 1440×900 | **0.545** |
| `/seller/listings/new` | 1440×900 | **0.414** |
| `/map-search` | 360×800 | 0.125 |

Google treats anything above 0.25 as poor. 3.073 means the page re-lays-out
roughly three screen-heights' worth while the seller watches. These were
captured **signed out**, so this is the guard screen shifting — the signed-in
flows may be worse or better and have not been measured.

**Fix:** reserve space for the auth-dependent branch so the guard and the real
content occupy the same box.

---

## P1 — materially hurts a core task

### F4. Colour contrast fails across every page
**Who:** everyone · **OVERSIGHT**

axe-core, which is pixel-aware, reports `color-contrast` as a serious violation
on **every page tested**:

| Page | 390×844 | 1440×900 |
|---|---:|---:|
| home | 13 nodes | 14 |
| for-sale | 22 | 23 |
| search | 11 | 33 |
| property | 15 | 19 |
| insights | — | 5 |
| agents | — | 4 |
| calculators | — | 3 |

Confirmed flow-text pairs from the corrected sweep:

| Ratio | Needs | Text | On | Size | Where |
|---:|---:|---|---|---|---|
| **2.57:1** | 4.5 | `#90a1b9` (slate-400) | `#fcfdfc` | 14px | insights, "5-Year Capital Appreciation" |
| **4.15:1** | 4.5 | `#62748e` (slate-500) | `#ecf0f0` | 14px | agents, calculators section labels |

The pattern is `text-slate-400` and `text-slate-500` used for captions and
secondary labels on light surfaces. It is systemic, not local, so it belongs in
the token work rather than page-by-page patching.

### F5. ~~The hero headline is read character-by-character~~ — **REFUTED**

**Corrected 5 November 2026, while starting S8.**

This was wrong, and it was wrong because of the instrument. The evidence was
`document.body.innerText`, which reflects **rendered** text and ignores
`aria-hidden` — the wrong tool for a claim about assistive technology.

Chrome's accessibility tree says the opposite:

```
h1 aria-label : "Destiny Called. The Door Is Open."
h1 innerText  : "Destiny Called. The Door Is Open. D D D e e e s s s t t t ..."
single-character nodes exposed to AT: 2   (both the logo's "D", not the headline)
```

`hero-headline.tsx` already sets `aria-hidden="true"` on the animated layer and
puts `aria-label` with the clean text on the `<h1>` — precisely the fix this
finding proposed. It was already implemented, which is also why axe never
flagged it.

**What remains, at much lower severity:** the triplicated characters are still
in the rendered text, so they reach anything reading rendered text rather than
the accessibility tree. Logged as F31 below.

### F31. The hero headline's rendered text is triplicated
**Who:** search indexing, anyone copying the headline · **P2** ·
**DELIBERATE-FINAL** — the three layers draw the glass effect
(`hh-c__rim`, `hh-c__fill`, `hh-c__spec`)

Not an accessibility defect (see F5). It is a text-extraction one: a crawler
reading the `<h1>`, or a visitor selecting it to paste, gets the headline
followed by every character three times. Worth weighing against the visual
treatment, not worth breaking the treatment for.

### F6. Twelve of thirteen images on `/map-search` have no alt text
**Who:** screen-reader users, SEO · **OVERSIGHT**

Every other page returns 0 missing alts; `/map-search` returns 12.

### F7. No `og:image` anywhere, and the meta description is a design brief
**Who:** anyone receiving a shared link · **OVERSIGHT**

`og:image` was empty on all 16 pages captured. The home description reads
"Luxury property discovery interface **inspired by** premium modern real-estate
experiences" — it describes the interface, and credits an inspiration, rather
than telling a South African buyer what the site does.

### F8. Admin surfaces advertised in the public footer
**Who:** everyone · **OVERSIGHT** · `page.tsx:227`, `:239`

"Agent Command Console" and "Platform Command & Moderation" sit in the footer
of every page, for signed-out visitors. The routes are guarded, so this is not
a breach — it is a credibility problem and an invitation to probe.

### F9. Four of nine province links are dead ends
**Who:** buyers · **INTENTIONAL-TEMPORARY** (catalogue is small) · `/for-sale`

Limpopo, Mpumalanga, North West and Northern Cape each show "0 listings" and
remain clickable. Total catalogue is 10 listings.

**Fix:** keep the province grid, but make a zero-count province non-clickable
with a "Tell me when something lists here" action.

### F10. Industry jargon on buyer-facing pages
**Who:** buyers · **DELIBERATE-FINAL**, and wrong for the audience

"Featured South African **Mandates** (10)" is a seller-side term on a buyer
browse page. "PPRA certified practitioners" where "verified agents" would do.
"Command Console" for a dashboard. `billing.ts:45` sells a "Featured **Obsidian
Glass** glow badge" — the internal design-system name has reached a paid tier.

### F11. No seller or agency proposition at all
**Who:** sellers, agencies · **needs owner decision**

Benchmark, read from the competitors' own navigation:

| | Property24 | Private Property | Dynasty |
|---|---|---|---|
| Sell entry | "Sell Your Property" → `/private-listing/sell-my-property` | "List as an Agent" → `/list-your-property/list-as-an-agent.htm` | "Sell" dropdown only |
| Valuation hook | "Get a Free Property Valuation" | — | none |
| Seller guide | `/property101/sellers-guide/…` | `/advice/property/articles/seller-guide/7384` | none |
| Agent directory | `/estate-agencies` | — | `/agents` |
| Agent reviews | `/agent-reviews-marketing` | — | none |
| Agent back-office | — | `admin.privateproperty.co.za` (separate subdomain) | in-app `/agent/dashboard` |

Both incumbents lead sellers with a free valuation. Dynasty offers no pricing,
no steps, no valuation, and does not say whether it is a portal or a brokerage.

### F12. `/collections` is slow
**Who:** buyers · **OVERSIGHT** — LCP **4652 ms** at 390×844, 4280 ms at 1440.
The slowest page on the site by a wide margin; everything else is under 3.2 s.

---

## P2 — polish

| | Finding | Evidence |
|---|---|---|
| F13 | Property hero image is **upscaled** — 874×583 natural shown at 1374×540 (0.6×), soft on desktop and worse on 2× displays. **This refutes the "cards request 3840px variants" claim**: card images are 475px natural against ~440px display, which is correct | capture data |
| F14 | A broken image on home returns `naturalWidth 0×0` | capture data |
| F15 | `/ai-search` scrolls sideways by **8px** at 390 | capture data |
| F16 | `SDK.json`, an empty 0-byte file, is committed to the repo | `git ls-files` |
| F17 | axe: `button-name` (property, 1440) — a control with no accessible name | axe.json |
| F18 | axe: 2 unlabelled form inputs on `/calculators` | axe.json |
| F19 | axe: `heading-order` break on `/agents` | axe.json |
| F20 | axe: `landmark-complementary-is-top-level` on property | axe.json |
| F21 | Avatar images fetch 96×96 to display 38×38 (2.5×) | capture data |

---

## F30 — Mobile performance is poor, and low weight is hiding it · **P0** · everyone

Lighthouse, simulated slow 4G, mobile form factor:

| Page | Performance | LCP | TBT | Speed Index | Weight |
|---|---:|---:|---:|---:|---:|
| home | **44** | **9.5 s** | 650 ms | 6.2 s | 1,422 KiB |
| search | **44** | **8.6 s** | **2,830 ms** | 3.8 s | 1,048 KiB |
| property | 63 | 4.6 s | 850 ms | 2.6 s | 1,112 KiB |

**This corrects the unthrottled reading earlier in this document.** On a desktop
connection LCP measured 1.0–2.4 s and I described Dynasty as lighter *and*
faster than its competitors. Lighter is true. Faster is not: on a throttled
mobile connection the home page takes **9.5 seconds** to render its largest
element, against a 2.5 s "good" threshold, and `/search` blocks the main thread
for **2.8 seconds**.

The diagnosis follows from the two figures together. At roughly 1 MB these
pages are not heavy — the delay is not bytes on the wire, it is **JavaScript
execution and client-side rendering**. `/search` renders its catalogue on the
client, which is exactly where the 2,830 ms of blocking comes from. CLS is 0 on
all three, so nothing is janking; it is simply late.

This matters more here than elsewhere: South African mobile data is expensive
and 4G coverage is uneven, and the catalogue is the product.

Lighthouse scores accessibility 96 on all three pages. That does not contradict
F4 — Lighthouse samples a subset and weights contrast lightly, while axe-core
reports contrast violations on every page.

---

## What Dynasty already does better than the incumbents

Worth stating, because the brief asks for objectivity and the benchmark did not
go the way the hypotheses assumed. Read this as **weight and stability only** —
F30 above shows delivered mobile speed is a separate and worse story.

| Metric | Dynasty | Property24 | Private Property | Rightmove |
|---|---:|---:|---:|---:|
| Search page weight (1440) | **1.25 MB** | 4.19 MB | 4.68 MB | 13.77 MB |
| Search requests (1440) | **55** | 132 | 113 | 304 |
| Search LCP (1440) | **1.64 s** | 2.30 s | 0.99 s | 2.35 s |
| Search CLS (1440) | **0.000** | 0.006 | 0.016 | 0.308 |
| Sub-44px targets, home 1440 | 97 | 108 | 92 | 108 |

Dynasty ships three to ten times fewer bytes than every competitor measured,
with near-zero layout shift on its browse pages. The tap-target problem is real
but it is an industry-wide failing, not a Dynasty outlier — which affects how it
should be prioritised.

The competitors were measured unthrottled too, so these columns are
like-for-like. What is **not** established is how they compare under
throttling; only Dynasty was put through Lighthouse. Given their weight they
are unlikely to do better, but that is an assumption, not a measurement.

Property24's mobile home page also scrolls sideways by **850px** at 390.

---

## Gap-closing pass

Run after the first summary, at your instruction. Everything below is new
evidence.

### Signed-in seller and agent — a different build

Credentials may only be entered against a local development host, and
`dynasty-estates.vercel.app` is not a labelled test environment. So this pass
ran against **`localhost:3100`, a clean worktree at commit `3560c33`** — an
isolated server, deliberately not the other agent's instance on port 3000,
which carries ten uncommitted files. **These captures are a different build
from the Vercel baseline and their performance numbers are not comparable.**
Screenshots: `screenshots/dynasty-seller/`, `screenshots/dynasty-agent/`.

**Role gating works.** Signed in as Seller, `/agent/dashboard` correctly shows
the restricted view. Signed in as Agent, it renders.

#### F22 — Test fixtures appear in a seller's own portfolio · **P0** · sellers
The seller portal lists **"Automation Test Listing - Rosebank" twice**, both
marked SUBMITTED at R 24,500 / month, under the heading "Your listings". A real
seller signing in sees automation fixtures presented as their own property.
Screenshot `dynasty-seller/seller-portal/1440x900-atf.jpg`.

#### F23 — The seller portal's own counters contradict the page · **P1** · sellers
Directly above those two listings: **Active listings 0 · Drafts 0 · Property
views 0**. The three headline numbers disagree with the list beneath them.

#### F24 — "Next steps" is decoration, not a checklist · **P1** · sellers
The portal shows a numbered four-step checklist — Upload media, Refine pricing,
Set visibility, Review leads — but the whole page holds only **6 focusable
controls at 1440** (logo, three nav links, Publish listing, Manage). None of the
four steps is actionable. A checklist that cannot be ticked or followed is
worse than no checklist.

#### F25 — The agent dashboard badges zeroes as "LIVE DATA" · **P1** · agents
`NEW LEADS 0 · ACTIVE LISTINGS 0 · TOUR BOOKINGS 1 · PROPERTY VIEWS 0`, each
under a **"LIVE DATA"** label. Asserting liveness over an empty dashboard reads
as a placeholder dressed up as a feature. 6 controls at 1440.

#### F26 — The listing wizard scrolls sideways on a phone · **P2** · sellers
`/seller/listings/new` overflows horizontally by **6px at 390** for both roles.

#### F27 — Navigation changes identity inside the portal · **P2**
Public pages show Home / Buy / Rent / Sell / Tools / AI Search / Profile. The
seller portal shows **Home / Search / Seller portal**; the property page shows
Search Catalogue / Print / Share / Save / Collection. Three different header
vocabularies in one product.

### Keyboard-only walkthrough

40 Tab stops sampled per page, real key events.

| Page | Stops | No focus ring | Focus lands offscreen | Trap |
|---|---:|---:|---:|---|
| `/` | 40 | 1 | 0 | none |
| `/for-sale` | 40 | 0 | **5** | none |
| `/property/oak-terrace` | 40 | **3** | 1 | none |
| `/search` | 40 | 1 | 0 | none |

**No focus traps anywhere, and tab order follows reading order** — genuinely
good, and worth saying.

#### F28 — A non-interactive `<div>` is in the tab order · **P2** · property page
Tab stop 7 is `DIV: "02 / 02For SaleOn Show"` — the gallery overlay. It takes a
stop and does nothing.

#### F29 — `/for-sale` tabs through five offscreen elements · **P2**
Keyboard users hit five stops they cannot see.

### Corrections to the earlier verdict table

Hypotheses **4** and **8** are now **refuted**, **10** and **11** resolved, and
**9**'s repetition claim split. See the table above — four of the sixteen
original hypotheses did not survive contact with the rendered product.

---

## Still not done

1. **Screen-reader pass with an actual reader.** The keyboard walk covers focus;
   it does not cover announcement quality. F5 (the tripled headline) was found
   by reading the accessibility text, not by listening.
1b. **Competitors under throttling.** Only Dynasty was run through Lighthouse,
   so the weight comparison is like-for-like but the speed comparison is not.
2. **Whether the Floor Plan / 3D Tour tabs are empty** (hypothesis 10's
   remaining half).
3. **Zillow**, blocked on all three pages. **Redfin and Domain**, outside the
   agreed scope — Redfin matters for hypothesis 16's map-as-core pattern.
4. **Colour inventory caveat:** the hex values in `01-dynasty-baseline.md` came
   from the same naive parser that corrupted the first contrast pass, so any
   oklch-authored colour there is unreliable. The contrast table in this
   document is from the corrected canvas-based pass and is sound.
5. **Admin role** not audited; only Buyer-equivalent, Seller and Agent.
