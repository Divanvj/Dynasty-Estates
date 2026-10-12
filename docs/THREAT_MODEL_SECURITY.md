# Dynasty Estates - Security Architecture & Threat Model

**Organisation:** Tricore Enterprises  
**Platform:** Dynasty Estates  
**Version:** 1.0  
**Phase:** 0 - Product Definition and Architecture  
**Date:** September 2026  

---

## 1. Threat Modeling (STRIDE Methodology)

| STRIDE Category | Potential Threat | Mitigation & Security Control |
|---|---|---|
| **Spoofing** | Adversary imitates a verified real estate agent or seller to post fraudulent listings. | Strict identity verification, agent FFC / PPRA registration checks, multi-factor authentication, verified agency domain email validation. |
| **Tampering** | Malicious user alters asking price, title deed details, or status of a listing they do not own. | Row Level Security (RLS) / Firestore security rules enforce `request.auth.uid == resource.data.creator_id`. Server-side validation of all state transitions. |
| **Repudiation** | An agent denies rejecting an offer or altering listing details; moderator denies an unlawful deletion. | Immutable append-only `AuditLog` capturing actor UID, timestamp, IP address, resource identifier, and JSON payload diff. |
| **Information Disclosure** | Unauthorized harvesting of seller contact details, private buyer collections, or draft listings. | Public APIs redact private seller telephone numbers and physical exact street numbers until confirmed viewing; private collections locked by membership policy. |
| **Denial of Service** | Bot flooding image upload endpoints or high-cost vector similarity queries. | Edge rate limiting, maximum file upload size (10MB), client-side pre-compression, asynchronous background worker queue. |
| **Elevation of Privilege** | Standard buyer manipulates JWT / client tokens to gain admin or moderation privileges. | Custom claims set only via privileged server SDKs; database rules check token claims or separate secure `roles` collections, never client-supplied parameters. |

---

## 2. South African POPIA Compliance Framework

The Protection of Personal Information Act (POPIA) imposes strict legal obligations regarding personal information handling:

1. **Accountability**: Designating an Information Officer, maintaining continuous audit logs.
2. **Processing Limitation**: Personal data (e.g. buyer identity, phone numbers, search histories) is gathered only with explicit consent and for defined discovery purposes.
3. **Purpose Specification**: Data collected for viewing arrangements is not repurposed for unsolicited third-party marketing without opt-in consent.
4. **Information Quality & Access**: Users have full self-service rights to inspect, export, or correct personal profile information.
5. **Security Safeguards**:
   - Data in transit: Enforced TLS 1.3 encryption with HSTS.
   - Data at rest: AES-256 database encryption.
   - EXIF Sanitization: Property photograph GPS and metadata stripped before public storage delivery to protect private seller privacy.
6. **Data Subject Participation (Right to Erasure)**: An automated account deletion workflow that purges personal identifiers, anonymizing historical transaction logs.

---

## 3. Storage & Media Security Rules

```text
Upload Request
  │
  ├── 1. Content-Type & Magic Byte Validation (JPEG, PNG, WebP only)
  ├── 2. Size Limit Check (Max 10MB per file)
  ├── 3. EXIF & Geolocation Metadata Stripping (Pillow / Sharp)
  ├── 4. Perceptual Hashing (dHash calculation for duplicate detection)
  └── 5. Secure CDN Storage with randomized content UUID
```

