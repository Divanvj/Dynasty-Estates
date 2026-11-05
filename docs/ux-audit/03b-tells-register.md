# 03b — "Machine-built" tells register

Read as a sceptical South African agent or buyer would: *does this feel like a
real product, built by a team that knows this market?*

Fix type: **code** · **copy** · **decision** (needs an owner call or a real asset).

Rule applied throughout: **remove and simplify first.** Nothing here is fixed by
adding decoration.

---

## 1. Leaked build artefacts

| # | Location | The tell | Why it undermines trust | Fix | Type |
|---|---|---|---|---|---|
| T1 | `ambient-cursor-hue.tsx:543` | A fixed readout bottom-right: **"FX: Aurora Silk"**, with modes "Magnetic Halo" and "Antigravity" | A visitor sees the developer's effects switcher. Nothing says "unfinished demo" louder than shipping the debug panel | Delete the readout and the mode switcher; keep one effect, chosen deliberately | code |
| T2 | `page.tsx:247` | Footer: **"Built with Next.js, TypeScript & Obsidian Glass."** | Portals advertise their listing counts and their PPRA status, never their framework. It reads like a template someone forgot to rewrite | Replace with the company line: entity, PPRA status, contact, POPIA | copy |
| T3 | all pages | Meta description: *"Luxury property discovery **interface inspired by** premium modern real-estate experiences"* | Describes the UI, not the service, and credits an inspiration. This is the text Google shows | Rewrite per page around what a buyer gets | copy |
| T4 | all 16 pages | **`og:image` is empty** | Every WhatsApp and Slack share renders a blank card. WhatsApp is how SA property gets shared | Add a default OG image, then per-listing images | code + decision (asset) |
| T5 | repo root | **`SDK.json`** — a 0-byte file, committed and tracked | Empty committed files say nobody is reading the diffs | Delete | code |
| T6 | `page.tsx:227`, `:239` | Public footer links to **"Agent Command Console"** and **"Platform Command & Moderation"** | Real portals do not advertise their admin console to the public. Invites probing and reads as a staging build | Remove from the public footer; reach them from the signed-in account menu | code |
| T7 | `billing.ts:45` | A paid tier sells a **"Featured Obsidian Glass glow badge"** | The internal design-system codename has reached a commercial product description. A paying agent cannot know what they bought | Rename to what the agent gets, e.g. "Featured placement" | copy |

---

## 2. Placeholder data presented as real

| # | Location | The tell | Why it undermines trust | Fix | Type |
|---|---|---|---|---|---|
| T8 | `insights/page.tsx:148`, `:155` | Badge **"Official Registrar of Deeds Records"**; byline **"Source: South African Deeds Office & PropTech Analytics"** — over the hardcoded `deedsRecordsByNode` literal at `:16` | Invented street-level transactions attributed to a named government registry. This is the single most damaging thing in the product: it is not a design flaw, it is a misrepresentation | Remove the badge and byline immediately. Mark the figures as illustrative or pull the section | code now, **decision** on a licensed feed |
| T9 | `insights/page.tsx:10–13` | `growth: "+7.8%"`, `avgPrice: "R 5.2M"`, `daysOnMarket: 38` — hardcoded, undated | Suspiciously tidy numbers with no period, no sample size, no "as at" date | Date-stamp and source every figure, or remove | code + decision |
| T10 | `collections.ts:62` | Seeded collaborator **`david@dynastyestates.co.za`** and a `votes` map | Invented social proof. A user who invites a colleague and finds a stranger already voting loses confidence instantly | Ship collections empty with a real empty state | code |
| T11 | property pages | **2 photos per listing**, reused across listings | SA buyers expect 15–30 photos. Two says the listing is not real | Enforce a photo minimum before publish | code + **decision** (real photography) |
| T12 | `/for-sale` | **10 listings** total; 4 of 9 provinces at "0 listings" but still clickable | Province links that lead nowhere make the catalogue feel staged | Disable zero-count provinces; add an alert signup | code |
| T13 | property page | "ON SHOW THIS WEEKEND · **Sunday, 14 Sep**" rendered on 5 November | A seven-week-old date under a "this weekend" label. Nothing erodes trust faster than a date the reader can check | Hide past dates; never label a past date "this weekend" | code |

---

## 3. Visual clichés

| # | Location | The tell | Why it undermines trust | Fix | Type |
|---|---|---|---|---|---|
| T14 | `hero-aurora.tsx`, `globals.css:439` | Animated **aurora gradient** hero backdrop with cursor parallax | The single most recognisable "AI-generated landing page" signature of this era. Property24 and Private Property both use a photograph or a flat colour | Replace with one good photograph or a flat brand surface | code + decision (asset) |
| T15 | `globals.css:344` "Obsidian Glass Design System" | **`backdrop-blur` on nearly every surface** — header, cards, panels, popups | When everything is glass, nothing is foreground. It also costs paint performance and makes contrast unpredictable, which is why F4 is systemic | Reserve translucency for overlays that genuinely sit above content | code |
| T16 | throughout | Uniform large radii and the same shadow on every card | Removes hierarchy: a primary CTA, a filter chip and a stat tile all read as the same object | Two radii and two elevations, applied by role | code |
| T17 | `property-split-map-view.tsx:132` | **Emoji mixed with the SVG icon set**: `🗺️ Map`, `☰ List (20)`, `👁️ Street View` | Emoji render differently per OS and clash with a bespoke icon set. Reads as a prototype shortcut | Use the existing icon components | code |
| T18 | home | Glowing emerald accents and `drop-shadow` on numerals (`insights/page.tsx:132`) | Glow on data makes figures feel decorative rather than factual | Remove glow from anything numeric | code |

---

## 4. Copy tells

| # | Location | The tell | Why it undermines trust | Fix | Type |
|---|---|---|---|---|---|
| T19 | `<title>` sitewide | **"Dynasty Estates \| Property Intelligence"** | "Intelligence" is the generic proptech buzzword. It tells a Joburg buyer nothing | "Property for sale and to rent in South Africa" | copy |
| T20 | `/for-sale` | "Explore verified residential **opportunities** across all 9 provinces" | "Opportunities" is investor-deck language. People buy homes | "Browse homes for sale in all nine provinces" | copy |
| T21 | everywhere | **An arrow on every link**: "Explore Gauteng homes →", "Browse National Rentals →", "Full Financial Hub →", "Compare with other homes →", "Add to Collection →" | When every link has an arrow, the arrow stops meaning anything and the page looks auto-generated | Arrows only where they signal a step forward in a flow | copy |
| T22 | property page | **"DYNASTY TRUE COST™"** | A trademark symbol on an invented in-house feature is a classic over-claim. SA buyers will not have heard of it | Drop the ™. Call it "What it really costs per month" | copy + decision |
| T23 | `/for-sale` | Eyebrow badge **"NATIONAL PROPERTY HUB"** in red, above an H1 that says much the same | A tagline above every heading is the house style of generated pages | Delete the eyebrow; let the H1 work | copy |
| T24 | `/agents`, `/for-sale` | **"PPRA certified practitioners"**, "Practitioners Directory", "Mandates" | Correct trade vocabulary, wrong audience. Buyers say "agent" | "Verified agents". Keep "PPRA" as the credential, not the noun | copy |

---

## 5. Inconsistency

| # | Location | The tell | Why it undermines trust | Fix | Type |
|---|---|---|---|---|---|
| T25 | property header | Four adjacent controls rendered at **38 / 38 / 38 / 34px with two type sizes** until a `.pill` class was applied (see `print-button.tsx` comment) | Rows that do not line up are the clearest signal that no one owns the component layer | Continue the `.pill` consolidation across chips, buttons and tabs | code |
| T26 | `/search` vs `/for-sale` | H1 is **18px/700** on `/search` and **48px/700** on `/for-sale` | The same role at wildly different sizes means there is no type scale, only per-page choices | One scale in tokens | code |
| T27 | `/calculators` | **2 form inputs with no label** (axe) | Unlabelled money inputs are where users abandon | Label every control | code |
| T28 | `/agents` | **Heading-order break** (axe) | Signals headings chosen for size, not structure | Fix the order | code |

---

## 6. Missing craft details

| # | Location | The tell | Why it undermines trust | Fix | Type |
|---|---|---|---|---|---|
| T29 | all prices | Prices are **not tabular-figure**, so digits shift between cards | Columns of prices that do not align look amateur in a product whose job is comparing prices | `font-variant-numeric: tabular-nums` on every price | code |
| T30 | `/map-search` | **12 of 13 images have no `alt`** | — | Add alts | code |
| T31 | property hero | Image **874×583 displayed at 1374×540** — upscaled, soft on desktop | Blurry hero photography on a luxury positioning is self-defeating. *Note this is the opposite of the suspected 3840px over-fetch; card images at 475px are correctly sized* | Serve a 2× hero source | code + decision (asset) |
| T32 | share targets | No per-listing OG image | A shared listing shows no photo, in a market that shares on WhatsApp | Generate OG images per listing | code |
| T33 | `/collections` | LCP **4.65 s** at 390 | The slowest page by far | Investigate | code |

---

## Where the competitors are plainer than us

Observed only, nothing copied.

- **Property24** and **Private Property** both open on a **photograph or flat
  colour** with one search field. No ambient animation, no glass, no gradient.
- Both use **tighter, denser type** and show more listings per screen.
- Both lead sellers with a **free valuation** — a concrete offer, not a
  proposition.
- Private Property puts the agent back-office on a **separate subdomain**
  (`admin.privateproperty.co.za`) rather than linking it from the public footer.
- Neither uses a trademark symbol on an in-house calculator.

They are also heavier, slower and have more sub-44px tap targets than Dynasty
(see `03-findings.md`). The lesson is restraint in *presentation*, not that they
are better engineered.

---

## Needs an owner decision — not to be faked

1. **Portal or brokerage?** Nothing on the site says which. It determines the
   seller funnel, the agent relationship and the Deeds-data question.
2. **Real photography.** Two reused stock images per listing cannot be fixed in
   code.
3. **A licensed market-data source**, or dropping `/insights` until there is one.
4. **Brand voice**, to replace "Intelligence", "opportunities", "curated".
5. **Whether "Dynasty True Cost" is a real trademark.** If not, drop the ™.
6. **A logo and OG image asset set.**
