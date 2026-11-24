# Dynasty Estates — to-do list

Written 19 Nov 2026 from the code, git, the delivery tracker and the XCORE board
(project "Dynasty Estates Website"). This is the working order. Update it when an
item ships or the plan changes, and tick the same task in XCORE.

**Picking up the build lane on another device? Read `docs/HANDOVER.md` first.**

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

- [x] **S1-1** **Stop mixing built-in sample listings into the live site.** *Done 19 Nov: the 20 samples are deleted from the code.* `getPropertyList()` adds ~20 hard-coded listings from `property-data.ts` to every search, the home page falls back to them, `/compare` can *only* compare them, `/saved` shows two of them to new visitors, and the AI concierge ranks them. Live Firestore has 6 published TEST listings plus 6 labelled example homes (below). *D1 decided 19 Nov: remove the built-in samples.*
- [x] **S1-2** `/compare` works with real listings. *Done 19 Nov.*
- [x] **S1-3** *Done 19 Nov.* Remove the remaining stand-ins: `/saved` localStorage fallback (the sample homes are gone), the `demo-user-1` member in Collections, and the Collections invite that only shows "Invite dispatched" without sending.
- [x] **S1-4** Security-rule tests in the repo and CI (Firestore emulator). *Done 19 Nov:* `npm run test:rules` (129 checks, every collection and role) runs in CI. It closed 5 gaps in `firestore.rules` (seller-set `example` / `sale` / `agentId`; any agent reading every tenant application; enquiries filed as won or pre-assigned). Deployed to live 19 Nov (14:53 UTC, owner OK); live rules match `main`. Two gaps left for D7.
- [x] **S1-5** Fix the data-integrity findings from the nightly scan. *Done 19 Nov:* cause fixed (a new listing's physical record is now written in the same batch); owner-approved deletion of the 5 TEST comparables (+4 view counts) and 4 orphan physical records. Kept on purpose: 4 test applications from the old demo buyer (on a removed sample home) and 2 accounts with no role (Quintus and a phone sign-in; they are buyers). Also found and fixed: home, area, agent and sitemap pages only refreshed on deploy; now every 5 minutes.
- [x] **S1-6** E-mail verification for new accounts. *Done 20 Nov:* a Dynasty e-mail with a Firebase verification link on sign-up (via Brevo, logged in mail_log), a banner on every page until confirmed ("Send the link again", max 1 a minute, 5 a day), `/auth/verified`, and one nightly reminder after 3 days. Google accounts, developer accounts and .test addresses are skipped. Deliverability still depends on O1 (Brevo DNS).
- [x] **S1-7** After signing in, return to the page you came from. *Done 20 Nov:* every sign-in link outside /console carries `?next=` (same-site paths only, tested in CI); sign-in, sign-up, Google and phone all return there. The enquiry form now asks signed-out visitors to sign in instead of failing with "check your connection".
- [x] **S1-8** Set "Under offer" from the agent and seller portals (and back to live). *Done 20 Nov (ALET-ELIZE):* one control in `components/listing-market-status.tsx` on both portals' listing pages, moving the listing through `PUT /api/listings/[id]/status` (Published ↔ Under offer only; a draft or a sold listing is refused with 409, and every move files an `audit_logs` entry). No rules change: owners still may not write a public status themselves, which keeps an unmoderated draft out of the catalogue. Buyers now see it — a pill on the listing hero, a badge on the card, `LimitedAvailability` in the structured data — because the status had been invisible on the public side.
- [x] **S1-9** FFC expiry reminder e-mails (nightly; 60, 30 and 7 days before), with opt-out. *Done 20 Nov (ALET-ELIZE):* a nightly step (`lib/server/practitioner-reminders.ts`) e-mails each **verified** practitioner once per step, with a new "Certificate expiry reminders" preference on `/alerts` and a switch in `/console/flags`. The step is the smallest one the certificate has reached, not an exact day, so a missed night still sends it; what has gone out is kept in the server-only `compliance_reminders/{uid}` **against the expiry date**, so filing a renewed certificate starts the run again. Expired certificates are left to the portal. Checked against live data with six throwaway records (since deleted): 60/30/7 chosen correctly, opt-out sends nothing and logs nothing, pending and expired records skipped. The one real practitioner has a `.test` address, so nothing can reach a person until a real agent is verified.
- [x] **S1-10** Price-drop alerts: e-mail when a saved home or a saved-search match drops its asking price. *Done 20 Nov (ALET-ELIZE):* a nightly step (`lib/server/price-drops.ts`) compares each live listing against the asking price it last saw, held in the server-only `price_watch/{listingId}`; a cut of at least 1% e-mails everyone who saved the home or saved a search it matches (never the listing's own owner), one e-mail per person saying which it is. New "Price drops" preference on `/alerts` and switch in `/console/flags`. Checked against live data with a throwaway listing (since deleted): 10% cut e-mailed the saver, 13% cut e-mailed the search match, a 0.56% cut was ignored, and the first run only records prices.
- [x] **S1-11** "Stop alerts for this search" link per saved search (today the link stops all). *Done 20 Nov (ALET-ELIZE):* each search block in the alert e-mail carries its own signed link, which sets `alerts: false` on that one search and leaves the `savedSearchAlerts` preference and every other search alone; the footer link still stops them all. The search is not deleted, so it stays on `/alerts` to turn back on. Token signing moved to the pure `lib/unsubscribe-token.ts` (`uid.target.signature`, where target is a preference key or `search-<id>`) and is covered by `tests/unsubscribe-token.test.mjs`; links already in inboxes are signed exactly as before. Checked end to end on localhost: the link stopped one of two searches, a tampered id was refused (400), a token for another account's search was refused (403), and a deleted search reported done.
- [x] **S1-12** Fix the broken `npm run firebase:*` deploy scripts. *Done 23 Nov:* they called a `firebase-tools` command that isn't installed. `firebase:deploy:rules`, `:indexes` and `:storage` now run `scripts/firebase-deploy.mjs`, which always deploys the file as it is on `origin/main` (copied into a temporary folder with a `firebase.json` holding only that section), stops if your copy differs from main, and runs `npm run test:rules` before Firestore rules; `-- --dry-run` checks with Firebase without deploying. `firebase:config` uses the pinned CLI. **Removed `firebase:deploy:auth`**: it would have replaced the live sign-in domains with the three in `firebase.json`, which leave out `dynasty-estates.vercel.app`. Checked: dry runs of all three pass (rules after 134/134 checks), and a changed local file is refused. Nothing was deployed.

Done 19 Nov: **6 labelled example listings** in Firestore (`properties/claude-example-1..6`, `example: true`, 3 Unsplash photos each, TEST agency). No tag on their photos (owner asked); the property page shows a notice instead of the agent card and no enquiry buttons. Seeded from outside the repo.

## Mobile UI/UX (UI lane, runs alongside Sprint 1)

In XCORE these items (and all phone work done since 2 Nov) are tracked in the **Dynasty Estates Mobile App** project, not the Website project (owner, 20 Nov). The UI agent's current placement pass is there as "in progress".

- [x] **U1** Phone pass over everything built since 9 Nov: agent/agency/admin dashboards, listing page in the portals (incl. the new Mark as sold panel), listing editor, `/agent/market`, seller report, `/alerts`, `/email/unsubscribe`, `/pricing`, `/sell`. Check 375 px, no sideways scroll, 44 px targets. ~~Seen 19 Nov: on a phone the price on a search card runs into the photo dots.~~ Fixed 20 Nov (dots bottom-right). *Done 24 Nov:* 25 pages measured at 375 px as agent, seller and admin; none scrolls sideways. Every tap target under 44 px fixed: a shared `tap-44` class (globals.css, part of `linkClass`) gives a small standalone link an invisible 44 px tap area on phones without moving anything; Print, the `/pricing` tabs and "Request this package" are 44 px tall on phones. Re-tested by tapping 20 px above and below each target. Left: the enquiry WhatsApp link gets 40 px (the Stage control is right below); the 36 px logo on the seller report header.
- [x] **U8** *Done 20 Nov (owner's phone review, CoreFlow notes):* controls sit with what they change. Search: view switch and sort on the results line, not in the search card (count is screen-reader-only on phones). Area pages (/for-sale, /to-rent, province, city): homes first, directory and "Also see" below. Listing page: one Street View / Map switch; True Cost offer price on one line. Compare: Back on the left, to where you came from. Card photo dots bottom-right, clear of the price. Map: scroll fade on chip rows, labelled layer buttons. Owner score 90 → 92.
- [ ] **U2** Mobile speed (old S15): home LCP ≤ 4 s, search TBT ≤ 1,200 ms, Lighthouse mobile ≥ 70.
- [x] **U3** Targets the UX plan didn't fully meet: home ≤ ~3,500 px tall at 1280 (now 4,772); first search card in the top half at 375×812 (now 514 px); agent card above the fold on the listing page at 1280×800. *Done 24 Nov (owner chose the layouts):* home at 1280 is 3,130 px (was 4,492) — the six homes are a 3-column grid on desktop, still the list on phones; first search result at 375×812 starts at 404 px (was 446) by tightening the search card's spacing on phones only; on the listing page the photographs head the left column and the agent card sits beside them, at 204–544 px on a 1280×800 screen (was 874). Title and price stack between 1024 and 1279 px so the title fits the narrower photo.
- [x] **U4** Sign-in: real Google logo instead of the plain "G". *Done 23 Nov:* Google's four-colour mark (`components/google-logo.tsx`) on "Continue with Google" on `/auth/login` and `/auth/signup`.
- [x] **U5** Sold listing page: the hero still says "Asking price" — show the sale (or "Sold") clearly. *Done 23 Nov:* the hero and the phone price bar say "Sold for R …" / "Rented for, per month R …" when the seller agreed to show the price, and "Sold" / "Rented · Price not disclosed" when not; the page description says "Sold." instead of "Asking R …". Checked at 1280 and 375 px with two throwaway listings (since deleted).
- [x] **U6** The yellow FFC banner on the agent dashboard isn't in the Petrol style yet. *Done 23 Nov:* `attentionBoxClass` (champagne, for "expires in N days") and `urgentBoxClass` (`--dash-down`, for "expired") in `dashboard-ui.tsx`; the signed-out notice on the same page uses the champagne one too. Checked light and dark, 1280 and 375 px, on the dev account (43 days left).
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
- Shared collections: invite a partner to a collection (rules for members, invite + accept, e-mail). The fake invite was removed in S1-3.
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
- **D8** Enquiries without an account? Today a buyer must sign in to send an enquiry or book a viewing (the form now says so up front). Allowing guest enquiries needs a server route with spam protection.
- **D7** Any agent can edit or delete any other agent's listing today (the rules let every practitioner change every listing so they can moderate). Limit that to admins plus the listing's own agent, or keep it? The rule tests report it as a gap until decided.
