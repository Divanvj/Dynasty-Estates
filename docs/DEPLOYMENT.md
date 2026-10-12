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

## 3. Database Migration & Deployment Procedure

1. **Pre-flight Check**:
   ```bash
   npm run lint
   npm run build
   ```
2. **Apply Security Rules**:
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```
3. **Execute Production Build & Deployment**:
   ```bash
   vercel --prod
   ```
4. **Health Check Validation**:
   - Query `https://dynastyestates.co.za/api/progress` to verify system health and release version.

---

## 4. Rollback Procedure

If a critical incident or regression occurs post-deployment:
1. **Instant Web Rollback**: In the Vercel/Hosting dashboard, designate the previous production deployment as the Instant Active Alias (under 15 seconds).
2. **Database Schema Rollback**: Revert any non-additive migrations using pre-tested down-migrations. Additive schema migrations should maintain backward compatibility with previous client versions.
3. **Audit Incident**: Record root cause analysis in `docs/INCIDENT_LOG.md`.

