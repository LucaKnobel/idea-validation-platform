---
description: Security rules for input validation, authentication, authorization, and secure coding practices
applyTo: "**"
---

# Security Instructions

## Purpose

Defines mandatory security rules for the entire application.

See:

- [Security Documentation](/docs/security.md)

---

## Core Principles

- Never trust input
- Validate all data server-side
- Enforce authorization on every request
- Minimize attack surface
- Follow defense-in-depth

---

## Input Validation

- must validate all input using schemas (e.g. Zod)
- must run before business logic
- must reject invalid or unexpected data

Location:

```txt
server/api/schemas/
```

---

## Output Handling

- must encode output where necessary (prevent XSS)
- must not return unsafe or unvalidated data
- must not expose internal structures

---

## Authentication

- use established authentication solution
- never implement custom auth logic
- passwords must be securely hashed
- sessions must be securely managed

---

## Authorization

- must be enforced on every protected endpoint
- must validate resource ownership
- users may only access their own data

---

## Rate Limiting

- must be applied at API layer
- must run at start of request handling
- must be defined per endpoint

Identification:

- authenticated → user ID
- unauthenticated → IP address

---

## API Security

- always validate input
- always map DTOs
- never expose internal models
- never trust client-side data

---

## HTTP Security

- HTTPS only
- use secure HTTP headers (CSP, HSTS, etc.)
- restrict CORS

---

## Logging

must log:

- login attempts (success/failure)
- authorization failures
- security-relevant events

rules:

- never log sensitive data
- use structured logging

---

## Dependencies

- keep dependencies up to date
- avoid insecure or deprecated packages
- monitor vulnerabilities

---

## Secrets

- never hardcode secrets
- use environment variables
- restrict access to sensitive configuration

---

## Data Protection

- protect sensitive data
- minimize stored personal data
- follow applicable data protection regulations

---

## Key Rules

- validate input
- encode output
- enforce authorization
- protect endpoints
- never trust client data
- apply rate limiting
