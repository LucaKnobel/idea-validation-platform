---
description: Compact architecture rules for Clean Architecture and project structure
applyTo: "**/server/**"
---

# Architecture Instructions

## Purpose

Defines **mandatory architecture rules** for backend code.

See full details:

- [Architecture Documentation](/docs/architecture.md)

---

## Architecture Style

3-layer Clean Architecture:

1. Application Business Rules
2. Interface Adapters
3. Frameworks & Drivers

---

## Dependency Rule

```txt
Infrastructure → API → Application
```

Forbidden:

- Prisma in application
- Nuxt in application
- business logic in API

---

## Layer Rules

### Application (`server/application/`)

- models → domain only
- services → business logic
- interfaces → abstractions

Rules:

- no HTTP
- no Prisma
- no framework code

---

### API (`server/api/`)

- handlers = controllers
- schemas = validation
- mappers = DTO ↔ model
- rate-limit = request protection

Rules:

- no business logic
- no DB access

---

### Infrastructure (`server/infrastructure/`)

- Prisma
- repositories
- external services

Rules:

- implements interfaces only
- no business logic

---

## Request Flow

```txt
API → Rate Limit → Validation → Mapping → Service → Repository → Prisma
```

---

## Rate Limiting

- located in `server/api/rate-limit/`
- applied at start of handlers
- uses:
  - user ID (authenticated)
  - IP (unauthenticated)

---

## DTO & Validation

- DTOs → `shared/types/`
- validation → `api/schemas/`
- mapping → `api/mappers/`

Rules:

- no internal models exposed
- no Prisma types in DTOs

---

## Key Rules

- business logic → application only
- API must stay thin
- always validate input
- always map data
- never expose internals
