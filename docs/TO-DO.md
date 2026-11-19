# Dynasty Estates — to-do list

Written 19 Nov 2026 from the code, git, the delivery tracker and the XCORE board
(project "Dynasty Estates Website"). This is the working order. Update it when an
item ships or the plan changes, and tick the same task in XCORE.

**Two agents, one owner.** Follow `COLLABORATION.md` and claim in `WORKING_ON.md`
before starting any item.

| Lane | Who | Owns |
| ---- | --- | ---- |
| **Build** | Claude on DESKTOP-1R37EBU | data, `src/lib/**`, `src/app/api/**`, e-mail, cron, security, payments |
| **UI** | the UI/UX agent | look and layout, phone first: `globals.css`, page layout and styling, shared UI components |
| **Owner** | you | decisions, accounts, DNS, money |

**Shared files** (both lanes touch them, so always claim first and keep the change small):
`src/app/property/[slug]/page.tsx`, `src/app/search/page.tsx`, `src/components/listing-detail.tsx`,
`src/components/listing-wizard.tsx`, `src/components/site-navigation.tsx`, `src/components/account-actions.tsx`,
`src/lib/property-data.ts`. The UI lane does not change data or API behaviour; the build lane
doesn't restyle pages beyond what a new feature needs. `/console` is out of scope for the UI lane.

Status keys: **[ ]** to do · **[~]** in progress · **[!]** blocked · **[?]** needs an owner decision.

---

## Now — owner steps (no code)

- [!] **O1** Your partner adds the 3 Brevo DNS records for tricore.enterprises (request sent 18 Nov). Until then site e-mails can land in spam. Then: Claude verifies in Brevo and resends a test.
- [ ] **O2** Delete `Desktop/Dynasty_Estates_V2.0/CRON_SECRET-for-Vercel.txt`.
- [ ] **O3** Set a Google Cloud budget alert (Blaze is pay-as-you-go).
- [ ] **O4** In Brevo, click "I've saved my key". Optional: rotate the key (it showed in a screenshot).
- [ ] **O5** Optional: remove the old trycloudflare authorised domain in Firebase Auth.

## Sprint 1 — honest catalogue, security, small features (Build lane)

Order matters: S1-1 changes what every page shows, so it goes first.

- [ ] **S1-1** **Stop mixing built-in sample listings into the live site.** `getPropertyList()` adds ~20 hard-coded listings from `property-data.ts` to every search, the home page falls back to them, `/compare` can *only* compare them, `/saved` shows two of them to new visitors, and the AI concierge ranks them. Live Firestore has 6 published TEST listings plus 6 labelled example homes (below). *D1 decided 19 Nov: remove the built-in samples.*
- [ ] **S1-2** `/compare` works with real listings (it reads `fallbackProperties` only today).
- [ ] **S1-3** Remove the remaining stand-ins: `/saved` sample homes and localStorage fallback, the demo member in Collections.
- [ ] **S1-4** Security-rule tests in the repo and CI (Firestore emulator): owner-only reads, role checks, agency access, enquiry stages. Must exist before payments.
- [ ] **S1-5** Fix the data-integrity findings from the nightly scan: listings without a valid owner (5), unused physical records (4), sample enquiries (4), accounts without a role claim (2).
- [ ] **S1-6** E-mail verification for new accounts (send on sign-up, nudge until verified).
- [ ] **S1-7** After signing in, return to the page you came from (`/alerts`, a listing, …) instead of the home page.
- [ ] **S1-8** Set "Under offer" from the agent and seller portals (and back to live).
- [ ] **S1-9** FFC expiry reminder e-mails (nightly; 60, 30 and 7 days before), with opt-out.
- [ ] **S1-10** Price-drop alerts: e-mail when a saved home or a saved-search match drops its asking price.
- [ ] **S1-11** "Stop alerts for this search" link per saved search (today the link stops all).
- [ ] **S1-12** Fix the broken `npm run firebase:*` deploy scripts.

Done 19 Nov: **6 labelled example listings** in Firestore (`properties/claude-example-1..6`, `example: true`, 3 Unsplash photos each, TEST agency). The property page shows a notice instead of the agent card and no enquiry buttons. Seeded from outside the repo.

## Mobile UI/UX (UI lane, runs alongside Sprint 1)

- [ ] **U1** Phone pass over everything built since 9 Nov: agent/agency/admin dashboards, listing page in the portals (incl. the new Mark as sold panel), listing editor, `/agent/market`, seller report, `/alerts`, `/email/unsubscribe`, `/pricing`, `/sell`. Check 375 px, no sideways scroll, 44 px targets.
- [ ] **U2** Mobile speed (old S15): home LCP ≤ 4 s, search TBT ≤ 1,200 ms, Lighthouse mobile ≥ 70.
- [ ] **U3** Targets the UX plan didn't fully meet: home ≤ ~3,500 px tall at 1280 (now 4,772); first search card in the top half at 375×812 (now 514 px); agent card above the fold on the listing page at 1280×800.
- [ ] **U4** Sign-in: real Google logo instead of the plain "G".
- [ ] **U5** Sold listing page: the hero still says "Asking price" — show the sale (or "Sold") clearly.
- [ ] **U6** The yellow FFC banner on the agent dashboard isn't in the Petrol style yet.
- [ ] **U7** Keyboard-only and screen-reader pass (tracker 12.6).

## Sprint 2 — payments (Build lane, after decisions D2)

- [?] **P1** Owner: Ozow or Paystack; approve the price list; VAT registered?; refunds; who invoices; free tier.
- [ ] **P2** Pricing phase 2: package on a listing, expiry, admin request queue.
- [ ] **P3** Pricing phase 3: agent plan limits.
- [ ] **P4** Pricing phase 4: online payment with the chosen gateway (webhook-verified, receipts by e-mail, no card data on our side).
- [ ] **P5** Admin revenue & insights page (dashboards Phase H).

## Sprint 3 — launch readiness

- [?] **L1** Custom domain: buy it, point DNS at Vercel, update `SITE_URL`, Firebase authorised domains (owner buys; Claude configures).
- [?] **L2** E-mail before launch: paid provider and a sender on the Dynasty domain (D4).
- [ ] **L3** POPIA: privacy policy review, delete-my-account and download-my-data, consent records for e-mails.
- [ ] **L4** Rate limits and abuse protection on public endpoints (enquiries, saved searches, unsubscribe, tracking).
- [ ] **L5** Backups: scheduled Firestore export; uptime monitoring with alerts.
- [ ] **L6** End-to-end journey tests (search → enquiry → agent reply; list → moderate → publish → sell) and a cross-browser check.
- [ ] **L7** Remove live TEST data (6 example listings once real ones exist, 8 TEST listings, TEST agency, test practitioner record and enquiries). Needs owner OK in chat.
- [?] **L8** Support e-mail inbox for Support & Guidance (D5).
- [ ] **L9** Threat-model review against what is built now.

## Later (kept on the plan)

- Sold prices on the public area pages (`/for-sale/…`, `/insights`); show a home's earlier sale when it is listed again.
- `/insights` on real data, or a licensed Deeds Office / Lightstone feed (paid, D3).
- Viewing scheduling (calendar), in-app messaging.
- Auctions and distressed / bank-mandated sales (archived XCORE phase 4.3).
- Suburb CMA report; municipal valuation rolls.
- AI concierge on a real model; visual "homes like this" on real embeddings (today both are heuristic or prototype).
- XCORE projects with no tasks yet: Dynasty Estates Mobile App, Dynasty Estates Admin Hub (the `/console` and `/admin` work is its start).

## Owner decisions

- **D1** ~~Built-in samples~~ **Decided 19 Nov:** remove the ~20 built-in samples; 6 labelled example homes in Firestore cover the gap until real listings arrive.
- **D2** Payments: gateway (Ozow / Paystack), prices, VAT, refunds, invoicing, free tier. *Blocks Sprint 2.*
- **D3** Market data: keep `/insights` illustrative, build on Dynasty's own recorded sales, or buy a feed.
- **D4** Paid e-mail provider and the sending domain.
- **D5** Support inbox address.
- **D6** Real listing photography; "Dynasty True Cost" trademark; final logo.
