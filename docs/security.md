# Dynasty Estates - Security Policy & Hardening Guidelines

This document outlines the security architecture and hardening standards for Dynasty Estates. For the complete threat analysis and POPIA compliance breakdown, see [THREAT_MODEL_SECURITY.md](./THREAT_MODEL_SECURITY.md).

## 1. Security Architecture Principles
- **Least Privilege**: Users and services operate with minimal necessary access rights.
- **Defense in Depth**: Multiple security layers (Edge rate limiting, server-side validation, database RLS).
- **Zero Trust in UI**: Never trust client-side data; validate all permissions at the database and server action boundary.
- **Privacy by Design**: POPIA-compliant personal information governance and automatic EXIF metadata sanitization.

## 2. Access Control Policies
- `buyer`: Read published listings, create/manage own saved properties, own collections, submit inquiries.
- `seller` / `agent`: Create/edit own draft listings, submit for moderation, review leads for owned listings.
- `moderator`: Review listing submissions, approve or reject listings, inspect fraud signals.
- `admin`: Full system oversight, role provisioning, audit trail review.

## 3. Incident Response & Vulnerability Reporting
Security disclosures should be directed to the security team with reproduction steps. Critical patches must be deployed via versioned migrations and CI/CD pipelines.

