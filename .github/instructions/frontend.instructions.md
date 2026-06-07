---
description: Frontend rules for Nuxt 4, components, composables, and UI architecture
applyTo: "**/app/**"
---

# Frontend Architecture Instructions (Nuxt 4, Vue 3, Nuxt UI)

## Purpose

These rules define responsibilities and boundaries for frontend code in `app/**`.

Goals:

- Maintainability
- Testability
- Scalability
- Reusability
- Low coupling
- High readability
- Predictable architecture

See:

- [Architecture Documentation](/docs/architecture.md)

---

## Core Principles

### Single Responsibility

Each file has one primary responsibility.

Bad:

- One component renders UI, fetches data, validates forms, and calls APIs.
- A page contains large domain/business workflows.

Good:

- Page orchestrates.
- Components present UI.
- Composables encapsulate reusable logic.
- Server handles business rules.

### Smart vs Dumb Components

Default to dumb/presentational components.

- Input via props.
- Output via emits.
- Local UI state only.

Do not hide data loading, navigation workflows, or domain decisions inside reusable components.

---

## Responsibilities by Layer

### Pages (`app/pages/**`)

Pages are route orchestrators, not a business-logic layer.

Pages may:

- Read route params (`useRoute`).
- Trigger navigation (`useRouter`, `navigateTo`).
- Define SEO/meta (`useSeoMeta`, `definePageMeta`).
- Compose section components.
- Connect composables.

Pages must not:

- Implement domain/business rules.
- Implement API clients inline.
- Contain complex validation/transform logic.
- Grow into large multi-responsibility files.

### Components (`app/components/**`)

Components are for presentation and interaction.

Components may:

- Receive typed props.
- Emit typed events.
- Keep local UI state (`isOpen`, `selectedTab`, `expanded`).

Components must not:

- Fetch data directly.
- Contain domain logic.
- Know backend persistence details.
- Recreate shared API/validation logic.

### Composables (`app/composables/**`)

Composables hold reusable frontend logic.

Composables should contain:

- API calls and request lifecycle handling.
- Shared state and derived data.
- Form state/submit logic.
- Mapping and transformation logic needed by multiple consumers.

Composables must:

- Be reusable and focused.
- Return typed contracts.
- Avoid rendering concerns and template-specific UI markup.

---

## Data Fetching and API Communication

- Fetch through composables, not directly in components.
- Use `fetch`, `useFetch`, and `useAsyncData` appropriately.
- Call backend APIs only, never database APIs from frontend.
- Centralize endpoint access per domain (`useIdeas`, `useHypotheses`, `useMetrics`, etc.).
- Keep network logic out of templates and page markup.

Avoid scattered calls like:

- `await $fetch('/api/ideas')`
- `await $fetch('/api/hypotheses')`
- `await $fetch('/api/metrics')`

across multiple components/pages without a composable boundary.

---

## Forms Architecture

Split form concerns clearly:

- Component: layout, fields, interaction wiring.
- Composable: schema integration, submit flow, request state, transformations, error mapping.

Use Nuxt UI form primitives where applicable:

- `UForm`
- `UFormField`
- `UInput`
- `UTextarea`
- `USelect` / related selection components
- `UButton`

Validation rules belong in shared validation composables/helpers, not inline in templates.

---

## Nuxt UI First Policy

Prefer Nuxt UI components whenever they cover the use case.

Examples:

- Layout/surfaces: `UCard`, `UContainer`, `USeparator`
- Actions: `UButton`, `UDropdownMenu`
- Status/data chips: `UBadge`, `UAvatar`, `UAlert`
- Overlay: `UModal`, `USlideover`, `UTooltip`, `UPopover`
- Data views: `UTable`, lists, pagination controls
- Feedback: `UProgress`, `USkeleton`, toast patterns

Rules:

- Prefer Nuxt UI composition over custom HTML/Tailwind when equivalent components exist.
- Keep component usage simple and consistent (shared `size`, `variant`, `color` conventions).
- Do not put business logic directly into Nuxt UI components.
- Avoid over-customization that bypasses Nuxt UI design tokens.

### Nuxt UI MCP Verification Rule (Latest API)

Before introducing or changing Nuxt UI usage in code:

- Validate current component API (props/slots/events) via Nuxt UI MCP tools.
- Use MCP docs as the source of truth for version-current behavior.
- Prefer guidance aligned with Nuxt UI v4 APIs and naming.

---

## State Management

- Keep local UI state local.
- Move shared cross-component state into composables.
- Use global state only when truly needed by multiple distant areas.

Heuristic:

- Local concern: `ref` in component.
- Feature concern: feature composable.
- App-wide concern: shared state (`useState`) with clear ownership.

---

## Typing and DTO Rules

- Use TypeScript strictly.
- Prefer explicit interfaces/types for public composable contracts.
- Use DTOs from `shared/types/**`.
- Do not redefine backend DTOs in frontend files.
- Never use internal backend models on frontend.
- Avoid `any`.

---

## Computed, Watch, and Derived State

- Prefer `computed` for derived values.
- Use `watch` only for side effects.
- Avoid template-heavy inline logic when it harms readability.
- Keep transformation logic in composables when reused or non-trivial.

---

## Component Extraction Guidelines

Extract a component when there is:

- A distinct UI responsibility.
- A named section/block with its own purpose.
- Reuse potential.
- Significant readability gain.

Do not extract when:

- The markup is tiny and single-purpose.
- Extraction increases indirection without reuse or clarity.

---

## Feature-Oriented Structure

Organize by feature/domain for larger areas.

Prefer:

- `components/idea-workspace/*`
- `components/hypotheses/*`
- `composables/useHypotheses.ts`

over purely technical buckets that become large and mixed in big projects.

---

## Error and Loading UX

- Handle API failures gracefully.
- Show user-safe error messages.
- Do not expose internal details.
- Always provide loading and empty states for asynchronous views.
- Keep feedback patterns consistent across features.

---

## Security Boundaries (Frontend)

- Never trust frontend input.
- Never implement security-critical rules on frontend.
- Always rely on backend validation and authorization.
- Keep sensitive details out of logs and UI error output.

---

## Anti-Patterns (Do Not Introduce)

- Direct API calls inside presentational components.
- Business logic inside pages/components.
- Massive pages with mixed responsibilities.
- Duplicated fetch/submit logic across features.
- Type duplication for shared DTOs.
- Custom UI primitives where Nuxt UI already provides stable equivalents.

---

## Quick Decision Rule

- Page: which feature sections are shown and how they are wired.
- Component: how a section looks and emits interaction.
- Composable: how the feature works on the frontend.
- Server: what business rule is enforced.

If code breaks this boundary, refactor before adding more functionality.
