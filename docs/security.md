# Security Overview

## Purpose

Defines the **security principles and rules** of the system to ensure a **secure-by-design implementation**.

---

## Foundation

Based on:

- OWASP Top 10
- OWASP Cheat Sheet Series
- Defense in Depth

---

## Core Principles

- Never trust input
- Validate early (server-side only)
- Enforce authorization on every request
- Minimize attack surface
- Separate security concerns

---

## OWASP Risks (Handled)

- Access Control → enforce ownership checks
- Injection → use Prisma, no dynamic queries
- Auth Failures → use secure auth (no custom logic)
- Misconfiguration → secure defaults, headers
- Vulnerabilities → keep dependencies updated
- Logging → track security events

---

## Input & Output

- Validate all input (e.g. Zod)
- Reject invalid data
- Encode output (prevent XSS)
- Never return unsafe data

---

## Authentication & Authorization

- Use established auth solution
- Hash passwords
- Enforce access control server-side
- Users can only access own data

---

## Rate Limiting

- Apply rate limiting per API route
- Define endpoint-specific limits
- Protect sensitive endpoints (e.g. login)

Purpose:

- prevent abuse
- mitigate brute force attacks
- protect system resources

---

## HTTP & Infrastructure

- HTTPS only
- Use security headers (CSP, HSTS, etc.)
- Restrict CORS
- Keep DB and internal services private

---

## Logging

Log:

- login (success/failure)
- logout
- password changes
- authorization failures

Rules:

- no sensitive data in logs
- use structured logging

---

## Dependencies & Secrets

- keep dependencies updated
- avoid insecure packages
- never hardcode secrets
- use environment variables

---

## Summary

- validate input
- encode output
- enforce authorization
- isolate logic
- reduce exposure
- log security events
- apply rate limiting
