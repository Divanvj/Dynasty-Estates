# Stack decision: stay on Firebase

Architecture decision record. Written 26 Nov 2026.

## Status

Accepted. Decided by the owner on 24 Nov 2026.

## Context

The original brief (the Implementation Plan and Master Prompt, kept outside
this repository) specified:

- Supabase on PostgreSQL, with row-level security as the access control;
- PostGIS for map and area search;
- pgvector for vector search;
- a Python worker for background jobs;
- an Expo (React Native) mobile app next to the Next.js web app.

`docs/SYSTEM_ARCHITECTURE.md` (September 2026) still shows that plan.

What was built is different:

- a Next.js App Router app, hosted on Vercel;
- Firebase Authentication, Cloud Firestore and Cloud Storage, in one project
  (`dynasty-estates`, on the Blaze plan since 12 Nov 2026);
- `firebase-admin` in Vercel serverless route handlers (`src/app/api`) for
  everything the browser may not do itself;
- Vercel Cron for scheduled work, and Brevo for e-mail.

There is no Supabase, PostgreSQL, PostGIS, pgvector, Python or mobile app code
in the repository. The change of stack was never written down as a decision.

## Decision

Stay on Firebase. Do not migrate to Supabase or PostgreSQL. Where the product
needs something Firebase does not do well, add a service for that one need
instead of moving the whole stack.

## Consequences

- **Security lives in the rules files.** `firestore.rules` and `storage.rules`
  decide every read and write from the browser; there is no database
  row-level security. Server routes use `firebase-admin`, which bypasses the
  rules, so each route checks its caller itself (`src/lib/server/console-auth.ts`,
  `admin-auth.ts`, `notify.ts`, `sales.ts`). `firestore.rules` is tested on the
  Firestore emulator (`npm run test:rules`, run in CI). `storage.rules` has no
  automated tests yet. Rules deploy separately from the web app
  (`npm run firebase:deploy:*`).
- **Roles are Firebase Auth custom claims.** The `role` claim (and
  `developer: true` for developer accounts) is set only by the server and
  checked by the rules and the API routes.
- **No geo index.** Listings carry no coordinates. The map places each listing
  at its suburb, city or province centre, moved by a small fixed offset so pins
  do not stack (`src/lib/geo-data.ts`). Map positions are therefore
  approximate, and radius and polygon search on `/map-search` filter those
  approximate points in the browser.
- **No vector search.** "AI Search" (`/ai-search`) reads the query with keyword
  rules (price, place, bedrooms, type, features) and filters and ranks listings
  on those fields (`src/lib/ai-concierge.ts`). No language model and no
  embeddings are involved. Duplicate-photo checks use perceptual hashes stored
  in `photo_fingerprints`, not vectors.
- **No separate worker.** Background work runs in one route,
  `/api/cron/nightly`, called by Vercel Cron once a night. It has 60 seconds per
  run, so the e-mail jobs cap how many they send and carry the rest to the next
  night.
- **No native app.** The web app is responsive. `mobile/` holds only an Expo
  `package.json`; there is no app code.
- **Search reads the whole public catalogue.** Pages load every public listing
  and filter it, rather than querying an index (server-rendered pages cache the
  list for 5 minutes). That is
  fine while the catalogue is small. A large catalogue, real geo search or
  semantic search will each need an added service, as the decision allows.
- **Moving later costs a data migration.** The data is Firestore documents and
  the access control is Firebase rules; neither carries over to another
  database as-is.
