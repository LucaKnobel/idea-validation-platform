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

# General Rules

## Authentication

All endpoints require an authenticated user unless explicitly documented otherwise.

Ownership must always be enforced server-side.

A user may only access resources that belong to one of their own ideas.

---

## Content Type

Requests:

```http
Content-Type: application/json
```

Responses:

```http
Content-Type: application/json
```

---

## Error Response

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

---

## POST /api/ideas/{ideaId}/versions

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
  "description": "optional"
}
```

---

## GET /api/idea-versions/{versionId}

### Response

```json
{
  "id": "string",
  "ideaId": "string",
  "versionNumber": 1,
  "type": "INITIAL",
  "title": "string",
  "description": "string | null"
}
```

---

## PUT /api/idea-versions/{versionId}

### Request

```json
{
  "title": "Updated Title",
  "description": "Updated Description"
}
```

### Response

Same as GET.

---

## DELETE /api/idea-versions/{versionId}

### Status Codes

```text
204 No Content
404 Not Found
```

---

# Canvas Elements

## GET /api/idea-versions/{versionId}/canvas-elements

### Response

```json
[
  {
    "id": "string",
    "type": "CUSTOMER_SEGMENTS",
    "content": "string"
  }
]
```

---

## PUT /api/idea-versions/{versionId}/canvas-elements

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
    "content": "string"
  }
]
```

---

# Hypotheses

## GET /api/idea-versions/{versionId}/hypotheses

### Response

```json
[
  {
    "id": "string",
    "statement": "string",
    "dimension": "PROBLEM",
    "priority": "HIGH",
    "evidenceType": "QUALITATIVE",
    "status": "NOT_TESTED"
  }
]
```

---

## POST /api/idea-versions/{versionId}/hypotheses

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
  "id": "string"
}
```

---

## GET /api/hypotheses/{hypothesisId}

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

  "metric": {},
  "experiment": {},
  "measurement": {}
}
```

---

## PUT /api/hypotheses/{hypothesisId}

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

---

## DELETE /api/hypotheses/{hypothesisId}

### Status Codes

```text
204 No Content
404 Not Found
```

---

# Metric

## GET /api/hypotheses/{hypothesisId}/metric

### Response

```json
{
  "id": "string",
  "name": "Signup Rate",
  "description": "string",
  "unit": "%",
  "threshold": {
    "operator": "GTE",
    "referenceValue": 10
  }
}
```

---

## PUT /api/hypotheses/{hypothesisId}/metric

Creates or updates the metric.

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

### Response

Same as GET.

---

## DELETE /api/hypotheses/{hypothesisId}/metric

### Status Codes

```text
204 No Content
404 Not Found
```

---

# Experiment

## GET /api/hypotheses/{hypothesisId}/experiment

### Response

```json
{
  "id": "string",
  "title": "Landing Page Test",
  "description": "string",
  "status": "PLANNED"
}
```

---

## PUT /api/hypotheses/{hypothesisId}/experiment

Creates or updates the experiment.

### Request

```json
{
  "title": "Landing Page Test",
  "description": "string",
  "status": "PLANNED"
}
```

### Response

Same as GET.

---

## DELETE /api/hypotheses/{hypothesisId}/experiment

### Status Codes

```text
204 No Content
404 Not Found
```

---

# Measurement

## GET /api/hypotheses/{hypothesisId}/measurement

### Response

```json
{
  "id": "string",
  "value": 12.5,
  "note": "Result after test"
}
```

---

## PUT /api/hypotheses/{hypothesisId}/measurement

Creates or updates the measurement.

### Request

```json
{
  "value": 12.5,
  "note": "Result after test"
}
```

### Response

```json
{
  "id": "string",
  "value": 12.5,
  "note": "Result after test"
}
```

---

## DELETE /api/hypotheses/{hypothesisId}/measurement

### Status Codes

```text
204 No Content
404 Not Found
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

Every repository query must enforce ownership constraints.

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
