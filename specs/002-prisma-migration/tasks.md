# Tasks: Prisma Migration

**Input**: Design documents from `/specs/002-prisma-migration/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `test/` at repository root

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install Prisma dependencies and generate initial schema from existing database

- [x] T001 Install prisma and @prisma/client dependencies via npm in package.json
- [x] T002 Run `prisma db pull` to introspect existing Neon database and generate prisma/schema.prisma
- [x] T003 Refine prisma/schema.prisma: rename models to PascalCase, fields to camelCase, add @@map/@map annotations, enums for CardType and Phase per data-model.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create PrismaService for NestJS DI and baseline the migration history

**CRITICAL**: No service rewriting can begin until PrismaModule is available

- [x] T004 Create PrismaService extending PrismaClient with OnModuleInit in src/prisma/prisma.service.ts
- [x] T005 Create PrismaModule (global, exports PrismaService) in src/prisma/prisma.module.ts
- [x] T006 Register PrismaModule in AppModule in src/app.module.ts (keep DatabaseModule temporarily)
- [x] T007 Run `npx prisma generate` to generate Prisma Client and verify it compiles
- [x] T008 Baseline existing database: run `npx prisma migrate dev --name init --create-only` then `npx prisma migrate resolve --applied init`

**Checkpoint**: PrismaService injectable into any service. Existing app still works via old DatabaseService.

---

## Phase 3: User Story 1 - Replace Raw SQL with Prisma Client (Priority: P1)

**Goal**: Rewrite all service queries from raw SQL to Prisma Client with zero behavioral regression

**Independent Test**: All existing API endpoints return identical responses; all unit tests pass

### Implementation for User Story 1

- [x] T009 [US1] Rewrite DecksService to use PrismaService instead of DatabaseService in src/decks/decks.service.ts (create, findAll with cardCount/dueCount, findOne, update, soft-delete with cascade)
- [x] T010 [US1] Update DecksModule to import PrismaModule instead of DatabaseModule in src/decks/decks.module.ts
- [x] T011 [US1] Rewrite CardsService to use PrismaService instead of DatabaseService in src/cards/cards.service.ts (create with reverse auto-generation, findByDeck with pagination/tag filter, findByTag, findOne with CardState join, update, soft-delete, auto-create CardState)
- [x] T012 [US1] Update CardsModule to import PrismaModule instead of DatabaseModule in src/cards/cards.module.ts
- [x] T013 [US1] Rewrite ReviewsService to use PrismaService with interactive transactions in src/reviews/reviews.service.ts (getDueCards with daily limits, submitReview atomic flow)
- [x] T014 [US1] Rewrite DailyLimitsService to use PrismaService with upsert in src/reviews/daily-limits.service.ts
- [x] T015 [US1] Update ReviewsModule to import PrismaModule instead of DatabaseModule in src/reviews/reviews.module.ts
- [x] T016 [US1] Rewrite StatisticsService to use PrismaService with aggregation queries in src/statistics/statistics.service.ts
- [x] T017 [US1] Update StatisticsModule to import PrismaModule instead of DatabaseModule in src/statistics/statistics.module.ts
- [x] T018 [US1] Remove DatabaseModule import from AppModule in src/app.module.ts
- [x] T019 [US1] Delete src/database/database.service.ts, src/database/database.module.ts, and src/database/ directory
- [x] T020 [US1] Remove pg dependency from package.json (keep dotenv)
- [x] T021 [US1] Run existing unit tests (test/unit/sm2.service.spec.ts) and verify all 20 pass
- [x] T022 [US1] Smoke test all 14 API endpoints against running app to verify identical behavior

**Checkpoint**: All raw SQL replaced. DatabaseService deleted. All endpoints work identically via Prisma Client.

---

## Phase 4: User Story 2 - Replace Migration Runner with Prisma Migrate (Priority: P2)

**Goal**: Remove custom migration runner; use Prisma Migrate for all future schema changes

**Independent Test**: Run `npx prisma migrate deploy` on fresh DB, verify schema matches

### Implementation for User Story 2

- [x] T023 [US2] Delete src/database/migration-runner.ts
- [x] T024 [US2] Delete all files in src/database/migrations/ (001-006 SQL files)
- [x] T025 [US2] Remove "migrate" npm script from package.json and replace with "prisma:migrate" script running `npx prisma migrate deploy`
- [x] T026 [US2] Add "prisma:generate" script to package.json running `npx prisma generate`

**Checkpoint**: No custom migration code remains. Schema managed entirely by Prisma Migrate.

---

## Phase 5: User Story 3 - Prisma Studio Script (Priority: P3)

**Goal**: Add npm script to launch Prisma Studio for visual database browsing

**Independent Test**: Run `npm run studio` and verify web UI opens showing all 6 tables

### Implementation for User Story 3

- [x] T027 [US3] Add "studio" npm script to package.json running `npx prisma studio`

**Checkpoint**: Developer can browse database visually with a single command.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, verification, and final validation

- [x] T028 Verify no raw SQL strings remain in src/ by grepping for query patterns
- [x] T029 Run quickstart.md full validation (all curl commands, studio launch, grep check)
- [x] T030 Update test/jest-e2e.json if any test path changes needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — core migration work
- **US2 (Phase 4)**: Depends on US1 (DatabaseService must be deleted first)
- **US3 (Phase 5)**: Depends on Phase 1 only (prisma schema exists)
- **Polish (Phase 6)**: Depends on all user stories

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — BLOCKS US2
- **US2 (P2)**: Depends on US1 — old migration files deleted after DatabaseService removed
- **US3 (P3)**: Can run in parallel with US1 after Phase 2

### Within Each User Story

- Module imports updated after service rewrite
- Services rewritten one at a time to allow incremental testing
- AppModule updated last (T018) after all services migrated

### Parallel Opportunities

- T009+T011 can run in parallel (different service files) if PrismaModule is ready
- T016+T014 can run in parallel (Statistics + DailyLimits are independent)
- US3 (T027) can run in parallel with US1 after Phase 2

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1: Install Prisma, introspect, refine schema
2. Complete Phase 2: PrismaService + PrismaModule
3. Complete Phase 3: US1 — Rewrite all services
4. **STOP and VALIDATE**: All endpoints return identical responses

### Full Delivery

5. Complete Phase 4: US2 — Remove old migration runner
6. Complete Phase 5: US3 — Add studio script
7. Complete Phase 6: Polish and final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- SM-2 algorithm service (sm2.service.ts) has NO database interaction — untouched
- Soft-delete: explicit `where: { deletedAt: null }` in all Prisma queries
- Transactions: use `prisma.$transaction(async (tx) => { ... })` for review submission
- CHECK constraints (ease_factor >= 1.3, interval 0-365) remain at DB level
- GIN index on tags: use `@@index([tags], type: Gin)` in Prisma schema
