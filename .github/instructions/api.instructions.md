---
description: Applied when designing or implementing API endpoints
applyTo: "server/api/**/*.ts"
---

# API Rules

## Style

Hybrid:

- REST for data
- Actions for business logic

---

## Examples

GET /ideas  
POST /ideas  
POST /ideas/{id}/evaluate

---

## Rules

- One responsibility per endpoint
- No mixed logic

---

## Responses

- Consistent structure
- No internal fields

---

## Errors

- Standard format
- No stack traces
