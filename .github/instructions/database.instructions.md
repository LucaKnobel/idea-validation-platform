---
description: Database and Prisma usage rules for persistence, schema design, and data access
applyTo: "**/server/**"
---

# Database Instructions

## Purpose

Defines how the database layer must be used and structured.

See:

- [Architecture Documentation](/docs/architecture.md)

---

## General Rules

- Prisma is the only database access layer
- No direct SQL unless strictly necessary
- No database access outside repositories
- No Prisma usage in application layer

---

## Prisma Usage

Location:

```txt
server/infrastructure/prisma/
```

Rules:

- initialize Prisma client here
- configure database connection
- do not spread Prisma usage across the codebase

---

## Repositories

Location:

```txt
server/infrastructure/repositories/
```

Rules:

- must implement interfaces from `server/application/interfaces/`
- are the only place where Prisma is used
- handle all persistence logic

Responsibilities:

- CRUD operations
- mapping DB → domain models
- mapping domain models → DB

Forbidden:

- business logic
- HTTP logic
- DTO handling

---

## Data Mapping

### Database → Domain

- must map Prisma results to domain models
- domain models must not contain Prisma types

### Domain → Database

- must map domain models to Prisma input
- never pass domain models directly into Prisma

---

## Schema Design

- use Prisma schema (`schema.prisma`)
- define clear relations (foreign keys)
- enforce constraints where possible

Rules:

- avoid duplication
- normalize data where reasonable
- use explicit naming

---

## Migrations

- use Prisma migrations
- keep migrations consistent and reproducible
- do not modify database manually

---

## Query Rules

- use Prisma query API
- avoid raw queries
- always use safe parameterized queries

---

## Data Integrity

- enforce constraints at DB level when possible
- ensure relations are consistent
- avoid orphaned records

---

## Performance

- select only required fields
- avoid over-fetching
- use indexes where needed

---

## Transactions

- use transactions for multi-step operations
- ensure consistency on failure

---

## Security

- never expose database structure
- never return raw Prisma results
- always map to DTOs

---

## Key Rules

- Prisma only in infrastructure
- repositories handle all DB access
- mapping is mandatory
- no direct DB usage outside repositories
- domain models must stay independent
