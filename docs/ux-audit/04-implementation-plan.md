# 04 — Implementation plan

Derived from `03-findings.md` and `03b-tells-register.md`. UI/UX only: no
business logic, data models, API behaviour or route changes except where a UX
bug requires it (the stale on-show date, the Deeds Office attribution).

**Not started. Awaiting written approval.**

---

## 1. Design direction

### What to keep

The audit found real craft already in place. None of this should be redone.

- **The radius scale is already consolidated** — `--radius-chip: 10px`,
  `--radius-control: 20px`, `--radius-card: 26px`, `--radius-panel: 32px`, each
  carrying a comment recording the values it replaced. Keep as-is.
- **The type floor is set** — `--text-xs: 14px`, `--text-sm: 16px`. Keep.
- **Brand teal `#0b4d4e`** measures 7.43:1 on the page background and 9.61:1 on
  white. It is a genuinely good brand colour that already passes AA. Keep it and
  lean on it harder.
- **`--foreground: #0f172a`** at 13.81:1 on page. Keep.
- **Near-zero CLS on browse pages** and **no keyboard focus traps anywhere**.
  Protect both with acceptance criteria.

### The colour problem, measured

Every ratio below is computed, not estimated.

| Token use | Current | On page `#dce4e3` | On white | Verdict |
|---|---|---:|---:|---|
| Primary text | `#0f172a` | 13.81 | 17.85 | keep |
| **Muted text** | `#62748e` slate-500 | **3.69** | 4.76 | **fails body on page** |
| **Caption text** | `#90a1b9` slate-400 | **2.04** | 2.63 | **fails everywhere** |
| **Accent as text** | `#10b981` emerald | **1.96** | 2.54 | **fails as text** |
| **Badge as text** | `#c5a059` champagne | **1.90** | 2.46 | **fails as text** |
| Brand | `#0b4d4e` | 7.43 | 9.61 | keep |

In **dark** mode the same slates are fine (`#94a3b8` = 7.49:1 on `#081012`).
The failures cluster in light mode — which is now the default — because the
light ramp was never re-derived after the theme default changed.

### Proposed token additions

Names drop the "obsidian" codename, which has leaked into a paid product tier
(`billing.ts:45`). Existing variables stay as aliases for one release so nothing
breaks mid-migration.

```css
:root {
  /* Text ramp — light. Every value AA on both --bg and --surface. */
  --ink:          #0f172a;  /* 13.81 / 17.85 */
  --ink-muted:    #475569;  /*  5.86 /  7.58  — replaces slate-500 */
  --ink-subtle:   #475569;  /* collapsed: there is no AA-safe third step
                               on this page colour, so captions use muted */
  --ink-inverse:  #ffffff;

  /* Brand */
  --brand:        #0b4d4e;  /* 7.43 on page; white on it = 9.61 */
  --brand-hover:  #07393a;
  --brand-quiet:  #e6f2f0;

  /* Semantic — these are NOT the accent */
  --good:         #047857;  /* 5.48 on white; large-only on page */
  --warn:         #8a6d2f;  /* champagne, darkened to reach 4.87 on white */
  --danger:       #9f1239;

  /* Spacing — 4px base, the one scale the project lacks */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;

  /* Elevation — two levels, applied by role, not by default */
  --shadow-raised:  0 1px 2px rgb(15 23 42 / .06), 0 8px 24px -12px rgb(15 23 42 / .18);
  --shadow-overlay: 0 2px 8px rgb(15 23 42 / .10), 0 24px 48px -16px rgb(15 23 42 / .28);

  /* Motion */
  --motion-fast: 120ms; --motion-base: 200ms; --motion-slow: 320ms;
  --ease-out: cubic-bezier(.2,.8,.2,1);
}
```

**Rules that go with the tokens:**

1. `#10b981` and `#c5a059` become **fill and border colours only**. Never text.
   Where they currently carry text, the text takes `--ink` or `--ink-inverse`.
2. **Two elevation levels, applied by role.** Today a filter chip, a stat tile
   and a primary CTA all carry the same shadow and radius, which is why nothing
   reads as primary (T16).
3. **Translucency is for overlays that genuinely sit above content** — menus,
   modals, map popups. Not headers, not cards, not stat tiles (T15). This also
   makes contrast computable, which it currently is not on much of the site.
4. **Motion is opt-in.** One entrance per view, honouring
   `prefers-reduced-motion`, which `globals.css` already has a block for.

### What to remove rather than restyle

The brief's rule is remove-and-simplify first: the aurora backdrop (T14), the
FX switcher (T1), glow on numerals (T18), emoji in tab labels (T17).

---

## 2. Information architecture

### Header — three audiences, named

Current: `Home · Buy · Rent · Sell ⌄ · Tools ⌄ · AI Search ✦ · Profile ⌄`

Proposed: `Buy · Rent · Sell your home · For agents · Tools ⌄ · [Search] · Profile ⌄`

| Change | Why |
|---|---|
| Drop "Home" | The logo already goes home; it is a wasted slot of the seven |
| "Sell" → **"Sell your home"** | A verb plus an object. "Sell" alone reads as a category filter beside Buy and Rent |
| Add **"For agents"** | Agents and agencies currently have no entry point at all (F11). Both SA incumbents have one |
| "AI Search ✦" → fold into search | The sparkle and the separate route are one of three competing search paths (H1). One search field, with natural-language accepted |
| Keep "Tools" | It is well populated and tested fine for keyboard |

### Footer

Remove "Agent Command Console" and "Platform Command & Moderation" (F8) and the
tech-stack line (T2). Replace with: company entity, PPRA registration status,
contact, POPIA/privacy, and the browse hubs.

### Mobile nav

Keep the five-item bar. It already sizes correctly and survived the 320px fix.

### Jargon replacements

| Now | Proposed | Where |
|---|---|---|
| Mandates | Listings | `/for-sale` heading |
| Practitioner / PPRA certified practitioners | Agent / PPRA-registered agents | `/agents`, property page |
| Command Console | Dashboard | `/admin`, `/agent/dashboard`, footer |
| Property Experience | *(delete)* | marketing copy |
| Featured Obsidian Glass glow badge | Featured placement | `billing.ts:45` |
| Dynasty True Cost™ | What it really costs | property page |

---

## 3. Page-by-page specs

### Home
Remove the aurora backdrop and the FX readout. One search block: location field
(already present and correctly labelled "Search city or suburb…"), Buy/Rent
toggle, Search. Quick-tag chips stay but drop below the fold. Hero headline
renders once in the DOM with `aria-hidden` on the animated layer.
**States:** no loading state needed; it is server-rendered.

### Search / results
Keep the catalogue. Add a results-count line and a real empty state ("No homes
match these filters" + the filters that are active + a clear-all). Add skeleton
rows while the client fetch resolves — this is also where the 2,830 ms of
blocking shows up.

### Listing card
Already lean (H8 refuted). Only change: collapse the overlapping type labels
(House / Townhouse / Estate Home / Villa) into one taxonomy, and give prices
`font-variant-numeric: tabular-nums` so columns align (T29).

### Listing page
Hide the on-show banner when the date is past (F2). Surface title, price and
address **above the fold** — at 1440 the first screen is currently a photograph
and a toolbar with no identifying information. Reduce four equal contact CTAs
to one primary (Enquire) plus a secondary row. Collapse the True Cost block's
29 controls behind a result-first summary: show the monthly figure, then
"Adjust assumptions". Remove the `<div>` from the tab order (F28).

### Agents directory
Rename to plain language. Fix the heading-order break. Add agency affiliation
and a contact route.

### Seller landing — new page
The one genuinely new surface. Valuation hook, three steps, what it costs,
what Dynasty does vs what the agent does. Both incumbents lead here; Dynasty
has nothing.

### Seller portal
Remove test fixtures from the listing query (F22). Make the counters agree with
the list beneath them (F23). Make "Next steps" either actionable or delete it
(F24).

### Agent dashboard
Drop "LIVE DATA" badges from zeroes (F25); use a real empty state that says what
will appear and how to get there.

### Insights
Remove the Deeds Office badge and byline. Either mark the figures illustrative
or remove the section pending a real source.

### Collections
Remove the seeded collaborator and votes (T10). Ship an empty state.

### Calculators
Label the two unlabelled inputs (F18).

---

## 4. Step list

Each step is independently shippable and independently revertible.

| # | Goal | Files | Acceptance | Test | Risk | Rollback |
|---|---|---|---|---|---|---|
| **S1** | Remove the Deeds Office attribution | `app/insights/page.tsx` | No "Deeds Office", "Registrar" or "Official" string anywhere; figures either removed or visibly marked illustrative | grep + screenshot | None | revert commit |
| **S2** | Hide past on-show dates | `components/on-show-banner.tsx` | Banner absent when date < today; unit check on a past and a future date | manual + screenshot | Low | revert |
| **S3** | Strip build artefacts | `components/ambient-cursor-hue.tsx`, `app/page.tsx`, `SDK.json` | No "FX:" readout; no tech-stack line; no admin links in footer; `SDK.json` deleted | grep + 1440 screenshot | None | revert |
| **S4** | Fix metadata and OG | `app/layout.tsx`, per-route metadata | Every audited route has a non-placeholder description and a non-empty `og:image` | re-run capture harness, assert `ogImage` non-null | Low | revert |
| **S5** | Seed the token layer | `app/globals.css` | New tokens exist; old names alias to them; no visual diff yet | build + screenshot diff at 5 viewports | Low | revert |
| **S6** | Migrate the text ramp | `globals.css` + codemod across `src/` | **axe reports 0 `color-contrast` violations** on the 7 audited page/viewports | axe-core re-run | **Medium** — touches many files | revert; steps are separable per page |
| **S7** | Header and footer IA | `components/site-navigation.tsx`, `app/page.tsx` | Header shows Buy / Rent / Sell your home / For agents / Tools / Search / Profile; keyboard walk still reports 0 traps | keyboard harness + axe | Medium | revert |
| **S8** | Home: one search, no aurora | `app/page.tsx`, `home-hero-search.tsx`, `hero-aurora.tsx` | Exactly one primary search; hero text appears **once** in the accessibility tree; LCP improves | capture harness; assert no tripled text | Medium | revert |
| **S9** | Search states | `app/search/page.tsx` | Skeletons during fetch; empty state names the active filters; result count present | manual + screenshot | Medium | revert |
| **S10** | Card polish | `property-list-card.tsx` | One type taxonomy; `tabular-nums` on prices | screenshot at 390/1440 | Low | revert |
| **S11** | Listing page | `app/property/[slug]/page.tsx`, `property-media-tabs.tsx` | Title+price+address above the fold at 1440; one primary CTA; True Cost result-first; no `<div>` in tab order | keyboard harness + screenshot | **High** — busiest file | revert |
| **S12** | Seller portal truth | `app/seller/portal/page.tsx` | No "Automation Test" listings; counters equal the list; checklist actionable or gone | signed-in capture on localhost | Medium | revert |
| **S13** | Seller landing page | new `app/sell/page.tsx` | Valuation hook, steps, pricing; linked from header | screenshot + link check | Low (additive) | delete route |
| **S14** | Agent dashboard empty states | `app/agent/dashboard/page.tsx` | No "LIVE DATA" on a zero; real empty state | signed-in capture | Low | revert |
| **S15** | Mobile performance | `app/search/page.tsx`, dynamic imports | **Lighthouse mobile: home LCP ≤ 4 s, search TBT ≤ 1,200 ms**, perf score ≥ 70 | Lighthouse re-run | **High** | revert |

---

## 5. Order of work

1. **P0 hygiene and trust** — S1, S2, S3, S4. Small, low-risk, and they remove
   the things that would most damage a demo.
2. **Tokens** — S5, S6. S6 is the single highest-value accessibility fix.
3. **Nav and home** — S7, S8.
4. **Cards and search** — S9, S10.
5. **Listing page** — S11.
6. **Seller and agent funnels** — S12, S13, S14.
7. **Performance** — S15 last, because S8/S9/S11 all change what is on the page.

---

## 6. Sequencing against in-progress work

The other agent currently holds these files uncommitted:

```
package.json
src/app/ai-search/page.tsx
src/app/property/[slug]/page.tsx
src/app/search/page.tsx
src/components/home-trending-listings.tsx
src/components/property-gallery-lightbox.tsx
src/components/property-hero-gallery.tsx
src/components/property-list-card.tsx
src/components/property-media-tabs.tsx
src/components/seo-structured-data.tsx
```

**Collision map:**

| Step | Touches their files | Action |
|---|---|---|
| S1–S5, S7, S12, S13, S14 | **No** | Safe to start immediately |
| S6 (text ramp codemod) | Yes — sweeps all of `src/` | Run it **after** they land, or scope it to files they do not hold |
| S8 (home) | `home-trending-listings.tsx` only | Coordinate, or scope to `page.tsx` + hero |
| S9 (search) | `app/search/page.tsx` | **Wait** |
| S10 (card) | `property-list-card.tsx` | **Wait** |
| S11 (listing page) | 4 of their files | **Wait** — highest collision risk on the site |

**Proposed order given the collisions:** S1 → S2 → S3 → S4 → S5 → S7 → S13 →
S12 → S14, then re-check what they still hold before S6, S8, S9, S10, S11, S15.
That front-loads nine steps with zero collision risk.

Branching is also unresolved: this checkout is shared and I have not created
`ux/audit-overhaul`. Phase 3 needs either their sign-off to branch, or a
worktree of my own.

---

## 7. Out of scope / needs a decision from you

1. **Portal or brokerage?** Determines the seller funnel, the agent
   relationship, and whether Dynasty should hold Deeds data at all. Blocks S13.
2. **A licensed market-data source**, or `/insights` stays illustrative. Blocks
   the full version of S1.
3. **Real photography.** Two reused stock images per listing is not fixable in
   code. Also blocks the "upscaled hero" fix (F13) — a 2× source has to exist.
4. **Brand voice**, to replace "Intelligence", "opportunities", "curated".
5. **Is "Dynasty True Cost" a registered trademark?** If not, the ™ comes off.
6. **Logo and OG image assets.** Blocks the complete version of S4.
7. **Does the catalogue grow before launch?** Four of nine provinces showing
   "0 listings" is a content problem; the UX fix (disable + notify) is a
   workaround.
8. **Still-unmeasured:** a real screen-reader pass, whether the Floor Plan and
   3D Tour tabs have content, competitors under throttling, and the Admin role.
