# Blaze plan — what it unlocks and the order we switch it on

Written 2026-11-12 (DESKTOP-1R37EBU). Status: **Blaze is on (owner, 2026-11-12).** O1 and O3 are done: the default
bucket `dynasty-estates.firebasestorage.app` exists (us-central1). O2 (budget alert) is the owner's to confirm.

## Done 2026-11-12

- **B1:** `storage.rules` tested on the Storage emulator (21 allowed / denied cases) and deployed; the bucket had the
  console's default deny-all rules until then. The test found that Storage counts overwriting a file as a *create*, so
  `allow update: if false` did not stop a checked photo being replaced in place; the create rules now also require
  `resource == null`. The developer console's go-live list gains "Storage rules match main".
- **B3:** already in place: phone sign-in on, SMS region policy is South Africa only, the Vercel domain is authorised.
  A stale `*.trycloudflare.com` demo tunnel domain is still authorised (owner may remove it).
- **Switches** in `/console/flags` (`lib/platform-config.ts`): the listing photo checks (AI-generated, duplicates,
  screenshots, blur, resolution) and phone sign-in can each be turned off for testing. File type and the 10 MB limit
  stay enforced by `storage.rules`.

- **B2 (decided 2026-11-12, owner left the choice to us): Vercel Cron.** `vercel.json` calls `/api/cron/nightly` once a
  day at 00:00 UTC (02:00 SAST): health probes against production, the integrity scan, and `listing_stats` retention
  (13 months). Results go to the console event log (actor "Nightly job") and `platform_config/nightly`; the go-live
  item "Nightly jobs ran" turns red if no run in 26 hours. Why Vercel Cron over Cloud Scheduler / Functions: the code
  already lives in the Next app and deploys with every push to main, it needs no extra Google permissions or second
  deploy pipeline, and it costs nothing. Its limit: on Vercel's free plan a cron runs at most once a day. A frequent
  uptime check (every few minutes) only helps once failures can alert someone, so it waits for the e-mail provider;
  then use Cloud Scheduler (it runs outside Vercel, so it still reports when Vercel is down).
- **Owner step for B2:** add `CRON_SECRET` in Vercel → Settings → Environment Variables (Production) and redeploy.
  Until then the route refuses every call (503), which the go-live list shows.

Still open: e-mail provider (alerts, weekly seller report, FFC reminders) — owner decision in section 3.

## 1. Owner steps (only the account owner can do these)

| # | Step | Where |
| --- | --- | --- |
| O1 | Upgrade the project to **Blaze** (pay as you go). | Firebase console → project → ⚙ Usage and billing → Details & settings → Modify plan |
| O2 | Set a **budget alert** (suggested: a low monthly amount with alerts at 50 / 90 / 100 %). Blaze has no hard cap; the alert is the safety net. | Google Cloud console → Billing → Budgets & alerts |
| O3 | Create the default **Storage bucket**, in the same location as Firestore, if the CLI cannot create it (we try first). | Firebase console → Build → Storage → Get started → Production mode |

## 2. What we switch on, in order (no code to write unless noted)

### B1 — Listing photos and floor plans (Cloud Storage) — highest value

Already built: the photo checks and upload (`src/lib/photo-intake.ts`, `components/listing-photo-uploader.tsx`),
floor-plan upload, and `storage.rules` (public read; an owner writes only under their own uid; JPEG / floor-plan types
only; under 10 MB; no in-place replacement). Blocked only because the bucket does not exist, so **today a listing
can only be saved as a Draft, never submitted.**

1. Confirm the bucket name and set `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` in `.env.local` and on Vercel.
2. Deploy `storage.rules`; test them on the Storage emulator first (allowed and denied cases).
3. With the test account: upload photos and a floor plan in the listing wizard, submit, and read the files and the
   listing back. Check the photos render on the listing page (`next/image` already allows Firebase Storage hosts).
4. The developer console's "Blaze plan and Cloud Storage" go-live check turns green on its own.

### B2 — Scheduled jobs

The console already runs these checks on demand. Blaze lets them run on a timer. Two ways to do it:
**Cloud Functions + Cloud Scheduler** (needs Blaze), or **Vercel Cron** calling the existing Next routes (needs no
Blaze). Recommended: Vercel Cron for the checks, because it reuses code we already have and adds no second
deploy pipeline; Cloud Functions only where a Firestore trigger is needed.

- Uptime check every 5–15 min, nightly integrity scan, with results kept in the console.
- `listing_stats` retention: delete daily docs older than 13 months (open decision 3 in `docs/dashboards/PLAN.md`).

### B3 — Real SMS for phone sign-in

Phone sign-in is built and works today with Firebase test numbers. Blaze lets real SMS go out. Before turning it on:
set the SMS region policy to South Africa only (stops SMS-cost abuse), and confirm the live domain is in
Authorized domains.

## 3. Needs an owner decision before it can be built

| Item | Decision needed |
| --- | --- |
| E-mail sending (new-enquiry alerts, weekly seller report, FFC expiry reminders, alert e-mails from the checks) | Which provider (e.g. Resend, SendGrid, Amazon SES) and which sender address/domain. Not a Blaze feature in itself, but every alert depends on it. |
| SMS / WhatsApp alerts to agents | Provider (e.g. Twilio, Clickatell, WhatsApp Business API) and budget. |
| Approving a test listing in moderation during the photo test | It writes a **permanent** audit-trail entry (entries cannot be deleted). Approve, or test up to "Submitted" only. |
| Stats retention | Decided: 13 months (2026-11-12). |
| Scheduler | Decided: Vercel Cron (2026-11-12); Cloud Scheduler later for frequent uptime checks. |

## 4. Not unlocked by Blaze (still separate work)

Online payment (pricing phase 4), sold-price data (paid Lightstone / Deeds feed), agency principal view (F4 approval),
agent verification (F3 approval), Saved Searches, listing edit screen.
