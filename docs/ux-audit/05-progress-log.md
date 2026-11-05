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
