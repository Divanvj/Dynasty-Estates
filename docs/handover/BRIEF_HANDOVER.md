# Handover: Dynasty Estates Market Intelligence & Monetisation Brief

**For:** the Claude agent on the other machine
**From:** Claude session on alet-'s Windows box, 2026-11-10
**File:** `docs/handover/Dynasty_Estates_Market_Intelligence_Brief.html`
(331,205 bytes · SHA-256 `89B1C656586DB3F74C68D152A786AC7F8CA8A7CF710E8ED112BC58280333F19D`)

Open it in a browser. It is a single self-contained HTML page — no build step, no server, no network calls. Verified: zero `fetch`/`XMLHttpRequest`/`eval`/`WebSocket`/`localStorage`/`document.cookie`. The only outbound references are a Google Fonts stylesheet and ordinary outbound links to the 17 agency websites it lists. 5 inline base64 images. One 56 KB inline script: a hand-rolled SVG chart engine plus the interactive models.

## What it is

A 15-section internal strategy brief dated **18 October 2026**, built from a 19-page research paper
("Dynasty Estates: South African Property Portal, Monetisation and Real-Estate Intelligence Research").
It is a **business/pricing document, not a spec.** Its own footer: *"All financial figures are illustrative planning estimates."*

Headline claims:

| Figure | What it is |
| --- | --- |
| ~R28.7m/mo | Property24 modelled listing revenue (range R15m–R55m) — a bottom-up model, **not disclosed revenue** |
| ~R10.0m/mo | Private Property, same basis (range R5m–R20m) |
| R38.6m/mo (~R463m/yr) | Combined incumbent listing-revenue pool |
| 7.33m vs 2.37m | Monthly visits, Semrush Aug 2026 — roughly 3:1 |
| R1.09m/mo | Dynasty at 1,000 paying customers, base mix (R1,094 blended per payer) |

Sections: 01 Summary · 02 Market · 03 Payers · 04 Agency prospects (17 named) · 05 Gap analysis
· 06 Product edge · 07 Pricing benchmark · 08 Monetisation · 09 Revenue scenarios · 10 Scale benchmarks
· 11 Growth projection · 12 Roadmap · 13 Risks & next steps · 14 Sources.
Sections 03, 09, 10 and 11 have live editable models (sliders recalculate everything downstream).

## The parts that touch the codebase

The brief proposes a product surface. **Almost none of it exists in `src/` today** — treat every row below as a proposal, not a feature to find:

- **Published pricing tiers:** Discovery R0 (3 listings) · Solo R399 (10) · Growth R1,299 (50) · Professional R2,999 (150) · Enterprise custom.
- **Private seller packages:** Flash R149 (7d) · Flex R349 (30d) · Plus R699 (90d) · Max R1,199 (180d), plus R99/+7d and R199/+30d extensions. All excl. VAT. Short durations are the deliberate wedge against incumbent 6-month-only packages.
- **Promotions:** 24h Pulse Boost R29–R49 · 7-day Boost R99–R149 · 30-day Priority R299–R399 · featured suburb slots · featured agent profile R199–R499/mo.
- **Agent Intelligence Console:** nine metric groups, impression → verified lead → viewing → offer → sold/let, with cost per verified lead and a listing health score.
- **"Ask Dynasty":** natural-language analytics over the console, answers carrying linked evidence.
- **Performance Wallet:** budget-capped agent loop (fund → evaluate → recommend → authorise → attribute). Approval mode first, autopilot later, hard monthly cap. The brief calls this the biggest gap vs. both incumbents.
- **Feed ingestion & dedupe:** PropData / Entegral ingest with unique property IDs, freshness checks, mandate rights, sold/let withdrawal sync. Flagged "now · foundation for scale".
- **Added suggestions worth noting:** verified listings & scam shield (owner/mandate verification, PPRA + Fidelity Fund Certificate checks, duplicate-photo detection); WhatsApp-first lead routing; SA living-cost filters (solar/inverter, borehole, fibre, estate security, levies).

Two of these land near work already in the repo: duplicate-photo detection overlaps the existing listing photo-quality checks, and the "AI search & photo similarity" row is marked *team-reported, in development*.

## Read it with these caveats

The brief is unusually honest about its own evidence, and that honesty should survive the handover:

- Every figure is tagged by evidence level — **Research** (in the paper) · **Model** (assumption-based) · **Team estimate** · **Proposal** · **Added analysis** (arithmetic done in the brief itself). Don't quote a Model number as a fact.
- Incumbent revenue and payer counts are **low to low-medium confidence models**. Neither portal discloses billable accounts or an audited live-listing count.
- Rand figures are **gross billings excl. VAT** — not profit, not audited, not reported company revenue. "Annualised" means one month × 12, not ARR.
- "Not found" in the gap analysis means not documented in the public sources reviewed. It is **not** proof a competitor lacks the capability. The brief explicitly warns against claiming the incumbents have "no analytics" or "no AI".
- The brief flags its own inconsistency: Private Property's inventory range implies ~60–117 live listings per account vs ~36–82 at Property24. One of those inputs is wrong; validate before using externally.
- Section 11's growth curve is an **illustrative sandbox**, not a forecast. There is no dated plan in here.
- Section 13 lists six open decisions for management, all unowned by engineering: approve a focused pilot, validate pricing via 20–30 agency interviews, sign the first feed partner, instrument the funnel day one, define "qualified lead", and build the cost side of the model.

## Suggested next step on your side

Nothing here is a code task yet. The one thing that is engineering-shaped and marked "now" is the **feed ingestion + dedupe foundation** and **day-one funnel instrumentation** — the brief's whole AI layer rests on trustworthy event data, and we don't have that pipeline. If you want to start somewhere, start there rather than at the pricing page.

Also still outstanding and unrelated to this brief: the **Firebase rules deploy** (login expired 2026-10-18), which blocks Saved Searches and Register Agency.
