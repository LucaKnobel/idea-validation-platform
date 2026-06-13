# API_CONTRACT.md

## Purpose

This document defines the target REST API contract for the Idea Validation Platform.

It serves as the single source of truth for:

* API routes
* request DTOs
* response DTOs
* ownership rules
* HTTP status codes

All backend and frontend implementations must follow this contract.

---

# Design Principles

## REST Conformance

This API strictly follows REST principles:

- **Collections** (0..n resources): GET (list), POST (create)
- **Singleton resources** (1:1 resources): GET, PUT (upsert), DELETE
- **404 Not Found**: When a resource doesn't exist, return 404 (not null or empty)

---

## Singleton Child Resources

Metric, Experiment, and Measurement are **singleton child resources** of Hypothesis.

```
Hypothesis
  ├─ Metric       (0..1, singleton)
  ├─ Experiment   (0..1, singleton)
  └─ Measurement  (0..1, singleton)
```

Because a Hypothesis has at most ONE metric:

- `GET /api/hypotheses/{id}/metric` – Fetch it (or 404)
- `PUT /api/hypotheses/{id}/metric` – Create or update it (upsert)
- `DELETE /api/hypotheses/{id}/metric` – Delete it

**NOT:**

- ❌ `POST /api/hypotheses/{id}/metric` (no collection, so no POST)
- ❌ `GET /api/metrics/{id}` (metrics don't exist independently)
- ❌ `POST /api/metrics` (no independent creation)

---

## Singleton Child Resources

Metric, Experiment, and Measurement are **singleton child resources** of Hypothesis.

They are not collections.

Therefore:

- **GET** retrieves the singleton resource (or 404 if missing)
- **PUT** creates or updates the singleton resource (upsert semantics)
- **DELETE** removes the singleton resource
- **POST** is intentionally not supported (no collection to POST to)

---

## PUT as Upsert

When PUT is used on singleton resources:

- If the resource does not exist → create it (201 Created)
- If the resource already exists → update it (200 OK)

This is called "upsert" semantics and is REST-compliant for singleton resources.

---

## General Rules

### Authentication

All endpoints require an authenticated user unless explicitly documented otherwise.

Ownership must always be enforced server-side.

A user may only access resources that belong to one of their own ideas.

---

### Content Type

Requests:

```http
Content-Type: application/json
```

Responses:

```http
Content-Type: application/json
```

---

### Error Response

Common structure:

```json
{
  "message": "Human readable error message"
}
```

Examples:

```json
{
  "message": "Idea not found"
}
```

```json
{
  "message": "Unauthorized"
}
```

```json
{
  "message": "Metric not found for this hypothesis"
}
```

---

# Ideas

## GET /api/ideas

Returns all ideas owned by the authenticated user.

### Response

```json
[
  {
    "id": "string",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
]
```

### Status Codes

```text
200 OK
401 Unauthorized
```

---

## POST /api/ideas

Creates a new idea.

### Request

```json
{}
```

### Response

```json
{
  "id": "string",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### Status Codes

```text
201 Created
401 Unauthorized
```

---

## GET /api/ideas/{ideaId}

Returns one idea.

### Response

```json
{
  "id": "string",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### Status Codes

```text
200 OK
404 Not Found
401 Unauthorized
```

---



## DELETE /api/ideas/{ideaId}

Deletes an idea.

### Status Codes

```text
204 No Content
404 Not Found
401 Unauthorized
```

---

# Idea Versions

## GET /api/ideas/{ideaId}/versions

Returns all versions of an idea.

### Response

```json
[
  {
    "id": "string",
    "versionNumber": 1,
    "type": "INITIAL",
    "title": "string",
    "description": "string | null",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
]
```

### Status Codes

```text
200 OK
404 Not Found (idea not found)
401 Unauthorized
```

---

## POST /api/ideas/{ideaId}/versions

Creates a new version of an idea.

### Request

```json
{
  "type": "INITIAL",
  "title": "My Idea",
  "description": "optional"
}
```

### Response

```json
{
  "id": "string",
  "versionNumber": 1,
  "type": "INITIAL",
  "title": "My Idea",
  "description": "optional",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### Status Codes

```text
201 Created
400 Bad Request
404 Not Found (idea not found)
401 Unauthorized
```

---

## GET /api/idea-versions/{versionId}

Returns one idea version.

### Response

```json
{
  "id": "string",
  "ideaId": "string",
  "versionNumber": 1,
  "type": "INITIAL",
  "title": "string",
  "description": "string | null",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### Status Codes

```text
200 OK
404 Not Found
401 Unauthorized
```

---

## PUT /api/idea-versions/{versionId}

Updates an idea version.

### Request

```json
{
  "title": "Updated Title",
  "description": "Updated Description"
}
```

### Response

```json
{
  "id": "string",
  "ideaId": "string",
  "versionNumber": 1,
  "type": "INITIAL",
  "title": "Updated Title",
  "description": "Updated Description",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### Status Codes

```text
200 OK
400 Bad Request
404 Not Found
401 Unauthorized
```

---

## DELETE /api/idea-versions/{versionId}

Deletes an idea version.

### Status Codes

```text
204 No Content
404 Not Found
401 Unauthorized
```

---

# Canvas Elements

## GET /api/idea-versions/{versionId}/canvas-elements

Returns all canvas elements for a version.

### Response

```json
[
  {
    "id": "string",
    "type": "CUSTOMER_SEGMENTS",
    "content": "string",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
]
```

### Status Codes

```text
200 OK
404 Not Found (version not found)
401 Unauthorized
```

---

## PUT /api/idea-versions/{versionId}/canvas-elements

Creates or updates all canvas elements for a version (bulk upsert).

### Request

```json
[
  {
    "type": "CUSTOMER_SEGMENTS",
    "content": "string"
  }
]
```

### Response

```json
[
  {
    "id": "string",
    "type": "CUSTOMER_SEGMENTS",
    "content": "string",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
]
```

### Status Codes

```text
200 OK
400 Bad Request
404 Not Found (version not found)
401 Unauthorized
```

---

# Hypotheses

## GET /api/idea-versions/{versionId}/hypotheses

Returns all hypotheses in a version.

### Response

```json
[
  {
    "id": "string",
    "statement": "string",
    "dimension": "PROBLEM",
    "priority": "HIGH",
    "evidenceType": "QUALITATIVE",
    "status": "NOT_TESTED",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
]
```

### Status Codes

```text
200 OK
404 Not Found (version not found)
401 Unauthorized
```

---

## POST /api/idea-versions/{versionId}/hypotheses

Creates a new hypothesis.

### Request

```json
{
  "statement": "Users have this problem",
  "dimension": "PROBLEM",
  "priority": "HIGH",
  "evidenceType": "QUALITATIVE",
  "canvasElementTypes": [
    "CUSTOMER_SEGMENTS",
    "VALUE_PROPOSITIONS"
  ]
}
```

### Response

```json
{
  "id": "string",
  "statement": "Users have this problem",
  "dimension": "PROBLEM",
  "priority": "HIGH",
  "evidenceType": "QUALITATIVE",
  "status": "NOT_TESTED",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### Status Codes

```text
201 Created
400 Bad Request
404 Not Found (version not found)
401 Unauthorized
```

---

## GET /api/hypotheses/{hypothesisId}

Returns one hypothesis with all child resources.

### Response

```json
{
  "id": "string",
  "statement": "string",
  "dimension": "PROBLEM",
  "priority": "HIGH",
  "evidenceType": "QUALITATIVE",
  "status": "NOT_TESTED",
  "canvasSections": [
    "CUSTOMER_SEGMENTS"
  ],
  "metric": null,
  "experiment": null,
  "measurement": null,
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

**Note:** `metric`, `experiment`, and `measurement` fields are:
- `null` if the singleton resource does not exist
- A full DTO (MetricResponseDto, ExperimentResponseDto, MeasurementResponseDto) if it exists

### Status Codes

```text
200 OK
404 Not Found
401 Unauthorized
```

---

## PUT /api/hypotheses/{hypothesisId}

Updates a hypothesis.

### Request

```json
{
  "statement": "Updated statement",
  "dimension": "MARKET",
  "priority": "MEDIUM",
  "evidenceType": "QUANTITATIVE",
  "canvasElementTypes": [
    "CUSTOMER_SEGMENTS"
  ]
}
```

### Response

Same as GET.

### Status Codes

```text
200 OK
400 Bad Request
404 Not Found
401 Unauthorized
```

---

## DELETE /api/hypotheses/{hypothesisId}

Deletes a hypothesis.

### Status Codes

```text
204 No Content
404 Not Found
401 Unauthorized
```

---

# Metric

**Pattern:** Singleton child resource (0..1 per Hypothesis)

---

## GET /api/hypotheses/{hypothesisId}/metric

Fetch the metric for this hypothesis.

### Response (200)

```json
{
  "id": "string",
  "name": "Signup Rate",
  "description": "string",
  "unit": "%",
  "threshold": {
    "operator": "GTE",
    "referenceValue": 10
  },
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### Status Codes

```text
200 OK
404 Not Found (metric does not exist)
401 Unauthorized
```

---

## PUT /api/hypotheses/{hypothesisId}/metric

Create or update the metric for this hypothesis (upsert).

Because Metric is a singleton resource, PUT follows upsert semantics:
- If metric does not exist → create it (201 Created)
- If metric exists → update it (200 OK)

### Request

```json
{
  "name": "Signup Rate",
  "description": "string",
  "unit": "%",
  "threshold": {
    "operator": "GTE",
    "referenceValue": 10
  }
}
```

### Response (201 Created or 200 OK)

```json
{
  "id": "string",
  "name": "Signup Rate",
  "description": "string",
  "unit": "%",
  "threshold": {
    "operator": "GTE",
    "referenceValue": 10
  },
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### Status Codes

```text
201 Created (new metric)
200 OK (metric updated)
400 Bad Request
404 Not Found (hypothesis not found)
401 Unauthorized
```

---

## DELETE /api/hypotheses/{hypothesisId}/metric

Delete the metric for this hypothesis.

### Status Codes

```text
204 No Content (metric deleted)
404 Not Found (metric does not exist)
401 Unauthorized
```

---

# Experiment

**Pattern:** Singleton child resource (0..1 per Hypothesis)

---

## GET /api/hypotheses/{hypothesisId}/experiment

Fetch the experiment for this hypothesis.

### Response (200)

```json
{
  "id": "string",
  "title": "Landing Page Test",
  "description": "string",
  "status": "PLANNED",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### Status Codes

```text
200 OK
404 Not Found (experiment does not exist)
401 Unauthorized
```

---

## PUT /api/hypotheses/{hypothesisId}/experiment

Create or update the experiment for this hypothesis (upsert).

Because Experiment is a singleton resource, PUT follows upsert semantics:
- If experiment does not exist → create it (201 Created)
- If experiment exists → update it (200 OK)

### Request

```json
{
  "title": "Landing Page Test",
  "description": "string",
  "status": "PLANNED"
}
```

### Response (201 Created or 200 OK)

```json
{
  "id": "string",
  "title": "Landing Page Test",
  "description": "string",
  "status": "PLANNED",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### Status Codes

```text
201 Created (new experiment)
200 OK (experiment updated)
400 Bad Request
404 Not Found (hypothesis not found)
401 Unauthorized
```

---

## DELETE /api/hypotheses/{hypothesisId}/experiment

Delete the experiment for this hypothesis.

### Status Codes

```text
204 No Content (experiment deleted)
404 Not Found (experiment does not exist)
401 Unauthorized
```

---

# Measurement

**Pattern:** Singleton child resource (0..1 per Hypothesis)

---

## GET /api/hypotheses/{hypothesisId}/measurement

Fetch the measurement for this hypothesis.

### Response (200)

```json
{
  "id": "string",
  "value": 12.5,
  "note": "Result after test",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### Status Codes

```text
200 OK
404 Not Found (measurement does not exist)
401 Unauthorized
```

---

## PUT /api/hypotheses/{hypothesisId}/measurement

Create or update the measurement for this hypothesis (upsert).

Because Measurement is a singleton resource, PUT follows upsert semantics:
- If measurement does not exist → create it (201 Created)
- If measurement exists → update it (200 OK)

### Request

```json
{
  "value": 12.5,
  "note": "Result after test"
}
```

### Response (201 Created or 200 OK)

```json
{
  "id": "string",
  "value": 12.5,
  "note": "Result after test",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### Status Codes

```text
201 Created (new measurement)
200 OK (measurement updated)
400 Bad Request
404 Not Found (hypothesis not found)
401 Unauthorized
```

---

## DELETE /api/hypotheses/{hypothesisId}/measurement

Delete the measurement for this hypothesis.

### Status Codes

```text
204 No Content (measurement deleted)
404 Not Found (measurement does not exist)
401 Unauthorized
```

---

# Ownership Rules

Ownership is never determined by URL parameters alone.

Every access must be verified through the ownership chain:

```text
User
└── Idea
    └── IdeaVersion
        └── Hypothesis
            ├── Metric
            ├── Experiment
            └── Measurement
```

Every repository query must enforce ownership constraints via WHERE clauses.

Unauthorized resources must behave as:

```text
404 Not Found
```

instead of:

```text
403 Forbidden
```

to avoid resource enumeration.

---

# DTO Naming Convention

Follow this naming convention for all DTOs:

## Create Operations

```
CreateIdeaBodyDto
CreateHypothesisBodyDto
```

## Update Operations

```
UpdateIdeaBodyDto
UpdateHypothesisBodyDto
```

## Upsert Operations (Singleton Resources)

```
UpsertMetricBodyDto
UpsertExperimentBodyDto
UpsertMeasurementBodyDto
```

## Response DTOs

```
IdeaResponseDto
IdeaVersionResponseDto
HypothesisResponseDto
MetricResponseDto
ExperimentResponseDto
MeasurementResponseDto
CanvasElementResponseDto
```

---

# Final Architecture

```text
HTTP Request
        ↓
API Route
        ↓
Zod Validation
        ↓
Use Case
        ↓
Repository
        ↓
Prisma
        ↓
Database
```

No business logic in:

* API handlers
* repositories
* mappers

Business logic belongs exclusively to use cases.
