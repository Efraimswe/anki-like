# Implementation Plan: Migrate from Raw SQL to Prisma ORM

**Branch**: `002-prisma-migration` | **Date**: 2026-03-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-prisma-migration/spec.md`

## Summary

Migrate all database interactions from raw SQL (pg node-postgres) to Prisma ORM. This includes creating a Prisma schema matching the existing 6-table PostgreSQL database, rewriting all service queries to use Prisma Client, replacing the custom migration runner with Prisma Migrate, removing the old DatabaseService, and adding a Prisma Studio script.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20+
**Primary Dependencies**: NestJS 10+, @nestjs/platform-fastify, prisma, @prisma/client (replacing pg)
**Storage**: PostgreSQL (Neon serverless) — same database, different client
**Testing**: Jest with ts-jest
**Target Platform**: Linux server (Node.js)
**Project Type**: Web service (REST API)
**Performance Goals**: Identical to current — Prisma Client performance is comparable to raw pg for this workload
**Constraints**: Zero behavioral regression; all 14 API endpoints must return identical responses
**Scale/Scope**: 6 tables, 5 services, 14 endpoints to migrate

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Algorithm Correctness | PASS | SM-2 service is pure logic — no database interaction to change |
| II. Offline-First | PASS | Backend service — offline-first applies to future client |
| III. Test-First | PASS | Existing tests validate behavior; migration must not break them |
| IV. Data Integrity | PASS | Prisma transactions replace raw SQL transactions; atomic review flow preserved |
| V. Critical Path UX | PASS | No UX changes — internal migration only |
| VI. Simplicity | PASS | Prisma reduces complexity vs raw SQL strings; removes custom migration runner |

No violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/002-prisma-migration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── cards/
│   ├── cards.service.ts        # Rewrite queries → Prisma Client
│   ├── cards.controller.ts     # No changes
│   └── dto/
├── decks/
│   ├── decks.service.ts        # Rewrite queries → Prisma Client
│   ├── decks.controller.ts     # No changes
│   └── dto/
├── reviews/
│   ├── reviews.service.ts      # Rewrite queries → Prisma Client
│   ├── sm2.service.ts          # No changes (pure logic)
│   ├── daily-limits.service.ts # Rewrite queries → Prisma Client
│   └── dto/
├── statistics/
│   ├── statistics.service.ts   # Rewrite queries → Prisma Client
│   └── dto/
├── prisma/
│   └── prisma.service.ts       # NEW: NestJS-integrated PrismaClient
├── common/
├── config/
├── app.module.ts               # Replace DatabaseModule → PrismaModule
└── main.ts                     # No changes

prisma/
├── schema.prisma               # NEW: Prisma schema
└── migrations/                 # NEW: Prisma-managed migrations

test/
├── unit/
└── integration/
```

**Structure Decision**: Existing NestJS module structure preserved. `prisma/` directory added at repo root (Prisma convention). Old `src/database/` module removed after migration. New `src/prisma/` module wraps PrismaClient for NestJS DI.

**Files to DELETE after migration**:
- `src/database/database.service.ts`
- `src/database/database.module.ts`
- `src/database/migration-runner.ts`
- `src/database/migrations/*.sql` (6 files)
