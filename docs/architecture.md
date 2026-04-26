# Architecture Overview

## Purpose

This document describes the **logical architecture** and the **project structure** of the system.  
It serves as a reference for developers and defines how the system must be structured and implemented.

---

## Architectural Style

The system follows a **3-layer Clean Architecture variant**:

1. **Application Business Rules** (core logic)  
2. **Interface Adapters** (API layer)  
3. **Frameworks & Drivers** (infrastructure)  

---

## Dependency Rule

All dependencies must point **inward**:

```txt
Infrastructure → API → Application
```

Forbidden:

- Application importing Prisma or infrastructure code  
- Application importing Nuxt or runtime APIs  
- Business logic inside API handlers  

---

## Logical Architecture

### 1) Application Business Rules

Core of the system containing all business logic.

Includes:

- domain models  
- use case services  
- interfaces (abstractions)  

Rules:

- no HTTP logic  
- no database access  
- no framework usage  

---

### 2) Interface Adapters

Handles communication between external systems and core logic.

Includes:

- API handlers (file-based routing)  
- validation schemas  
- DTO mapping  
- request protection (rate limiting)  

Responsibilities:

- validate input  
- map request → internal model  
- call services  
- map response → DTO  

---

### 3) Frameworks & Drivers

Technical implementation layer.

Includes:

- database access (Prisma)  
- repositories  
- logging  
- authentication  
- external services  

Responsibilities:

- implement interfaces  
- handle infrastructure concerns  

---

## Project Structure

```txt
server/
  api/
    rate-limit/             # request protection (rate limiting)
      policies.ts
      rateLimit.ts

    schemas/                # validation schemas (Zod)
    mappers/                # DTO ↔ internal model mapping

    *.ts                    # API handlers (file-based routing)

  application/
    models/                 # domain models
    services/               # use cases / business logic
    interfaces/             # abstractions (repositories, services)

  infrastructure/
    prisma/                 # Prisma client & setup
    repositories/           # DB implementations
    services/               # external integrations (mail, logging, auth)

shared/
  types/                    # DTOs (client ↔ server)

middleware/                 # optional global logic
plugins/                    # Nuxt runtime integration
```

---

## Folder Responsibilities

### `server/application/`

- contains all business logic  
- independent of frameworks and infrastructure  

#### models/
- domain entities  
- no external dependencies  

#### services/
- use cases  
- orchestrate workflows  

#### interfaces/
- define required capabilities  
- no implementation  

---

### `server/api/`

- handles HTTP requests  
- acts as controller layer  

#### schemas/
- input validation  

#### mappers/
- DTO ↔ internal model conversion  

#### rate-limit/
- request protection  
- applied before validation  

---

### `server/infrastructure/`

- technical implementations  

#### prisma/
- database client  

#### repositories/
- persistence layer  
- implements interfaces  

#### services/
- external integrations  

---

### `shared/`

- shared DTO definitions  
- used by frontend and backend  

Rules:

- no business logic  
- no framework dependencies  

---

### `middleware/`

- cross-cutting concerns  
- optional  

Examples:

- authentication checks  
- global request handling  

---

### `plugins/`

- Nuxt runtime integration  

Examples:

- dependency injection  
- global setup  

---

## Request Flow

```txt
API Handler
 → Rate Limit
 → Validation
 → Mapping
 → Service (Use Case)
 → Interface
 → Repository
 → Prisma
```

---

## Key Principles

- strict separation of concerns  
- business logic only in application layer  
- API layer is thin  
- infrastructure is replaceable  
- validation and mapping are mandatory  
- no direct exposure of internal models  

---

## Stateless Design

- no shared server state  
- each request is independent  

Ensures:

- scalability  
- reliability  
- predictable behavior  