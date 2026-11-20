# Handover — build lane (written 20 Nov 2026, DESKTOP-1R37EBU)

For the agent on the owner's other device, picking up the **build lane** exactly
where it stopped. Read this, then `docs/TO-DO.md` (the plan) and `COLLABORATION.md`.
Delete or update this file when you have taken over.

## Where it stopped

- **Next item: S1-8 — set "Under offer" from the agent and seller portals, and back to live.**
  The owner said "Yes, start S1-8"; nothing was started: no claim, no branch, no code.
- Sprint 1 done so far: S1-1 … S1-7 (see `docs/TO-DO.md`, each has a *Done* note).
  Left: S1-8, S1-9 (FFC expiry reminders), S1-10 (price-drop alerts),
  S1-11 (stop alerts per saved search), S1-12 (fix `npm run firebase:*` scripts).
- Working tree on `main` was clean and pushed. `WORKING_ON.md` has no open claims.
- The UI agent works in its own worktree (`DESKTOP-1R37EBU/mobile-placement`,
  folder `dynasty-wt-placement` on this PC) with an uncommitted mobile "placement"
  pass over search, map, area pages, compare and card photos. Don't touch those files
  without checking `WORKING_ON.md`.

## Open owner decisions (don't build these without an answer)

D2 payments · D3 market data · D4 paid e-mail + domain · D5 support inbox ·
D6 photography/logo · **D7** may any agent edit/delete other agents' listings
(rule tests report it as a known gap) · **D8** guest enquiries without an account.
Owner steps O1–O5 are still open (O1 = partner adds the Brevo DNS records; until then
site e-mail may land in spam).

## How the work is done (the owner expects all of this)

1. `git pull`, claim the item in `WORKING_ON.md` and push the claim **before** coding.
2. Branch `<machine>/<task>`; small diffs; release the claim and leave a
   "Recently merged" note when merged to `main` the same day (push to main = live on Vercel).
3. Checks before merging: `npx tsc --noEmit`, `npx eslint <files>`,
   `node tests/return-path.test.mjs`, and **`npm run test:rules`** (Firestore emulator,
   needs Java 21; ~2 min; 134 checks) whenever `firestore.rules` or data writes change.
   CI runs all of these.
4. Verify by doing: drive the feature in the browser on `localhost:3000` with your
   machine's **developer account** (see `CLAUDE.md`; never paste a password anywhere),
   then read the saved data back with the Admin SDK. Clean up any test data you create.
5. After each piece: tick `docs/TO-DO.md`, add a line to
   `docs/ux-audit/08-removed-and-replaced.md`, and update **XCORE** (below).
6. Never hard-code test listings/data in the app. Test data lives only in Firestore,
   written by scripts kept **outside** the repo. Don't change `/console` (except e-mail
   additions the owner allowed). Ask before deleting live data, deploying rules,
   or anything outward-facing.

## XCORE (the owner's project tracker)

https://xcore-777.web.app — the owner signs in; never type their password.
- **Dynasty Estates Website** `/project?id=60CgLP5qR6ZVbyR2gjmF`: Sprint 1/2/3, Owner
  Steps & Decisions, Later. Tick a task when it ships (status select → done).
  At handover: 57 % (46/85). S1-8 is "todo".
- **Dynasty Estates Mobile App** `/project?id=eOhaTOaAk42qX6nB7Ihj`: all phone work
  (done phases, the UI agent's placement pass, U1–U7) and the native-vs-installable
  decision. At handover: 60 % (15/26). U1–U7 live **only** here now.
- Scripting tips: a phase's "Quick add" needs the native input setter + clicking the
  row's **Add** button (a synthetic Enter is ignored); collapsed phases need
  "Expand tasks for …" first; titles rename on click; "+ Phase" has a project select —
  check it before saving.

## Live state worth knowing

- **Firestore rules** deployed to live 19 Nov 14:53 UTC; live = `main`. To deploy:
  copy `firestore.rules` from `origin/main` into an empty folder with a minimal
  `firebase.json` (`{"firestore":{"rules":"firestore.rules"}}`), back up the live
  ruleset first (firebase-admin `getSecurityRules().getFirestoreRuleset()`), then
  `npx firebase-tools@15.37.0 deploy --only firestore:rules --project dynasty-estates`
  (owner's OK first). `npm run firebase:*` scripts are broken (S1-12).
- **Catalogue**: the 20 built-in sample homes are gone. Live has 6 labelled example
  homes (`properties/claude-example-1..6`, `example: true`, 3 Unsplash photos each,
  owned by the TEST agency principal = the DESKTOP-1R37EBU dev account) and the TEST
  listings from Phase B (`claude-test-pb-*`). Remove both at launch (L7, owner OK).
  Kept on purpose: 4 old test rental applications from the disabled demo buyer.
- **E-mail** (Brevo, key only in Vercel): kinds enquiry, agency_invite, ops_alert,
  weekly_report, saved_search, verify_email, test — all logged in `mail_log`
  (`/console/email`). Local sends are "skipped" (no key locally).
- **Nightly cron** (`/api/cron/nightly`, 00:00 UTC): health, integrity scan, stats
  retention, file clean-up, saved-search alerts, verification reminders, Monday reports.
- Server-only collections (Admin SDK via API routes, no client rules): saved_searches,
  email_prefs, sales, mail_log, platform_config, email_verification.
- Catalogue pages (home, /for-sale, /to-rent, /agents/[slug], sitemap) rebuild every
  5 minutes (`export const revalidate = 300`).

## For S1-8 specifically (a head start, not yet checked in code)

- Status values live in `src/lib/types/domain.ts`; "Under offer" is already a public
  status in `firestore.rules` (`publicStatuses()`), so the catalogue shows it.
- Owners (non-practitioners) may only set Draft/Submitted/Paused/Archived under the
  rules, so a private seller moving a live listing to "Under offer" needs either a rule
  change (add a test in `tests/firestore-rules.test.mjs`) or a server route like
  `/api/listings/[id]/sale` (recorded sales, `lib/server/sales.ts`) — that route and
  `components/listing-sale.tsx` (Mark as sold panel) are the closest pattern.
- Check what the listing page, cards and search show for "Under offer", and that
  "back to live" returns it to Published.
