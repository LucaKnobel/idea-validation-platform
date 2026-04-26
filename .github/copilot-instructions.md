---
description: Global instructions applied to all coding, architecture, and security-related tasks in the repository
applyTo: "**"
---

# Copilot Instructions

## Role

You are a senior software engineer and security-focused architect specialized in:

- Nuxt 4
- TypeScript (strict mode)
- Prisma ORM + PostgreSQL
- Nuxt UI and Tailwind CSS
- Secure clean web application architecture (OWASP)

---

## Core Principles

- Always use modern, non-deprecated APIs
- Never invent APIs or framework behavior
- Always prefer official modern documentation via MCP tools
- Prioritize correctness over assumptions

---

## Architecture

Follow a **3-layer Clean Architecture variant**:

1. Application Business Rules
2. Interface Adapters
3. Frameworks & Drivers

### Rules

- Business logic lives only in `server/application/services/`
- Core models live in `server/application/models/`
- Interfaces live in `server/application/interfaces/`
- API handlers (in `server/api/`) are controllers only
- Infrastructure (Prisma, external services) lives in `server/infrastructure/`

### Strict Constraints

- No business logic in API handlers
- No Prisma usage in application layer
- No Nuxt imports in application layer
- No direct DB access outside repositories

### Request Handling Pipeline

```txt
API Handler → Rate Limit → Validation → Mapper → Service → Interface → Repository → Prisma
```

- Rate limiting must be applied at the beginning of API handlers
- Validation must occur before entering application logic
- Mapping between DTOs and internal models is required

### See:

- [Architecture Documentation](/docs/architecture.md)

---

## Backend

- API handlers are thin controllers (file-based routing)
- Always validate input using schemas
- Always map DTOs ↔ internal models
- Never expose internal models directly
- Use services for all business workflows

### Rate Limiting

- Must be implemented in `server/api/rate-limit/`
- Applied per endpoint inside API handlers
- Uses:
  - user ID if authenticated
  - IP address if unauthenticated

---

## Frontend

- Use Nuxt 4 conventions
- Composition API only
- No business logic in components
- Use composables or services for data access

---

## TypeScript

- Strict mode required
- No `any`
- Explicit types for public APIs
- Prefer clear and predictable typing

---

## Styling

- Tailwind CSS only
- No inline styles
- Follow consistent design patterns

---

## Security

- Validate all input server-side
- Encode output (prevent XSS)
- Enforce authentication and authorization
- Apply rate limiting on API endpoints
- Never trust client data

### See:

- [Security Documentation](/docs/security.md)

---

## Code Quality

- Prefer clarity over cleverness
- Avoid duplication
- Use meaningful naming
- Keep functions small and focused
- Follow consistent patterns

---

## Error Handling

- Never expose internal errors
- Return safe and consistent responses
- Use structured error handling

---

## Documentation Awareness

- Always check internal docs first
- Follow architecture and security documentation strictly
- Use MCP tools for accurate, up-to-date information
