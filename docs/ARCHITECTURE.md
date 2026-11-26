# Architecture (as built)

How the code on `main` works, written 26 Nov 2026 from commit `d87f9c4`. Why
the stack is Firebase rather than the brief's Supabase is in
[STACK_DECISION.md](STACK_DECISION.md). Set-up and commands are in the
[README](../README.md).

## Overview

One Next.js App Router app, hosted on Vercel, and one Firebase project
(`dynasty-estates`) holding Authentication, Firestore and Storage.

```text
Browser ──── Firebase client SDK ─────────────► Auth, Firestore, Storage
   │           (as the signed-in user; firestore.rules and storage.rules decide)
   │
   └──── fetch /api/*, with the Firebase ID token ──► route handlers (src/app/api)
                                                        │ firebase-admin (bypasses the rules)
                                                        ▼
                                                      Auth, Firestore, Storage, Brevo

Server-rendered public pages ── Firebase client SDK, signed out ──► Firestore (public listings)
Vercel Cron ── /api/cron/nightly ── firebase-admin, Brevo
```

## Request paths

**Public pages.** `/`, `/search`, `/for-sale/...`, `/to-rent/...`,
`/property/[slug]` and the sitemap are server components. They call
`getPropertyList()` in `src/lib/property-data.ts`, which uses the Firebase
client SDK with no signed-in user. It can therefore read only what the rules
let anyone read: `properties` whose status is Published, Under offer, Sold or
Rented. The home, for-sale, to-rent and sitemap pages re-render at most every
5 minutes (`revalidate = 300`). `/search` caches the list for 5 minutes
(`unstable_cache`), renders the first results on the server, and filters and
sorts in the browser. `/property/[slug]` loads the same list and picks the
listing by slug or id. If Firebase is not configured the list is empty; if the
query fails the page errors. There is no sample data to fall back on.

**Browser-only pages.** `/map-search` and `/ai-search` are client components
that call `getPropertyList()` in the browser.

**Signed-in pages.** `/saved`, `/collections`, `/inquiries`, `/alerts`,
`/seller/*`, `/agent/*`, `/agency/*` and `/admin/*` are client components. They
read and write Firestore and Storage directly with the client SDK, as the
signed-in user, so the rules decide what succeeds. `RoleGuard`
(`src/components/role-guard.tsx`) hides a page from the wrong role, but it is
only a display check. Some of these pages also call the API routes below.

**API routes.** The browser sends the user's Firebase ID token as
`Authorization: Bearer <token>`. The route verifies it with `firebase-admin` and
checks the role itself. `firebase-admin` bypasses the rules, so that check is
the only guard. The checks live in `src/lib/server/console-auth.ts` (console),
`admin-auth.ts` (admin), `notify.ts` (`signedInCaller`, any signed-in account)
and `sales.ts` (listing owner or admin).

## Roles

The role is the `role` custom claim on the Firebase ID token: `buyer`,
`seller`, `agent`, `admin` or `developer`. A developer account also carries
`developer: true`; it can switch its `role` to test as another role
(`/api/console/test-role`) and keeps the console while it does. `users/{uid}.role`
mirrors the claim for display only. Claims are set only on the server: from
`/console/users`, by `/api/admin/practitioners` when an agent is verified, or
by `scripts/set-role.mjs`.

## Who may read and write what

A summary of `firestore.rules`. The file is the authority.

| Collection | Read | Write |
| --- | --- | --- |
| `properties` | Anyone, if Published, Under offer, Sold or Rented. The owner sees their own. Agents and admins see all. | Create: only developer accounts for now (`mayStartListing()`: a new listing needs a paid package, and online payment is not built). The owner may save it as Draft, Submitted, Paused or Archived, and may not set `example`, `sale` or `agentId`. Agents and admins may change any listing. |
| `physical_properties` | Anyone | The creator; agents and admins. |
| `users/{uid}`, `users/{uid}/savedProperties` | The account itself | The account itself. No deletes. |
| `inquiries` (enquiries) | The sender, the listing owner, the assigned agent, the owner's agency principal, admins. | The signed-in sender files one as `new`. The owner or assigned agent moves its status; an agency principal assigns it; admins may delete. |
| `applications` (tenancy) | The applicant, admins | The applicant files one, with credit consent. Admins update. No deletes. |
| `collections` | The owner | The owner. |
| `support_requests` | The sender, admins | The sender files one; admins update. |
| `practitioners` | The practitioner, admins | The practitioner files their own as `pending`. Only `/api/admin/practitioners` verifies or rejects. |
| `agencies`, `agency_invites`, `agency_members` | The principal; members; an invited agent sees their own invitation | A verified agent registers an agency; the principal invites; the invited agent joins. |
| `photo_fingerprints` | Any signed-in account | Filed once, by the listing's owner. Agents and admins may delete. |
| `listing_stats` | The listing owner, their agency principal, admins | Server only (`/api/track`). |
| `audit_logs` | Agents, admins | Agents and admins append entries as themselves. Never edited or deleted. |
| Everything else: `sales`, `saved_searches`, `price_watch`, `email_prefs`, `email_verification`, `mail_log`, `console_events`, `app_errors`, `app_error_groups`, `web_vitals`, `platform_config` | No client access (no rule matches) | Server only, through `firebase-admin`. |

`storage.rules`: `listing-photos/{ownerId}/...` and `floor-plans/{ownerId}/...`
are public to read. Only the owner may upload, once per file name (no
overwrite), up to 10 MB, in the allowed file types. The owner or an admin may
delete. Every other path is closed.

`npm run test:rules` tests `firestore.rules` on the emulator. `storage.rules`
has no automated tests yet.

## API routes (`src/app/api`)

**Developer console** (developer account or `admin` claim, through
`consoleRoute` in `console-auth.ts`): `console/config`, `deploys`, `email`,
`errors`, `events`, `firebase`, `go-live`, `health`, `integrity`, `me`,
`overview`, `storage`, `test-role`, `tools/export`, `tools/revalidate`,
`users`, `vitals`.

**Admin** (`admin` claim): `admin/practitioners` (POST) verifies or rejects an
agent's certificate application.

**Account and e-mail** (signed in, unless noted): `auth/verify-email` (POST)
sends the confirm-your-address link. `email/preferences` (GET, POST).
`email/unsubscribe` (POST) works from the signed token in the e-mail, without
signing in. `saved-searches` (GET, POST, PATCH, DELETE).

**Notifications after a user's own write** (signed in): `notify/enquiry` and
`notify/agency-invite` (POST). The browser saves the record under the rules,
then calls the route. The route re-reads the record, checks the caller wrote
it, and e-mails about it at most once.

**Listings:** `listings/[id]/status` (PUT) moves a live listing between
Published and Under offer. `listings/[id]/sale` (GET, PUT, DELETE) records or
removes a sale. Both: owner or admin. `market/sales` (GET, public) returns area
figures from recorded sales.

**Platform** (public): `platform/status` (GET) returns the maintenance banner
and site switches, cached for 30 seconds. `platform/build` (GET) returns the
commit the deployment was built from.

**Telemetry and stats** (public, validated and rate-limited):
`telemetry/error`, `telemetry/vitals`, `track` (all POST).

**Cron:** `cron/nightly` (GET), below.

## Nightly job

`vercel.json` schedules `/api/cron/nightly` at `0 0 * * *`: 00:00 UTC, 02:00
SAST. Vercel sends `Authorization: Bearer $CRON_SECRET`. The route refuses
every call if `CRON_SECRET` is unset or shorter than 16 characters, refuses a
wrong token, and needs `firebase-admin`. It has 60 seconds. In order:

1. health probes against the site's public address;
2. the read-only data integrity scan;
3. deletes `listing_stats` days older than 13 months;
4. deletes listing files nothing refers to, after 30 days, and stale photo
   fingerprints;
5. saved-search alert e-mails (up to 60 a run);
6. one reminder to new accounts that have not confirmed their e-mail (up to 40);
7. price-drop alerts (up to 100);
8. certificate-expiry reminders to agents at 60, 30 and 7 days (up to 40);
9. on Mondays (SAST), the weekly listing report e-mails.

Each job runs even if an earlier one failed. Each result goes to
`console_events`, and the last run is kept in `platform_config/nightly` for the
go-live checklist. If anything failed, an alert goes to `MAIL_ALERTS_TO`.

## E-mail

`src/lib/server/mail.ts`, server only. The provider is chosen by which key is
set: `BREVO_API_KEY` (Brevo's HTTP API) or else `RESEND_API_KEY`. The sender is
`MAIL_FROM_EMAIL` and `MAIL_FROM_NAME`. Templates are in `mail-templates.ts`.

Kinds: enquiry, agency invite, ops alert, weekly report, saved search, price
drop, verify e-mail, certificate reminder, and test. Each kind except verify
e-mail and test has an on/off switch in `/console/flags`. A recipient's own
opt-outs (`email_prefs`) are respected; those e-mails carry a one-click
`List-Unsubscribe` header and a link signed with `MAIL_LINK_SECRET`. Every
attempt (sent, skipped or failed) is written to `mail_log` with the address
masked, and shown on `/console/email`. `sendMail` never throws, so a failed
e-mail never fails the work that triggered it.

## Telemetry

- **Browser errors:** the error reporter and error boundaries post to
  `/api/telemetry/error` (at most 16,000 characters, rate-limited). Stored in
  `app_errors`, grouped by fingerprint in `app_error_groups`.
- **Server errors:** `onRequestError` in `src/instrumentation.ts` writes to the
  same store (Node runtime only).
- **Page speed:** `useReportWebVitals` in `telemetry-reporter.tsx` posts to
  `/api/telemetry/vitals`; stored in `web_vitals`.
- **Listing views, saves and contact clicks:** `/api/track` adds to daily
  counts in `listing_stats`. Repeats are throttled per address in memory; the
  address is never stored.

All of it is written with `firebase-admin`. No client can read it; the console
does (`/console/errors`, `/console/performance`). Without the server key
nothing is stored.

## Developer console (`/console`)

Pages: Dashboard, Go-live checklist, Errors, Performance, Event log, Deploys
and code, Firebase, Data integrity, Users and roles, Site switches, E-mail,
Tools.

Access is decided on the server on every `/api/console/*` call: the ID token is
verified (a revoked or disabled account is refused at once), and the account
needs the developer claim or the `admin` role. The page shell only mirrors that
answer. The console reads live data through `firebase-admin` and shows "not
connected" when the key is missing. The Firebase page compares the live rules
and indexes with the files on GitHub `main`. Every write the console makes is
recorded in `console_events`.

Site switches and the maintenance banner live in `platform_config/site`. They
are changed on `/console/flags` (`PUT /api/console/config`) and read by the
site through `/api/platform/status`. If they cannot be read, everything stays
on.
