# Dynasty Estates - Screen & Route Inventory

**Organisation:** Tricore Enterprises  
**Platform:** Dynasty Estates  
**Version:** 1.0  
**Phase:** 0 - Product Definition and Architecture  
**Date:** September 2026  

---

## 1. Route Matrix & Access Control

| Route | View Name | Access Control | Purpose & Key Components |
|---|---|---|---|
| `/` | Flagship Home | Public | Hero search, curated prestige collections, market ticker, AI Concierge teaser, Obsidian Glass navigation. |
| `/search` | Property Discovery | Public | Multi-parameter filters, synchronized split map/list view, sorting, pagination, save action. |
| `/property/[slug]` | Property Detail | Public | Image-led media showcase, True Cost bond calculator, amenity badges, schedule viewing modal, agent contact. |
| `/map-search` | Dedicated Geospatial Map | Public | Full-screen interactive map, boundary clustering, Draw-Search polygon tool, quick preview cards. |
| `/calculators` | Affordability & True Cost | Public | South African bond repayment calculator, transfer duty calculation, municipal rates and levies breakdown. |
| `/progress` | Engineering Command Centre | Public / Team | Live repository-backed verification tracking progress across all 16 delivery phases. |
| `/auth/login` | Sign In | Public | Email/Password and OAuth credentials, session restoration, redirect to intended target. |
| `/auth/signup` | Registration | Public | Role onboarding selection (Buyer, Seller, Agent), terms acceptance, verification email dispatch. |
| `/saved` | Saved Homes | Authenticated | Buyer shortlist, price-drop badges, quick inquiry trigger, remove from saved. |
| `/collections` | Collaborative Collections | Authenticated | Shared shortlists ("Our First Home"), member invitation modal, vote badges (Like/Love/Reject), comment threads. |
| `/compare` | Side-by-Side Comparison | Authenticated | Multi-property comparison matrix (asking price, price/m², beds, baths, solar, levies). |
| `/inquiries` | Buyer Inquiry History | Authenticated | Status tracking for sent property inquiries and scheduled viewing requests. |
| `/seller/portal` | Seller Dashboard | Seller / Agent | Summary of draft and active listings, total view impressions, inquiry count, quick actions. |
| `/seller/listings/new` | Listing Creation Wizard | Seller / Agent | 15-stage autosaving wizard, location geocoding, feature selection, media upload, preview, moderation submission. |
| `/agent/dashboard` | Agent Command Console | Agent / Agency Admin | Portfolio listing management, real-time leads inbox, viewing approvals, Listing Quality Score metrics. |
| `/admin` | Platform Administration | Moderator / Admin | User verification queues, listing moderation, duplicate image alerts, taxonomy governance, audit logs. |

---

## 2. Page State & Interaction Inventory

Every major route implements comprehensive UI states:
1. **Initial / Loading State**: Frosted glass skeleton cards with subtle shimmer animations, preventing layout shift.
2. **Populated State**: High-contrast typography, large property photography with controlled hover zoom (`scale-105`), active badge indicators.
3. **Empty State**: Purpose-built empty screen states with actionable calls to action (e.g. *"You haven't saved any homes yet — explore curated Pretoria estates"*).
4. **Error & Fallback State**: Non-blocking in-line notifications with retry actions, preserving entered form data.
5. **Reduced Motion**: Respects `prefers-reduced-motion` media queries by disabling transforms and parallax effects.

