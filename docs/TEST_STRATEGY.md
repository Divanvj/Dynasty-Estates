# Dynasty Estates - Quality Assurance & Test Strategy

**Organisation:** Tricore Enterprises  
**Platform:** Dynasty Estates  
**Version:** 1.0  
**Phase:** 0 - Product Definition and Architecture  
**Date:** September 2026  

---

## 1. Multi-Tier Testing Hierarchy

Quality verification is an automated, continuous gate rather than an afterthought.

```mermaid
graph TD
    subgraph Test Layers
        E2E[End-to-End User Journeys (Playwright)]
        Integration[Integration & API Testing]
        Security[Authorization & RLS Policy Tests]
        Component[Component & Accessibility Tests]
        Unit[Unit Logic & Calculation Tests]
        AIEval[AI Evaluation & Grounding Benchmark]
    end

    Unit --> Component
    Component --> Security
    Security --> Integration
    Integration --> E2E
    AIEval --> E2E
```

---

## 2. Test Layer Specifications

### 2.1 Unit Testing
- **Scope**: Financial calculations (True Cost, transfer duty, bond repayment), taxonomy mapping, query string serialization, date formatting.
- **Framework**: Jest / Node test runner.
- **Coverage Target**: Minimum 85% branch coverage on core domain utilities.

### 2.2 Database & RLS Authorization Testing
- **Scope**: Verifying cross-tenant data isolation. Proving that:
  - User A cannot edit User B's listing draft.
  - Non-agents cannot access the agent inquiry lead inbox.
  - Unauthenticated users cannot read unapproved drafts or private collections.
- **Execution**: Automated test harness against local database emulator.

### 2.3 Component & Accessibility Testing
- **Scope**: Obsidian Glass UI components, theme switching, keyboard navigation (`Tab`, `Escape`, arrow keys), ARIA labels, contrast ratios.
- **Standard**: WCAG 2.1 AA automated audits (axe-core).

### 2.4 End-to-End User Journey Testing
- **Framework**: Playwright.
- **Key Journeys Covered**:
  1. **Buyer**: Search → Filter → Detail View → Save Property → Inquiry Submission.
  2. **Seller**: Multi-step wizard creation → Draft Autosave → Preview → Moderation Submission.
  3. **Agent**: Lead notification → Review inquiry → Update listing status.

---

## 3. AI Grounding & Retrieval Evaluation

To prevent hallucinations and guarantee data reliability:
1. **Grounding Invariant**: Acceptance tests reject any AI concierge response that contains a property ID or address not present in the authoritative database query result.
2. **Vision Tagging Precision**: Labelled benchmark dataset of 100 diverse South African property images evaluated for room classification and amenity precision (target > 90%).
3. **Graceful Fallbacks**: If the AI model times out or is unreachable, the system automatically falls back to deterministic structured search without crashing.

