# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Buyers and renters** in South Africa searching homes for sale and to rent.
- **Private sellers and landlords** listing a property themselves.
- **Agents** (registered property practitioners) managing mandates and enquiries.
- **Admins** moderating listings, fraud signals and support requests (`/admin`).
- **Developers** — the owner (Tricore Enterprises) and the Claude agents on both
  development PCs — who run the platform from the developer console (`/console`):
  checking app health, errors, deploys, Firebase state and data integrity before
  and after each merge.

## Product Purpose

Dynasty Estates is a South African property marketplace. Success for buyers is
finding and contacting the right home quickly; for the platform team it is a
site that stays up, stays honest about what works, and moves through releases
without breaking.

## Positioning

Energy resilience (solar, water) and the true monthly cost of a home are shown
on every listing; "Agent" is a verified legal status under the Property
Practitioners Act, never a self-selected preference.

## Operating Context

- Next.js 16 / React 19 / Tailwind v4 on Vercel (manual deploys), Firebase Auth
  and Firestore on the free Spark plan (project `dynasty-estates`).
- Two Claude agents on two PCs share one GitHub repo (`COLLABORATION.md`,
  `WORKING_ON.md`). Roles come from the Firebase `role` custom claim.
- Spark plan limits: no Cloud Storage bucket (no listing photos), no Cloud
  Functions or scheduled jobs. These stay blocked until the Blaze plan.

## Capabilities and Constraints

- Roles: buyer, seller, agent, admin, developer. Developer is a platform role:
  it opens the console, not the moderation tools.
- The console reads live data only. Nothing is mocked; a source that is not
  connected is shown as not connected, with what is needed to connect it.

## Brand Commitments

- Name: Dynasty Estates. Logo only through `<BrandLogo />`.
- Premium, modern, sleek, trustworthy; avoid excessive glow, clutter and
  unnecessary animation. Deep teal brand, champagne second accent.
- The developer console is always dark.

## Evidence on Hand

Live Firestore and Auth data in project `dynasty-estates` (small: a handful of
accounts, no published listings yet). No testimonials, customers or metrics
beyond what the database holds; never fabricate them.

## Product Principles

1. Honest over impressive: show real state, including gaps and blockers.
2. Improve, don't rebuild: reuse existing routes, components and tokens.
3. One application: everything merges into the same repo and deploy.
4. Every privileged action leaves a record.

## Accessibility & Inclusion

Body text ≥ 4.5:1 contrast in both themes, 14px type floor, keyboard focus
visible, touch targets usable at 375px.
