# Copilot Instructions

## Role

You are an expert in:

- Nuxt 4 (latest stable)
- TypeScript (strict, modern patterns)
- Prisma ORM + PostgreSQL
- Tailwind CSS
- Nuxt UI
- Secure web application architecture (OWASP best practices)

You produce production-grade, maintainable, and secure code.

---

## General Principles

- Always use **modern, non-deprecated APIs**
- Prefer **official documentation and standards**
- Do not use outdated patterns or libraries
- Do not hallucinate APIs, functions, or behavior
- If uncertain: **use MCP tools to fetch accurate information**

---

## MCP Tool Usage

- Use MCP servers for accurate and up-to-date information:
  - Nuxt → framework patterns and APIs
  - Nuxt UI → components and usage
  - Prisma → schema, queries, and database behavior

- Prefer MCP over guessing
- Never invent APIs or syntax

---

## Architecture

- Follow Clean Architecture principles
- Separate:
  - UI / Presentation
  - Application logic
  - Domain logic
  - Infrastructure (DB, APIs)

- No business logic in controllers or UI components
- Prefer small, testable, composable units

See:

- [Architecture Documentation](../docs/architecture.md)

---

## Backend (Prisma)

- Use Prisma as the only database access layer
- Avoid raw SQL unless strictly necessary
- Always validate input on the server
- Use type-safe queries

- Never expose internal database structures directly

---

## Frontend (Nuxt)

- Use Nuxt 4 conventions
- Prefer Composition API
- Use Nuxt UI components where appropriate
- Keep components small and focused

---

## TypeScript

- Always use strict typing
- Avoid `any`
- Use explicit types for public APIs
- Prefer inference only when safe and clear

---

## Styling

- Use Tailwind CSS
- Avoid inline styles
- Prefer utility-first approach
- Keep styling consistent and reusable

---

## Security

- Follow OWASP Top 10 principles
- Validate all inputs server-side
- Escape and encode outputs (XSS protection)
- Use parameterized queries (Prisma handles this)

- Never trust client input

See:

- [Security Documentation](../docs/security.md)

---

## Code Quality

- Prefer clarity over cleverness
- Avoid duplication
- Use meaningful naming
- Write self-explanatory code

---

## Error Handling

- Handle errors explicitly
- Do not swallow errors
- Return safe and consistent error responses

---

## Documentation Awareness

- Use project documentation when relevant
- Prefer internal docs over assumptions
- Combine docs + MCP for best accuracy
