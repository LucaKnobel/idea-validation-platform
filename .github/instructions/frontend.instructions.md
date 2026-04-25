---
description: Frontend rules for Nuxt 4, components, composables, and UI architecture
applyTo: "**/app/**"
---

# Frontend Instructions

## Purpose

Defines how frontend code must be structured and implemented.

See:

- [Architecture Documentation](/docs/architecture.md)

---

## General Rules

- Use Nuxt 4 conventions
- Use Composition API only
- Keep components small and focused
- No business logic in UI

---

## Component Rules

- components must be presentational
- no direct API calls inside components
- no business logic

Allowed:

- props
- emits
- UI state (local only)

Forbidden:

- data fetching logic
- complex transformations
- domain logic

---

## Data Fetching

- must be done via composables
- never directly in components

Location:

```txt
app/composables/
```

---

## Composables

- handle data fetching
- handle API calls
- encapsulate reusable logic

Rules:

- must be reusable
- must not contain UI code
- must return typed data

---

## API Communication

- use fetch / useFetch / useAsyncData
- always call backend API (never DB directly)
- must use typed DTOs

---

## State Management

- use local state or composables
- avoid global state unless necessary

---

## DTO Usage

- use types from:

```txt
shared/types/
```

Rules:

- do not redefine types
- do not use internal backend models

---

## UI Framework

- use Nuxt UI components
- use Tailwind CSS

Rules:

- no inline styles
- use utility classes
- keep consistent styling

---

## Routing

- use Nuxt file-based routing
- keep pages minimal
- move logic to composables

---

## Error Handling

- handle API errors gracefully
- show user-friendly messages
- do not expose internal details

---

## Security

- never trust frontend input
- never handle security logic in frontend
- always rely on backend validation

---

## Key Rules

- components = UI only
- composables = logic
- API only via backend
- use shared DTOs
- no business logic in frontend
