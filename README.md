# Dynasty Estates

Dynasty Estates is a South African property marketplace. Buyers and renters
search homes for sale and to rent; private sellers, landlords and agents list
them; admins moderate listings and support requests. Developers run the
platform from a console at `/console` (see `PRODUCT.md`).

The site is not launched yet. It is served from
<https://dynasty-estates.vercel.app>. Current status is in the
[Go-Live Tracker](https://claude.ai/artifact/94B8e5KTcx8CYX5R36ooGg); how the
code works is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Stack (as built)

- Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4.
- Firebase, one project (`dynasty-estates`): Authentication (e-mail and
  password, Google, phone), Cloud Firestore and Cloud Storage. The browser uses
  the Firebase client SDK; server code in `src/app/api` uses `firebase-admin`.
- Hosting on Vercel, with one Vercel Cron job (`vercel.json`).
- Maps: Leaflet with OpenStreetMap tiles.
- E-mail: Brevo, through its HTTP API (`src/lib/server/mail.ts`).
- CI: GitHub Actions (`.github/workflows/ci.yml`).

The original brief asked for Supabase/PostgreSQL. Why the build is on Firebase,
and what that means, is in [docs/STACK_DECISION.md](docs/STACK_DECISION.md).

## Prerequisites

- **Node.js 24.** `package.json` sets `"engines": { "node": "24.x" }` and CI
  uses Node 24. Some tests and scripts import `.ts` files directly, which
  needs Node's built-in type stripping.
- **npm.** The lockfile is `package-lock.json`.
- **Git.**
- **Java 21**, only for the Firestore rules tests (`npm run test:rules`). CI
  uses Temurin 21.
- **A Firebase CLI login**, only for `npm run firebase:config` and the
  `firebase:deploy:*` scripts: `npx firebase-tools login`. You do not need to
  install the CLI; the scripts fetch a pinned version (`firebase-tools@15.37.0`)
  with `npx`.
- **Values from the owner.** The service-account key and the filled-in
  `.env.local` are never in git. The owner hands them over directly
  (`COLLABORATION.md`).

## Set up and run

```bash
git clone https://github.com/Divanvj/Dynasty-Estates.git
cd Dynasty-Estates
npm install
cp .env.example .env.local      # Windows (cmd): copy .env.example .env.local
# fill in .env.local (next section)
npm run dev
```

Open <http://localhost:3000>.

**There is no separate test database.** The app has no emulator mode, so a
local dev server signs in, reads and writes against the live `dynasty-estates`
project. Anything you create locally is created there. Test with a developer
account (see "Test logins" below).

What works depends on what you fill in:

| `.env.local` has | What works |
| --- | --- |
| nothing | The site starts. The catalogue is empty and sign-in does not work. |
| the six `NEXT_PUBLIC_FIREBASE_*` values | Public pages show live listings; sign-in and the signed-in pages work. |
| also `FIREBASE_SERVICE_ACCOUNT` | The console, e-mail routes, listing stats, error and speed logging, and the other `/api` routes that need `firebase-admin`. |

## Environment variables

Put them in `.env.local` locally. In production they are set in the Vercel
project's settings. Some of these are not in `.env.example` yet; add them by
hand when you need them.

**Firebase web app** (public; built into the browser bundle).
`NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`,
`NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`,
`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`.
All six must be set, or `src/lib/firebase.ts` treats Firebase as not
configured. `npm run firebase:config` prints them.

**Site address.** `NEXT_PUBLIC_SITE_URL`: the public origin used for canonical
URLs, the sitemap, Open Graph and share links (`src/lib/site-url.ts`). Leave it
blank locally. When blank it falls back to `https://dynasty-estates.vercel.app`.

**Server key.** `FIREBASE_SERVICE_ACCOUNT`: the Firebase service-account key
JSON itself, either raw on one line or base64-encoded
(`src/lib/server/firebase-admin.ts`). This is the only way to give the server
its key. Leave `FIREBASE_SERVICE_ACCOUNT_PATH` empty; a pending change removes
it. Without the key the site still runs, and features that need it show "not
connected" or return 503. Never commit the key.

**Nightly job and e-mail links** (server only, 16 characters or more each).
`CRON_SECRET`: Vercel Cron sends it to `/api/cron/nightly`; without it that
route refuses every call. `MAIL_LINK_SECRET`: signs the "stop these e-mails"
links; without it e-mails go out without the link.

**E-mail** (server only; `src/lib/server/mail.ts`). `BREVO_API_KEY` (or
`RESEND_API_KEY`, which the code also supports), `MAIL_FROM_EMAIL` (must be a
verified sender in Brevo), `MAIL_FROM_NAME` (defaults to "Dynasty Estates") and
`MAIL_ALERTS_TO` (comma-separated; receives failed-nightly-job alerts). Without
a provider key and `MAIL_FROM_EMAIL`, every e-mail is skipped and logged as
skipped. With them set, a local server sends real e-mail, so leave them out
unless you are testing e-mail.

**Console extras** (optional, server only). `GITHUB_TOKEN` raises the GitHub
API rate limit. `VERCEL_TOKEN` lets `/console/deploys` list Vercel
deployments; `VERCEL_TEAM_ID`, `VERCEL_TEAM_SLUG` and `VERCEL_PROJECT_NAME` say
which team and project to ask about (the last two have built-in defaults). `FIREBASE_STORAGE_BUCKET` overrides the bucket
the nightly file clean-up uses (default: the public storage bucket value).

**Set for you.** Vercel sets `VERCEL_GIT_COMMIT_SHA` and `VERCEL_ENV`.
`next.config.ts` sets `NEXT_PUBLIC_BUILD_SHA`, `NEXT_PUBLIC_BUILD_TIME` and
`NEXT_PUBLIC_BUILD_ENV` at build time. Do not set these yourself.

## npm scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 3000, bound to `0.0.0.0` so a phone on the same network can open it. |
| `npm run dev:alt` | The same on port 3100. |
| `npm run build` | Production build (`next build`). Do not run it in a folder whose dev server is running: both write to `.next` (`COLLABORATION.md`). |
| `npm run start` | Serves the production build on port 3000. Run `build` first. |
| `npm run lint` | ESLint over the project (`eslint.config.mjs`). |
| `npm run test:rules` | Starts the Firestore emulator for an offline `demo-` project and runs `tests/firestore-rules.test.mjs`. Needs Java 21. |
| `npm run firebase:config` | Prints the Firebase web app config for `dynasty-estates`. Needs a Firebase CLI login. |
| `npm run firebase:deploy:rules` | Deploys `firestore.rules` from `origin/main` to the live project, after running `test:rules`. |
| `npm run firebase:deploy:indexes` | Deploys `firestore.indexes.json` from `origin/main`. |
| `npm run firebase:deploy:storage` | Deploys `storage.rules` from `origin/main`. |

The type check is not an npm script. Run it as CI does: `npx tsc --noEmit`.

Scripts in `scripts/` that you run with `node`:

| Command | What it does |
| --- | --- |
| `node scripts/check-pricing.mjs` | Checks the package price rules in `src/lib/pricing.ts`. |
| `node scripts/create-dev-account.mjs <email> "<name>" --key <service-account.json>` | Creates a developer account on the live project. Prints the password once. Refuses an e-mail address that already exists. |
| `node scripts/set-role.mjs <email> <buyer\|seller\|agent\|admin\|developer> --key <service-account.json>` | Sets the `role` claim on an existing account. For setting up the first developer; after that, change roles in `/console/users`. |
| `node scripts/firebase-deploy.mjs <rules\|indexes\|storage>` | What the `firebase:deploy:*` scripts call. |

## Tests

**Unit tests.** Each file in `tests/` is a plain Node script; there is no test
framework. Run one with `node tests/<name>.test.mjs`, for example
`node tests/price-drops.test.mjs`. CI runs eight of them: `domain`, `seo`,
`duplicate-detector`, `return-path`, `listing-status`, `ffc-reminders`,
`price-drops` and `unsubscribe-token`. They need no Firebase and no network.
Most import the code under test from `src/lib`. `domain`, `seo` and
`duplicate-detector` test copies of the logic written inside the test file, so
they do not check the real code.

`tests/photo-analysis.test.mjs` is run with
`node --test tests/photo-analysis.test.mjs`. It needs `npm install` first (it
uses `sharp`, which comes with Next.js). CI does not run it yet.

**Firestore rules tests.** `npm run test:rules` checks every role against
`firestore.rules` on the local emulator. It needs Java 21 and takes about two
minutes. It never touches the live project. Things the rules allow but should
not are printed as "gaps" and do not fail the run; set `RULES_STRICT=1` to make
them fail. `storage.rules` has no automated tests yet.

**CI** runs on every push and pull request to `main`: `npm ci`, lint, the type
check, the eight unit tests, then the rules tests.

## Deploys

See [DEPLOYMENT.md](DEPLOYMENT.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
The environment-variable list in `docs/DEPLOYMENT.md` is out of date; use the
list above.

- **Web app.** Vercel is connected to the GitHub repository and deploys every
  push to `main`. `GET /api/platform/build` on the live site returns the commit
  it was built from.
- **Firebase rules and indexes.** Get the owner's OK first, and say so in
  `WORKING_ON.md`: a rules deploy changes the live app for everyone at once.
  Then run `npm run firebase:deploy:rules` (or `:indexes`, `:storage`). The
  script fetches `origin/main` and deploys that version, not your working copy.
  It stops if your copy of the file differs from `origin/main`. For Firestore
  rules it runs `npm run test:rules` first. Add `-- --dry-run` to check with
  Firebase without deploying. It needs a Firebase CLI login; the
  service-account key cannot deploy.
- **Nightly job.** `vercel.json` schedules `/api/cron/nightly` at 00:00 UTC
  (02:00 SAST). It deploys with the web app.

## Working on this repository

Two Claude agents work on this project on two machines. Read
[COLLABORATION.md](COLLABORATION.md) before you edit anything. In short:

- GitHub is the only shared copy. Pull before you start.
- Claim your area in [WORKING_ON.md](WORKING_ON.md) before writing code, and
  push the claim.
- Work on a branch named `<machine>/<task>`, where the machine is its computer
  name (`$env:COMPUTERNAME` on Windows), for example
  `DESKTOP-1794DH9/docs-3.1`.
- Commit small, merge back into `main` the same day, and keep `main` green.
- The repository is public. Never commit `.env.local`, service-account keys,
  tokens or passwords.

**Test logins.** Use a developer account, one per machine. Sign in at
`/auth/login`, then switch role with the "Developer" pill at the bottom left of
every page, or the "Use the site as" block in the `/console` sidebar. Switching
changes the account's real `role` claim, so the rules treat it as that role. To
create an account, use `scripts/create-dev-account.mjs` (above). Keep its
password out of the repository.

## Where things live

| Path | What is there |
| --- | --- |
| `src/app` | Pages and layouts (App Router): public pages, the signed-in areas (`seller`, `agent`, `agency`, `admin`, `saved`, `alerts` and others), and `console`. |
| `src/app/api` | Route handlers: the server side of the app (listed in `docs/ARCHITECTURE.md`). |
| `src/components` | Shared React components. |
| `src/lib` | Shared logic and the Firebase client (`firebase.ts`), listing loading (`property-data.ts`), types (`types/`). |
| `src/lib/server` | Server-only code: `firebase-admin`, caller checks for API routes, e-mail, telemetry, the nightly jobs. |
| `src/instrumentation.ts` | Sends server errors to the console's error log. |
| `tests` | Unit tests and the Firestore rules tests. |
| `scripts` | Deploy, account and pricing scripts. |
| `docs` | Documentation (below). |
| `firestore.rules`, `storage.rules`, `firestore.indexes.json`, `firebase.json` | Firebase security rules, indexes and CLI config. |
| `vercel.json` | The cron schedule. |
| `public` | Images and icons. |
| `mobile` | Only a `package.json` for an Expo app. There is no app code. |

## Documentation

As built:

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): request paths, who may read
  and write what, API routes, nightly job, e-mail, telemetry, console.
- [docs/STACK_DECISION.md](docs/STACK_DECISION.md): why Firebase, and what
  follows from it.
- [COLLABORATION.md](COLLABORATION.md) and [WORKING_ON.md](WORKING_ON.md):
  how the two machines work together, and who is working on what.
- [DEPLOYMENT.md](DEPLOYMENT.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md):
  deploys.
- [PRODUCT.md](PRODUCT.md): users, purpose, principles.
- [docs/TO-DO.md](docs/TO-DO.md) and [docs/HANDOVER.md](docs/HANDOVER.md): the
  build lane's working order and hand-over notes.
- [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md): notes from setting up the
  Firebase project (some steps are history).
- [docs/blaze/SETUP-PLAN.md](docs/blaze/SETUP-PLAN.md),
  [docs/console/PLAN.md](docs/console/PLAN.md),
  [docs/dashboards/](docs/dashboards/): plans for the Blaze switch-on, the
  developer console and the dashboards.
- [docs/ux-audit/](docs/ux-audit/): the UX audit and its plans.

Written in September 2026 as the plan, before the build. Where they differ from
the code, the code and the as-built docs above are right:
`docs/SYSTEM_ARCHITECTURE.md`, `docs/PRD_FUNCTIONAL_SPEC.md`,
`docs/ERD_DOMAIN_MODEL.md`, `docs/TAXONOMY_SPEC.md`,
`docs/SCREEN_ROUTE_INVENTORY.md`, `docs/TEST_STRATEGY.md`,
`docs/THREAT_MODEL_SECURITY.md`, `docs/PHASE_0_REPORT.md`.

`PROGRESS_COMPARISON.md` is superseded: it overstates what was built.
