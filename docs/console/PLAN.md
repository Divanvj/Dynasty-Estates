# Developer console — plan

Owner request (2026-11-09): a developer/admin console like the Credicore
Control Center, with a new **developer** role, showing overall app health.
Build everything that works on the Spark plan; show Blaze-only parts as locked
with the reason.

## Decisions

| Question | Decision |
| --- | --- |
| Where | Same app, `/console` route. One repo, one deploy. Site header and tab bar hidden there. |
| Who | `role` claim `developer` or `admin`. Owner's own account (`dev@tricore.enterprises`) gets `developer`. |
| Theme | Always dark (`.dark` scoped to the console root). |
| `/admin` | Unchanged. The console links to it; moderation stays there. |
| Data access | All console data goes through server route handlers using `firebase-admin`, after verifying the caller's ID token and claim. No Firestore rule grants a developer anything, so **no rules deploy is needed**. |
| New collections | `app_errors`, `app_error_groups`, `web_vitals`, `console_events`, `platform_config`. Server-only (admin SDK); clients have no rule, so default deny. |
| Credentials | `FIREBASE_SERVICE_ACCOUNT` (JSON or base64) on Vercel; `FIREBASE_SERVICE_ACCOUNT_PATH` locally. |
| Dependency | `firebase-admin` moves from devDependencies to dependencies (server routes need it at runtime). No new packages. |

## Sections

| Group | Page | Source |
| --- | --- | --- |
| Overview | Dashboard `/console` | Needs-attention strip; tiles Users · Listings · Activity · Queues · Errors · Platform; Daily/Weekly/Monthly vs previous period |
| Overview | Go-live `/console/go-live` | Computed checklist: Blaze/Storage, rules & index drift, env, authorised domains, production behind main, public test passwords, IAM |
| Monitoring | Errors `/console/errors` | `app_errors` grouped by fingerprint; resolve/reopen; send test error |
| Monitoring | Performance `/console/performance` | `web_vitals` p75 per metric and route |
| Monitoring | Event log `/console/events` | Categorised merge of auth, listings, enquiries, applications, support, audit_logs, console_events, app_errors, GitHub commits |
| Platform | Deploys & code `/console/deploys` | Build SHA (build-time env), GitHub main/CI/compare, WORKING_ON claims, optional Vercel API |
| Platform | Firebase `/console/firebase` | Deployed rules vs repo (normalised), indexes vs `firestore.indexes.json`, auth providers, authorised domains, collection sizes, blocked services |
| Platform | Data integrity `/console/integrity` | On-demand scans (orphans, missing profiles, claim/profile mismatch, stale drafts) |
| Operations | Users & roles `/console/users` | Auth users, claims, providers, sign-ins; change role, revoke sessions, disable; test-account health |
| Operations | Flags & maintenance `/console/flags` | `platform_config/site`; maintenance banner; feature switches read by the site |
| Operations | Tools `/console/tools` | Health check, CSV export, revalidate pages, test error |

## Telemetry added to the site

- `instrumentation.ts` `onRequestError` → server errors into `app_errors`.
- `TelemetryReporter` client component → `window.onerror`, unhandled rejections, `useReportWebVitals` → `/api/telemetry/*`.
- `error.tsx` and new `global-error.tsx` report the boundary error.
- `MaintenanceBanner` reads `/api/platform/status`.

## Blocked until Blaze (shown locked in the console)

- Cloud Storage (listing photos) and storage rules.
- Cloud Functions: scheduled uptime checks, scheduled integrity scans, alert e-mails.
- Budget alerts.

Not Blaze, but needs a grant: Firestore usage charts need the **Monitoring
Viewer** IAM role on the Admin SDK service account (currently 403).

## Status (2026-11-10)

Built and merged. Checked on the local dev server, signed in as the test admin:
dashboard figures, go-live checks, Firebase (rules match, indexes ready),
deploys (GitHub), event log, integrity scan, users list, a test error stored
and resolved, a health check, and a site switch saved, read back through
`/api/platform/status`, shown on `/ai-search`, and switched back on. Phone width
(375px) has no horizontal overflow and the menu drawer opens.

Not yet checked: a session with the `developer` claim (none exists yet), the
role-change and disable actions (not run, to avoid changing live accounts),
CSV export download, and anything on production (not deployed).

## Owner actions

1. Create the developer account: sign up on the site with
   `dev@tricore.enterprises`, then run
   `node scripts/set-role.mjs dev@tricore.enterprises developer --key <service-account.json>`
   and sign out and back in.
2. Add `FIREBASE_SERVICE_ACCOUNT` (the key JSON) to Vercel → Production, then
   deploy: `npx --yes vercel@65.2.0 deploy --prod --yes`.
3. Optional: `GITHUB_TOKEN` (higher rate limit), `VERCEL_TOKEN` (deploy list).
4. Optional: grant the service account **Monitoring Viewer** in Google Cloud IAM.
5. Rotate the test-account passwords: they are in the public repo
   (`scripts/seed-firebase-roles.mjs`); the go-live checklist flags it.
