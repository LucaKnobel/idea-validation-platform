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


# Repository Design Guidelines

## Responsibility Boundaries

### Repository Layer

Repositories are responsible only for:

* Database access
* Prisma queries
* Ownership filtering inside queries
* Returning entities

Repositories must not contain:

* Business rules
* HTTP concerns
* Validation logic
* Conflict handling
* Authorization responses
* NotFound responses

---

## Ownership Checks

Ownership must be enforced directly in repository queries.

Example:

```ts
async findOwnedHypothesis(
  hypothesisId: string,
  userId: string
): Promise<Hypothesis | null>
```

Example Prisma query:

```ts
where: {
  id: hypothesisId,
  ideaVersion: {
    idea: {
      userId
    }
  }
}
```

If:

* the entity does not exist
* the entity belongs to another user

the repository returns:

```ts
null
```

The repository should not distinguish between "not found" and "not owned".

---

## Repository Return Types

### Read Operations

```ts
Promise<Entity | null>
```

Examples:

```ts
Promise<Idea | null>
Promise<IdeaVersion | null>
Promise<Hypothesis | null>
Promise<Experiment | null>
Promise<Metric | null>
Promise<Measurement | null>
```

---

### Update Operations

```ts
Promise<Entity | null>
```

If the entity cannot be found or is not owned:

```ts
return null
```

---

### Delete Operations

Preferred:

```ts
Promise<boolean>
```

Example:

```ts
true
```

Entity deleted successfully.

```ts
false
```

Entity not found or not owned.

---

## Unexpected Errors

Repositories may throw only unexpected technical errors:

* Database connection failures
* Prisma exceptions
* Infrastructure failures

Example:

```ts
throw error
```

Repositories must not throw:

```ts
NotFoundError
ConflictError
ForbiddenError
ValidationError
```

---

# Service Layer Responsibilities

Services contain business logic.

Services decide:

* Success
* NotFound
* Conflict
* Validation failures

Example:

```ts
const hypothesis =
  await repository.findOwnedHypothesis(
    hypothesisId,
    userId
  )

if (!hypothesis) {
  return {
    kind: 'notFound'
  }
}
```

---

## Conflict Handling

Conflicts belong to the service layer.

Example:

A hypothesis may only have one experiment.

```ts
const existingExperiment =
  await repository.findExperimentByHypothesis(
    hypothesisId
  )

if (existingExperiment) {
  return {
    kind: 'conflict'
  }
}
```

The repository should not know what a conflict means.

---

# API Handler Responsibilities

API handlers translate service results into HTTP responses.

Example mapping:

```text
success          -> 200 / 201 / 204
validationError  -> 400
notFound         -> 404
conflict         -> 409
unexpectedError  -> 500
```

---

# Recommended Flow

```text
API Handler
    ↓
Service
    ↓
Repository
    ↓
Prisma
```

Responsibilities:

```text
Repository
    Entity | null

Service
    Business decisions

API Handler
    HTTP responses
```

---

# Design Principle

Repositories should return only:

```text
Entity
null
Unexpected exception
```

Everything else belongs to higher layers.
