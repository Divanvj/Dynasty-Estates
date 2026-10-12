# Test log

<!-- This log records validation performed across development iterations. -->

## Phase 15 Polish — Hero Interaction Performance (2026-09-20)

Scope: replaced the cursor-tracking hero hue with the Aurora Silk ambient
backdrop and the frosted-glass interactive headline, then remediated the
performance regression this introduced.

### Static Analysis & Typecheck
- **Commands:** `npx tsc --noEmit`, `npx eslint` on changed modules
- **Result:** Passed (0 errors, 0 warnings)
- **Build:** `npm run build` — compiled successfully, 23 routes prerendered

### Home Page Frame Benchmark
Measured over CDP against the production server. Headless Chrome rasterises in
**software**, so these are valid for *relative* attribution only — a static-text
control run establishes the ~60fps ceiling for comparison.

| Scenario | Before remediation | After | Control (no FX) |
|---|---|---|---|
| Idle, hero visible | 55.4 fps | **60.1 fps**, 0 janky frames | 60.1 fps |
| Scrolling full page (images warm) | — | **58.9 fps**, p95 17.7ms | 60.1 fps |
| Cursor sweeping headline | 24.0 fps | **35.7 fps** | 60.1 fps |

### Cost Attribution (measured, A/B per property)
Ranked by frames recovered when the property was removed:

1. `filter: blur()` on the aurora orbs — 24 → 49.9 fps
2. `mix-blend-mode: screen` on 30 text-clipped specular layers — 24 → 40.3 fps
3. `scale()` inside the orb keyframes (forces re-raster of a blurred layer) — 24 → 36.8 fps
4. `mask-image` on the aurora container — 24 → 33.2 fps
5. `mix-blend-mode: overlay` on the grain layer — 24 → 27.2 fps

### Remediation Applied
- Removed every `filter`, `mix-blend-mode` and `mask-image` from the hero FX.
  Softness now comes from multi-stop gradients, which rasterise once and are
  only translated thereafter. This is the §6 glassmorphism rule (blur and glow
  must not be applied indiscriminately, performance is a stated priority).
- Orb keyframes translate only; no scaling of large rasterised layers.
- Collapsed 30 per-character blur layers into one layer for the whole headline.
- Both `requestAnimationFrame` loops now park when settled and restart on
  `pointermove`; neither runs while idle.
- `IntersectionObserver` pauses the CSS keyframes and both loops while the hero
  is scrolled out of view.
- Specular gradient repositions only after 4px of cursor travel, and is gated on
  per-character proximity so unlit characters skip the repaint entirely.

### Known Limitations
- The cursor sweep remains the heaviest interaction (35.7 fps vs a 60 fps
  control in software rasterisation). Text-clipped gradients are CPU-rasterised
  even on GPU-composited pages. Not yet verified on real GPU hardware.
- A ~1s stall on the first scroll traces to lazy image decode, not the hero FX
  (confirmed by A/B: present with FX disabled). Candidate for §27 image work.

### Accessibility (§7, §26)
- `prefers-reduced-motion` disables drift, parallax, character lift and the
  specular sweep.
- Headline exposes the full string via `aria-label`; decorative layers are
  `aria-hidden`.
- Touch devices receive the ambient backdrop with no pointer FX.

---

## Phase 6, 8–11, 13–15 Delivery Milestone (2026-09-03)

### Static Analysis & Linter
- **Command:** `npm run lint` (`eslint`)
- **Result:** Passed (0 errors, 0 warnings)
- **Notes:** All newly implemented modules (`collections.ts`, `moderation.ts`, `billing.ts`, `visual-search.ts`, `ai-concierge.ts`) and pages (`/collections`, `/compare`, `/admin`) pass static analysis cleanly.

### TypeScript Typecheck
- **Command:** `npx tsc --noEmit`
- **Result:** Passed (0 errors)
- **Notes:** Full project-wide compilation verified without type coercion or any-assertions.

### Automated Domain Unit Tests
- **Command:** `node tests/domain.test.mjs`
- **Result:** Passed (3/3 test suites passed)
- **Coverage:**
  - Listing Quality Score calculation algorithm (0–100 scale).
  - South African natural language query parsing (heuristics, location extraction, amenity detection).
  - Financial bond repayment formula at benchmark prime lending rate.

### Progress Command Centre Live Scan
- **Command:** `GET /api/progress`
- **Result:** **16 Completed, 0 Partial, 0 Queued. Overall Plan Coverage: 100%**.
- **Notes:** All 16 phases verified against real filesystem artifacts and routes.

---

## Historical Entries

### Phase 0 & Domain Foundation Continuation
- **Command:** `npm run lint`
- **Result:** Passed (0 errors) after resolving setState in effect in inquiries/saved pages.
- **Command:** `npx tsc --noEmit`
- **Result:** Passed (0 errors).
- **Scan:** 9 Completed, 2 Partial, 63% Coverage.
