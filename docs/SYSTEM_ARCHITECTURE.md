# Dynasty Estates - System Architecture Specification

**Organisation:** Tricore Enterprises  
**Platform:** Dynasty Estates  
**Version:** 1.0  
**Phase:** 0 - Product Definition and Architecture  
**Date:** September 2026  

---

## 1. High-Level Architectural Topology

Dynasty Estates is engineered as a modular system with clear provider abstractions, decoupling business and domain logic from external proprietary APIs.

```mermaid
graph TD
    subgraph Client Layer
        Web[Next.js App Router Web App]
        Mobile[React Native / Expo Mobile App]
    end

    subgraph Edge & API Gateway
        EdgeRoutes[Next.js Server Actions & API Routes]
        AuthGate[Auth & Role Verification Middleware]
    end

    subgraph Core Domain & Service Layer
        PropService[Property & Listing Domain Service]
        SearchService[Hybrid Search & Geospatial Service]
        CollabService[Collections & Messaging Service]
        TrustService[Quality, Moderation & Audit Service]
    end

    subgraph External Provider Abstractions
        MapAdapter[Map Provider Adapter (Mapbox / Google Maps / Leaflet)]
        AIAdapter[AI / Vision Service Adapter (Vertex / OpenAI / FastEmbed)]
        StorageAdapter[Object Storage Adapter (S3 / Cloud Storage / Supabase)]
        PayAdapter[Payment Gateway Adapter (PayFast / Ozow / Stripe)]
        MsgAdapter[Notification Adapter (Resend / SendGrid / FCM)]
    end

    subgraph Authoritative Persistence Layer
        DB[(PostgreSQL / Supabase / Firestore with Row-Level Security)]
        VectorDB[(pgvector HNSW / Vector Index)]
        AuditLog[(Immutable Audit & Event Stream)]
    end

    Web --> AuthGate
    Mobile --> AuthGate
    AuthGate --> EdgeRoutes
    EdgeRoutes --> PropService
    EdgeRoutes --> SearchService
    EdgeRoutes --> CollabService
    EdgeRoutes --> TrustService

    SearchService --> MapAdapter
    PropService --> AIAdapter
    PropService --> StorageAdapter
    PropService --> DB
    SearchService --> VectorDB
    TrustService --> AuditLog
```

---

## 2. Layered Responsibilities

### 2.1 Web Application (Frontend)
- **Framework**: Next.js (App Router, Server Components, Client Components where interactivity requires).
- **Language**: Strict TypeScript (`noImplicitAny`, strict null checks).
- **Styling**: Tailwind CSS v4 token-driven design system (*Obsidian Glass*).
- **State & Data Fetching**: SWR / optimistic updates for snappy micro-interactions; resilient server-side rendering for SEO and fast First Contentful Paint.

### 2.2 Provider Abstraction Boundaries
No core business logic is coupled directly to a single cloud vendor:

1. **Map Provider Interface (`IMapProvider`)**:
   - `renderMap(container, config)`
   - `geocodeAddress(addressString)`
   - `queryWithinPolygon(polygonCoordinates)`
   - `calculateCommuteTime(origin, destination, mode)`
2. **AI & Vision Adapter (`IVisionProvider`, `IAIConciergeProvider`)**:
   - `extractImageFeatures(imageBuffer)`
   - `generateImageEmbedding(imageBuffer)`
   - `parseNaturalLanguageQuery(prompt)`
   - `groundedExplanation(userPreferences, listingData)`
3. **Storage Adapter (`IStorageProvider`)**:
   - `uploadMedia(file, path, metadata)`
   - `getSignedUrl(path, ttl)`
   - `deleteMedia(path)`
4. **Notification Adapter (`INotificationProvider`)**:
   - `sendEmail(recipient, template, data)`
   - `sendPushNotification(deviceToken, message)`

---

## 3. Data & Storage Tier

- **Primary Database**: PostgreSQL (via Supabase or Firestore during managed phase).
- **Geospatial Processing**: PostGIS `GEOGRAPHY(Point, 4326)` for radius, bounding box viewport calculations, and user-drawn polygon intersection.
- **Vector Embeddings**: Multimodal 512-dim or 768-dim embeddings indexed via HNSW (Hierarchical Navigable Small World) with cosine distance (`<=>`).
- **Data Isolation**: Multi-tenant data segregation enforced through database security policies (Postgres RLS / Firestore Security Rules).

---

## 4. Observability & Telemetry

- **Structured Logging**: JSON-formatted logs containing timestamp, correlation ID, user ID (pseudonymized), event type, and execution latency.
- **Error Tracking**: Client and server-side capture of unhandled exceptions with stack traces and breadcrumbs (Sentry / OpenTelemetry compatible).
- **Health Checks**: Endpoint at `/api/health` verifying database connectivity, cache response, and storage readiness.

