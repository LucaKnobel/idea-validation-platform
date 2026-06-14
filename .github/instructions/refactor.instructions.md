# REST API Refactor Migration Plan

## Purpose

The current codebase is in an inconsistent transitional state.

The Prisma schema has already been finalized and migrated, but the following layers still contain assumptions from the previous architecture:

* API routes (deeply nested)
* Inferred DTO types from legacy contracts
* Zod schemas (overly complex)
* Repositories (multiple ownership parameters)
* Use cases (hierarchical parameters)
* Mappers (outdated response formats)
* TypeScript models (duplicate definitions)
* Frontend API integrations (all composables use old nested routes)
* Tests (written for old API contract)

The purpose of this refactor is to completely align the application with the finalized Prisma schema and establish a single consistent architecture.

This is not an incremental migration.

The old implementation will be removed and replaced.

No backward compatibility layer will be maintained.

No legacy routes will remain.

No duplicate implementations will remain.

The branch may be temporarily broken during the migration.

The final goal is a clean, consistent, maintainable codebase with less complexity than before.

---

# Guiding Principles

## Principle 1: The Prisma Schema Is the Source of Truth

The Prisma schema is already finalized.

All other layers must adapt to it.

Nothing in the application layer should force changes back into the schema.

Flow:

```
Database Model
  ↓
Repositories (with ownership filters)
  ↓
Use Cases
  ↓
Mappers
  ↓
API Handlers
  ↓
Frontend
```

Contract and typing flow (in parallel):

```
API Contract
  ↓
Zod Schemas
  ↓
Inferred DTO Types (z.infer)
```

Never the other way around.

---

## Principle 2: No Legacy Compatibility

Do not maintain:

* old endpoints
* old Zod schemas and inferred DTO types
* old response shapes
* old use cases
* old repository methods

Remove them.

The application must have exactly one way to perform an operation.

---

## Principle 3: Ownership Lives in the Repository

**NOT in services, NOT in middleware, NOT in authorization layers.**

Ownership validation belongs in one place: the repository.

Pattern:

```typescript
// Repository method
async getHypothesis(userId: string, hypothesisId: string): Promise<Hypothesis | null> {
  return this.prisma.hypothesis.findFirst({
    where: buildOwnedHypothesisWhere(userId, hypothesisId)
  })
}

// Where clause builder (centralized)
function buildOwnedHypothesisWhere(userId: string, hypothesisId: string) {
  return {
    id: hypothesisId,
    ideaVersion: {
      idea: {
        userId // Ownership check
      }
    }
  }
}
```

Advantages:

- single source of truth
- impossible to forget
- no additional authorization service needed
- already exists in project (`buildOwnedIdeaVersionWhere` pattern)

**Expand this pattern to all repositories.**

---

## Principle 4: One Resource = One Endpoint

Avoid deeply nested routes.

Bad:

```text
/ideas/{ideaId}/versions/{versionId}/hypotheses/{hypothesisId}/experiments/{experimentId}/measurements/{measurementId}
```

Good:

```text
/hypotheses/{hypothesisId}
/hypotheses/{hypothesisId}/metric
/hypotheses/{hypothesisId}/experiment
/hypotheses/{hypothesisId}/measurement
```

The URL should represent the resource, not the entire ownership hierarchy.

---

## Principle 5: Model Relationships Drive API Design

Your models define which resources can exist independently:

```
Hypothesis
  ├─ Metric?       (1:1, optional)
  ├─ Experiment?   (1:1, optional)
  └─ Measurement?  (1:1, optional)
```

Therefore:

- **DO** create `/hypotheses/{id}/metric`
- **DO NOT** create `/metrics/{id}` (metric cannot exist without hypothesis)
- **DO NOT** create separate list endpoints for metrics (they're accessed via parent)

Resources live at the hierarchical level where they exist.

---

## Principle 6: Temporary Compilation Errors Are Acceptable

During migration:

* TypeScript may fail
* Tests may fail
* Frontend may fail

This is acceptable.

Do not waste time repairing obsolete code.

Refactor first.

Stabilize afterwards.

---

# Target API Design

## Ideas

```http
GET    /api/ideas
POST   /api/ideas

GET    /api/ideas/{ideaId}
PUT    /api/ideas/{ideaId}
DELETE /api/ideas/{ideaId}
```

---

## Idea Versions

```http
GET    /api/ideas/{ideaId}/versions
POST   /api/ideas/{ideaId}/versions

GET    /api/idea-versions/{versionId}
PUT    /api/idea-versions/{versionId}
DELETE /api/idea-versions/{versionId}
```

---

## Canvas Elements

```http
GET /api/idea-versions/{versionId}/canvas-elements
PUT /api/idea-versions/{versionId}/canvas-elements
```

---

## Hypotheses

```http
GET    /api/idea-versions/{versionId}/hypotheses
POST   /api/idea-versions/{versionId}/hypotheses

GET    /api/hypotheses/{hypothesisId}
PUT    /api/hypotheses/{hypothesisId}
DELETE /api/hypotheses/{hypothesisId}
```

---

## Metric

One hypothesis owns at most one metric.

Resources exist only within hypothesis context.

```http
GET    /api/hypotheses/{hypothesisId}/metric
PUT    /api/hypotheses/{hypothesisId}/metric
DELETE /api/hypotheses/{hypothesisId}/metric
```

---

## Experiment

One hypothesis owns at most one experiment.

Resources exist only within hypothesis context.

```http
GET    /api/hypotheses/{hypothesisId}/experiment
PUT    /api/hypotheses/{hypothesisId}/experiment
DELETE /api/hypotheses/{hypothesisId}/experiment
```

---

## Measurement

One hypothesis owns at most one measurement.

Resources exist only within hypothesis context.

```http
GET    /api/hypotheses/{hypothesisId}/measurement
PUT    /api/hypotheses/{hypothesisId}/measurement
DELETE /api/hypotheses/{hypothesisId}/measurement
```

---

# Migration Strategy

## Phase A – Finalize API Contract

**Duration:** 1-2 hours

**Goal:** Freeze the target API design. No code changes. Documentation only.

**Tasks:**

1. Document final routes in `docs/API_CONTRACT.md`:
  - All request/response contracts
  - Query parameters
  - Path parameters
  - Status codes (especially 404 for singleton resources that don't exist)
  - Error codes

2. Validate against Prisma schema:
  - Confirm 1:1 relationships (Metric, Experiment, Measurement)
  - Confirm ownership chains
  - Confirm no orphaned resources

3. Decide on title location:
  - Does `Idea` require title at creation? Or only `IdeaVersion`?
  - Update contract accordingly

4. Document singleton child resource pattern:
  - Metric, Experiment, Measurement are not collections
  - They use PUT (upsert), not POST
  - They return 404 if missing, not {resource: null}

**DO NOT update `openapi.yml` yet**

OpenAPI is documentation of the final state, not a plan.

Update it in Phase L after implementation is complete.

**Success:** API contract is frozen and team agrees

---

## Phase B – Create New API Folder Structure

**Duration:** 30 minutes

**Goal:** Create clean folder hierarchy without logic yet.

**Tasks:**

Create (empty handlers):

```
server/api/
  hypotheses/
   [hypothesisId]/
    metric/
      index.get.ts X
      index.put.ts
      index.delete.ts
    experiment/
      index.get.ts X
      index.put.ts
      index.delete.ts
    measurement/
      index.get.ts
      index.put.ts
      index.delete.ts
    index.get.ts
    index.put.ts
    index.delete.ts
```

Keep old folders untouched for now (will be deleted in Phase H).

**Success:** New folder structure exists

---

## Phase C – Refactor Zod Schemas

**Duration:** 1-2 hours

**Goal:** Align validation schemas with API contract and derive DTO types from schemas.

**Tasks:**

1. Review all request/query/params schemas
2. Remove schemas for deleted endpoints
3. Normalize naming by endpoint and operation
4. Replace manual DTO assumptions with inferred types
5. Ensure inferred types use `z.infer` from the canonical schema

**Success:** Zod schemas and inferred DTO types align with the API contract

---

## Phase D – Refactor Repository Layer

**Duration:** 2-4 hours

**Goal:** Simplify repositories, embed ownership filters.

**Tasks:**

1. Review all repository methods
2. Expand `buildOwnedHypothesisWhere` pattern to all repositories
3. Simplify method signatures:
  - **Before:** `getMeasurement(userId, ideaId, versionId, hypothesisId, experimentId, measurementId)`
  - **After:** `getMeasurement(userId, hypothesisId)`

4. Ensure all repositories enforce ownership in the WHERE clause:
  ```typescript
  // Example
  async getMetric(userId: string, hypothesisId: string) {
    return this.prisma.metric.findFirst({
     where: buildOwnedMetricWhere(userId, hypothesisId)
    })
  }
  ```

5. Remove redundant methods
6. Add missing query builders for new API contract

**Pattern library for where-clauses:**

```
buildOwnedIdeaWhere(userId, ideaId)
buildOwnedIdeaVersionWhere(userId, versionId)
buildOwnedHypothesisWhere(userId, hypothesisId)
buildOwnedMetricWhere(userId, hypothesisId)
buildOwnedExperimentWhere(userId, hypothesisId)
buildOwnedMeasurementWhere(userId, hypothesisId)
```

**Success:** All repositories simplified, ownership embedded

---

## Phase E – Refactor Use Cases

**Duration:** 2-3 hours

**Goal:** Remove hierarchical parameters, use simplified repositories.

**Tasks:**

1. Review all use case signatures
2. Remove unnecessary IDs:
  - **Before:** `createMeasurement(userId, ideaId, versionId, hypothesisId, experimentId, body)`
  - **After:** `createMeasurement(userId, hypothesisId, body)`

3. Update service method calls to match new repository signatures
4. Remove use cases that existed only for old route design
5. Validate business logic is preserved

**Success:** All use cases compile with new repository interfaces

---

## Phase F – Refactor Mappers

**Duration:** 1-2 hours

**Goal:** Align all response mappers with the API contract.

**Tasks:**

1. Review all `toXResponseDto` functions
2. Remove obsolete response formats
3. Align mapper output with `docs/API_CONTRACT.md`
4. Ensure null handling matches contract
5. Remove mappers for deleted endpoints

**Success:** All response mappers match API contract

---

## Phase G – Refactor API Handlers

**Duration:** 3-4 hours

**Goal:** Build new handlers from scratch.

**Tasks:**

1. For each new endpoint:
  - Parse and validate request
  - Call appropriate use case
  - Return response
  - Nothing else

2. Follow established pattern:
  ```typescript
  // Example: GET /hypotheses/{hypothesisId}/metric
  export default defineProtectedHandler(async (event, userId) => {
    const { hypothesisId } = await getValidatedRouteParams(
     event,
     HypothesisIdParamsSchema.parse
    )

    const metric = await getMetric({
     userId,
     hypothesisId
    })

    return toMetricResponseDto(metric)
  })
  ```

3. Apply rate limiting at handler start
4. Validate all inputs with Zod schemas

**Handler responsibilities:**

- Parse request
- Validate request
- Load session
- Call use case
- Return response

**NOT in handlers:**

- Business logic
- Database queries
- Authorization (ownership filters in repository)
- Response mapping (use mappers)

**Success:** All new handlers compile and pass basic tests

---

## Phase H – Restore Type Safety

**Duration:** 1-2 hours

**Goal:** `npm run typecheck` passes without errors.

**Tasks:**

1. Run `npm run typecheck`
2. Fix all import errors
3. Fix all inferred DTO type references
4. Fix all mapper errors
5. Fix all repository reference errors
6. Fix all use case reference errors

Iterate until clean.

**Success:** TypeScript compiles

---

## Phase I – Rewrite Tests

**Duration:** 3-5 hours

**Goal:** New tests that validate new API contract.

**Order:**

1. **Schema Tests** – Validate parsing and validation
2. **Inferred DTO Type Tests** – Validate request/response contract types
3. **Repository Tests** – Validate ownership filters work
4. **Use Case Tests** – Validate business behavior
5. **API Tests** – Validate endpoint behavior

**NOT:** Don't repair old tests. Delete and rewrite.

Old tests validate old behavior. They are incorrect now.

```bash
# Find old test files
find test -name "*.spec.ts" | xargs grep -l "experiments.*measurements"

# Delete them
rm test/path/to/old/test.spec.ts

# Rewrite from scratch
```

**Success:** All tests pass, new API contract is tested

---

## Phase J – Frontend Migration

**Duration:** 2-4 hours

**Goal:** Update all composables and components to use new API.

**Order:**

1. **API Composables first**
  - `useHypothesesApi`
  - `useMetricApi`
  - `useExperimentApi`
  - `useMeasurementApi`
   
  Update signatures:
  ```typescript
  // Before
  getMetric(userId, ideaId, versionId, hypothesisId)
   
  // After
  getMetric(hypothesisId)
  ```

2. **Pages and components** – Replace all `$fetch` calls
3. **Remove parameter drilling** – Many pages no longer need `ideaId`, `versionId`, `experimentId` params

**Success:** Frontend uses only new routes

---

## Phase K – Final Cleanup

**Duration:** 1-2 hours

**Goal:** Remove all dead code and duplicate definitions.

**Tasks:**

1. Delete unused inferred DTO types
2. Delete unused Zod schemas
3. Delete unused mappers
4. Delete unused repositories
5. Delete unused use cases
6. Delete unused types
7. Remove dead imports
8. Verify no `buildOwnedXWhere` duplicates

Run:

```bash
npm run typecheck
npm run lint
npm run test
```

**Success:** Clean, consistent codebase

---

## Phase L – Update OpenAPI

**Duration:** 1 hour

**Goal:** Document the final implementation state in OpenAPI.

**Tasks:**

1. Update `openapi.yml` to reflect actual implementation
2. Document all request/response schemas
3. Document singleton child resource pattern:
  ```
  Metric is a singleton child resource of Hypothesis.
  Only GET, PUT, DELETE methods exist.
  POST does not exist (no collection).
  ```
4. Add examples for each endpoint
5. Document all status codes including 404 for missing singletons

**Why Phase L, not Phase A?**

OpenAPI documents what exists, not what is planned.

Building it before implementation creates duplicate documentation.

Maintain one source of truth: the implementation.

**Success:** OpenAPI accurately documents final API

---

# Key Risks and Mitigation

## Risk 1: Frontend Parameter Explosion

**Problem:** Pages currently pass `ideaId`, `versionId`, `hypothesisId`, `experimentId`, `measurementId` everywhere.

**Impact:** High number of changes needed in frontend layer.

**Mitigation:**
- Refactor frontend Phase J carefully
- Update composables first, then pages
- Use find-and-replace strategically
- Test each page after update

---

## Risk 2: Ownership Validation Incomplete

**Problem:** If a where-clause builder is missing, ownership can be bypassed.

**Impact:** Security regression.

**Mitigation:**
- Review all `buildOwned*Where` functions
- Add tests that validate unauthorized access fails
- Code review Phase D carefully

---

## Risk 3: Temporary Broken Compiles

**Problem:** Large-scale compile failures during repository, use case, mapper, and handler migration.

**Impact:** Feels chaotic.

**Mitigation:**
- Expected and normal
- Do not patch old code
- Resolve in sequence: repositories → use cases → mappers → handlers
- Use Phase H (`npm run typecheck`) as stabilization gate

---

# Checklist by Phase

## Phase A ✓
- [ ] API contract frozen in `docs/API_CONTRACT.md`
- [ ] All team members agree on routes
- [ ] Title location decided (Idea vs IdeaVersion)

---

## Phase B ✓
- [ ] New folder structure created
- [ ] Empty handlers exist
- [ ] Old folders untouched

---

## Phase C ✓
- [ ] Zod schemas refactored for new endpoints
- [ ] Inferred DTO types (`z.infer`) aligned with schemas

---

## Phase D ✓
- [ ] All `buildOwned*Where` functions exist
- [ ] All repositories simplified
- [ ] Method signatures reduced to minimum parameters
- [ ] Ownership tests added

---

## Phase E ✓
- [ ] All use cases updated
- [ ] No hierarchical parameters in use cases
- [ ] `npm run typecheck` passes

---

## Phase F ✓
- [ ] All `toXResponseDto` mappers updated
- [ ] Null handling aligned to API contract
- [ ] Obsolete mappers removed

---

## Phase G ✓
- [ ] All new handlers implemented
- [ ] Rate limiting applied
- [ ] Input validation applied
- [ ] Response mappers applied

---

## Phase H ✓
- [ ] `npm run typecheck` passes
- [ ] All imports correct
- [ ] All inferred DTO types referenced correctly

---

## Phase I ✓
- [ ] All old tests deleted
- [ ] New tests written for each layer
- [ ] `npm run test` passes

---

## Phase J ✓
- [ ] All composables updated
- [ ] All pages updated
- [ ] All components updated
- [ ] Frontend builds

---

## Phase K ✓
- [ ] No unused code remains
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] Codebase is clean

---

## Phase L ✓
- [ ] `openapi.yml` updated from final implementation
- [ ] Singleton resource behavior documented in OpenAPI

---

# Success Criteria

The migration is complete when:

```text
✓ TypeScript compiles (npm run typecheck)
✓ Linting passes (npm run lint)
✓ Tests pass (npm run test)
✓ Zod schemas and inferred DTO types match API contract
✓ Repositories enforce ownership in WHERE clauses
✓ Use cases have simplified signatures
✓ Mappers match API contract output
✓ API handlers follow established pattern
✓ Frontend uses only new endpoints
✓ No legacy routes remain
✓ No compatibility layer remains
✓ No duplicate code remains
✓ Architecture is internally consistent
✓ All ownership validation tested
```

At this point the codebase can be considered fully migrated to a clean, REST-compliant API design with enforced ownership validation in the repository layer.
