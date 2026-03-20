# Implementation Plan: Spaced Repetition Backend Service

**Branch**: `001-nestjs-backend` | **Date**: 2026-03-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-nestjs-backend/spec.md`

## Summary

Build a REST API backend for a spaced repetition flashcard system using NestJS with Fastify adapter, PostgreSQL (Neon serverless) with raw SQL, implementing the full SM-2 algorithm, deck/card CRUD, review flow, lifecycle management, daily limits, and study statistics.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20+
**Primary Dependencies**: NestJS 10+, @nestjs/platform-fastify, pg (node-postgres)
**Storage**: PostgreSQL (Neon serverless)
**Testing**: Jest (NestJS default)
**Target Platform**: Linux server / containerized
**Project Type**: web-service (REST API)
**Performance Goals**: <200ms due card retrieval for 10k cards, <100ms review state update
**Constraints**: No auth for v1, raw SQL (no ORM), atomic review state updates
**Scale/Scope**: 100 concurrent users, single-tenant

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Algorithm Correctness (SM-2) | PASS | SM-2 implemented per spec with quality mappings, ease factor floor 1.3, interval cap 365d |
| II. Offline-First | N/A | This is a server backend; offline-first applies to future client |
| III. Test-First | PASS | Jest tests for algorithm and review state transitions planned |
| IV. Data Integrity | PASS | Atomic ReviewState updates via SQL transactions; soft-delete for decks/cards; migrations planned |
| V. Critical Path UX | PASS | Due card retrieval <200ms target; review update <100ms; daily limits enforced |
| VI. Simplicity | PASS | Basic/Reverse/Cloze only; no plugins/sync/import-export; raw SQL keeps data layer simple |

No violations. Gate passed.

## Project Structure

### Documentation (this feature)

```text
specs/001-nestjs-backend/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (REST API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app.module.ts
├── main.ts
├── database/
│   ├── database.module.ts
│   ├── database.service.ts       # Raw SQL query runner (pg Pool)
│   └── migrations/               # SQL migration files
├── decks/
│   ├── decks.module.ts
│   ├── decks.controller.ts
│   ├── decks.service.ts
│   └── dto/
├── cards/
│   ├── cards.module.ts
│   ├── cards.controller.ts
│   ├── cards.service.ts
│   └── dto/
├── reviews/
│   ├── reviews.module.ts
│   ├── reviews.controller.ts
│   ├── reviews.service.ts
│   ├── sm2.service.ts            # SM-2 algorithm (pure logic)
│   └── dto/
├── statistics/
│   ├── statistics.module.ts
│   ├── statistics.controller.ts
│   └── statistics.service.ts
└── config/
    └── config.module.ts

test/
├── unit/
│   └── sm2.service.spec.ts       # SM-2 algorithm unit tests
├── integration/
│   ├── decks.spec.ts
│   ├── cards.spec.ts
│   ├── reviews.spec.ts
│   └── statistics.spec.ts
└── jest-e2e.json
```

**Structure Decision**: Single NestJS project with feature-based module organization (decks, cards, reviews, statistics). Database layer is a shared module with raw SQL via `pg`. SM-2 algorithm is isolated as a pure service for testability.

## Complexity Tracking

No violations to justify.
