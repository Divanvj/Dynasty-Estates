# Dynasty Estates - Production Deployment Guide & Operations Manual

**Organisation:** Tricore Enterprises  
**Platform:** Dynasty Estates  
**Version:** 1.0  
**Phase:** 0 - Architecture & Phase 14 Baseline  
**Date:** September 2026  

---

## 1. Hosting Architecture & Prerequisites

- **Web Frontend**: Vercel or cloud container running Next.js App Router (Node.js 20+ runtime).
- **Primary Database**: PostgreSQL / Supabase / Google Cloud Firestore with Row-Level Security.
- **Storage**: S3-compatible or Cloud Storage bucket with CDN edge caching.
- **Domains & SSL**: Managed Cloudflare / Vercel DNS with automatic TLS 1.3 certificates.

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env.production` and configure:

```ini
# Next.js Application Environment
NEXT_PUBLIC_APP_URL="https://dynastyestates.co.za"
NODE_ENV="production"

# Database & Firebase / Supabase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="dynasty-estates.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="dynasty-estates"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="dynasty-estates.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef"

# Admin / Service Role Credentials (Server-Side Only - Never expose to client)
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_ADMIN_CLIENT_EMAIL="admin@dynasty-estates.iam.gserviceaccount.com"

# Provider Integrations
NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ1I..."
AI_CONCIERGE_API_KEY="sk-..."
```

---

## 3. Deployment Procedure

Every change reaches the live site through a pull request into `main`.

1. **Checks.** CI runs these on every pull request and every push to `main`; run them locally before opening one:
   ```bash
   npm run lint
   npx tsc --noEmit
   npm run build
   npm run test:rules            # Firestore rules, on the local emulator (needs Java 21)
   ```
   plus the unit tests in `tests/` (see `.github/workflows/ci.yml` for the full list).
2. **Web app.** Merge the pull request into `main`. Vercel builds and deploys every push to `main`, and every pull request gets a preview deployment first: check the preview before merging. Do not run `vercel --prod` from a laptop: it uploads the working folder, untracked files included, instead of what is on `main`.
3. **Firebase rules and indexes** (owner's OK first; needs the Firebase CLI login):
   ```bash
   npm run firebase:deploy:rules      # Firestore rules
   npm run firebase:deploy:indexes    # Firestore indexes
   npm run firebase:deploy:storage    # Storage rules
   ```
   These deploy only what is on `origin/main`, refuse if your copy differs, and run the matching rule tests first. Add `-- --dry-run` to check without deploying. Never run `firebase deploy` directly: it would deploy your working copy.
4. **Check.** `GET /api/platform/build` on the live site returns the commit that is live; open a listing and check its photos load.

---

## 4. Rollback Procedure

1. **Web app.** In the Vercel dashboard, promote the previous production deployment (Instant Rollback). Then revert the bad commit on `main` with a pull request, so the next push does not bring it back.
2. **Rules.** The Firebase console keeps each project's rules history, so a previous ruleset can be republished there at once. Then revert the rules change on `main` with a pull request, so the files and the live rules agree again.
3. **Data.** There is no way to roll back data yet: Firestore point-in-time recovery and scheduled backups are not switched on (audit item 1.8). Until they are, treat any bulk data change as permanent.
4. **Record it.** Add a dated note on what happened, why and what fixed it to the Go-Live Tracker's updates (or `docs/TO-DO.md`).

