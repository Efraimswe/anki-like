# Tasks: Spaced Repetition Backend Service

**Input**: Design documents from `/specs/001-nestjs-backend/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Constitution principle III (Test-First) requires TDD for algorithm and review state logic. Tests included for SM-2 and review flow.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `test/` at repository root

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: NestJS project initialization with Fastify adapter and PostgreSQL connection

- [x] T001 Initialize NestJS project with Fastify adapter, pg dependency in package.json and src/main.ts
- [x] T002 [P] Create .env.example with DATABASE_URL placeholder and .gitignore with .env
- [x] T003 [P] Configure ESLint and Prettier per NestJS defaults in .eslintrc.js and .prettierrc
- [x] T004 Create config module with DATABASE_URL validation in src/config/config.module.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database connection, migration system, and shared schema that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Implement DatabaseService with pg Pool connection (SSL for Neon, max 10 connections) in src/database/database.service.ts
- [x] T006 Create DatabaseModule exporting DatabaseService in src/database/database.module.ts
- [x] T007 Implement migration runner (reads numbered .sql files, tracks in schema_migrations table) in src/database/migration-runner.ts
- [x] T008 [P] Create migration 001_create_decks.sql in src/database/migrations/001_create_decks.sql
- [x] T009 [P] Create migration 002_create_cards.sql with indexes in src/database/migrations/002_create_cards.sql
- [x] T010 [P] Create migration 003_create_card_states.sql with CHECK constraints in src/database/migrations/003_create_card_states.sql
- [x] T011 [P] Create migration 004_create_review_logs.sql with indexes in src/database/migrations/004_create_review_logs.sql
- [x] T012 [P] Create migration 005_create_daily_limits.sql in src/database/migrations/005_create_daily_limits.sql
- [x] T013 [P] Create migration 006_create_daily_counters.sql in src/database/migrations/006_create_daily_counters.sql
- [x] T014 Add npm script "migrate" that runs migration-runner.ts against DATABASE_URL in package.json
- [x] T015 [P] Configure global API prefix "/api/v1" and global validation pipe in src/main.ts

**Checkpoint**: Database connected, all tables created, API prefix set. User story implementation can begin.

---

## Phase 3: User Story 1 - Create and Organize Flashcards (Priority: P1)

**Goal**: Full CRUD for decks and cards (Basic, Reverse, Cloze) with tagging and soft-delete

**Independent Test**: Create a deck, add cards of each type, retrieve/update/delete them, query by tag

### Implementation for User Story 1

- [x] T016 [P] [US1] Create CreateDeckDto and UpdateDeckDto in src/decks/dto/create-deck.dto.ts and src/decks/dto/update-deck.dto.ts
- [x] T017 [P] [US1] Create CreateCardDto and UpdateCardDto (with type enum, tags, cloze validation) in src/cards/dto/create-card.dto.ts and src/cards/dto/update-card.dto.ts
- [x] T018 [US1] Implement DecksService with raw SQL: create, findAll (with cardCount/dueCount), findOne, update, soft-delete (cascade to cards) in src/decks/decks.service.ts
- [x] T019 [US1] Implement DecksController with POST/GET/GET:id/PATCH/DELETE endpoints in src/decks/decks.controller.ts
- [x] T020 [US1] Create DecksModule registering controller and service in src/decks/decks.module.ts
- [x] T021 [US1] Implement CardsService with raw SQL: create (with reverse card auto-generation and cloze parsing), findByDeck (pagination, tag filter), findByTag (cross-deck), findOne (with CardState join), update, soft-delete — auto-create CardState row on card insert in src/cards/cards.service.ts
- [x] T022 [US1] Implement CardsController with POST/GET(deck)/GET(by tag)/GET:id/PATCH/DELETE endpoints in src/cards/cards.controller.ts
- [x] T023 [US1] Create CardsModule registering controller and service in src/cards/cards.module.ts
- [x] T024 [US1] Register DecksModule and CardsModule in AppModule in src/app.module.ts

**Checkpoint**: Decks and cards CRUD fully functional. Reverse cards generate two records. Cloze syntax validated. Tags queryable.

---

## Phase 4: User Story 2 - Review Cards with Spaced Repetition (Priority: P1)

**Goal**: SM-2 algorithm, due card retrieval, review submission with atomic state updates

**Independent Test**: Create cards, make them due, submit reviews with all four ratings, verify interval/ease/repetition calculations match SM-2

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation (Constitution Principle III)**

- [x] T025 [P] [US2] Unit tests for SM-2 algorithm: all rating types, ease factor floor 1.3, interval cap 365, edge cases in test/unit/sm2.service.spec.ts
- [x] T026 [P] [US2] Integration tests for review flow: submit review, verify state update, verify review log created in test/integration/reviews.spec.ts

### Implementation for User Story 2

- [x] T027 [US2] Implement Sm2Service as pure logic: calculate(currentState, quality) → newState, with ease factor formula, interval logic, floor/cap constraints in src/reviews/sm2.service.ts
- [x] T028 [US2] Create SubmitReviewDto (cardId, rating enum, timeTakenMs) in src/reviews/dto/submit-review.dto.ts
- [x] T029 [US2] Implement ReviewsService with raw SQL: getDueCards (JOIN cards+card_states, WHERE due_date <= NOW, exclude soft-deleted), submitReview (atomic transaction: read state → compute SM-2 → update card_states → insert review_log) in src/reviews/reviews.service.ts
- [x] T030 [US2] Implement ReviewsController with GET /decks/:deckId/reviews/due and POST /reviews endpoints in src/reviews/reviews.controller.ts
- [x] T031 [US2] Create ReviewsModule registering Sm2Service, ReviewsService, ReviewsController in src/reviews/reviews.module.ts
- [x] T032 [US2] Register ReviewsModule in AppModule in src/app.module.ts

**Checkpoint**: Full review flow works. SM-2 calculations verified by tests. Due cards returned correctly. Review history logged.

---

## Phase 5: User Story 3 - Card Lifecycle Management (Priority: P2)

**Goal**: Phase transitions (New → Learning → Review → Relearning) integrated into review flow

**Independent Test**: Create a card, review it through all phase transitions, verify phase field updates correctly

### Implementation for User Story 3

- [x] T033 [US3] Extend Sm2Service.calculate() to return new phase based on current phase + rating (state machine from research.md R6) in src/reviews/sm2.service.ts
- [x] T034 [US3] Update ReviewsService.submitReview() to persist phase transitions in card_states.phase column in src/reviews/reviews.service.ts
- [x] T035 [US3] Update ReviewsService.getDueCards() to include phase in response and separate new cards from review cards in src/reviews/reviews.service.ts
- [x] T036 [US3] Add unit tests for all phase transitions in test/unit/sm2.service.spec.ts

**Checkpoint**: Cards correctly transition through New → Learning → Review → Relearning. Phase visible in due cards and card detail responses.

---

## Phase 6: User Story 4 - Daily Review Limits (Priority: P2)

**Goal**: Configurable daily limits for new cards and total reviews, with automatic daily counter reset

**Independent Test**: Set limits to small numbers, perform reviews up to limit, verify system stops presenting cards and returns 429

### Implementation for User Story 4

- [x] T037 [P] [US4] Create UpdateDailyLimitsDto in src/reviews/dto/update-daily-limits.dto.ts
- [x] T038 [US4] Implement DailyLimitsService with raw SQL: getLimits, updateLimits, getCounters (UPSERT daily_counters), incrementCounters, checkLimits in src/reviews/daily-limits.service.ts
- [x] T039 [US4] Update ReviewsService.getDueCards() to check daily limits before returning cards — separate new vs review cards, apply respective limits in src/reviews/reviews.service.ts
- [x] T040 [US4] Update ReviewsService.submitReview() to increment daily counters and return 429 if limit exceeded in src/reviews/reviews.service.ts
- [x] T041 [US4] Add GET /settings/daily-limits and PATCH /settings/daily-limits endpoints to ReviewsController in src/reviews/reviews.controller.ts
- [x] T042 [US4] Seed default daily_limits row (20 new, 200 reviews) in migration or on first access in src/reviews/daily-limits.service.ts

**Checkpoint**: Daily limits enforced. Counters reset per calendar day (UTC). Settings configurable via API.

---

## Phase 7: User Story 5 - Study Statistics (Priority: P3)

**Goal**: Calculate and return retention rate, reviews/day, time spent, accuracy with optional date range filter

**Independent Test**: Complete review sessions, retrieve statistics, verify calculations against manual counts

### Implementation for User Story 5

- [x] T043 [P] [US5] Create StatisticsQueryDto (from, to date range params) in src/statistics/dto/statistics-query.dto.ts
- [x] T044 [US5] Implement StatisticsService with raw SQL aggregation queries on review_logs: retention rate, total reviews, accuracy %, total time, daily breakdown — with optional date range WHERE clause in src/statistics/statistics.service.ts
- [x] T045 [US5] Implement StatisticsController with GET /statistics endpoint in src/statistics/statistics.controller.ts
- [x] T046 [US5] Create StatisticsModule registering service and controller in src/statistics/statistics.module.ts
- [x] T047 [US5] Register StatisticsModule in AppModule in src/app.module.ts

**Checkpoint**: All statistics endpoints return accurate calculations. Date range filtering works.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validation, error handling, and final integration

- [x] T048 [P] Add global exception filter for consistent error response format in src/common/http-exception.filter.ts
- [x] T049 [P] Add request validation error formatting (class-validator) in src/main.ts
- [x] T050 Integration test for full flow: create deck → add cards → review → check statistics in test/integration/full-flow.spec.ts
- [x] T051 Run quickstart.md validation — verify all curl commands work end-to-end
- [x] T052 [P] Configure Jest for unit and e2e test paths in package.json and test/jest-e2e.json

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — BLOCKS US2 (reviews need cards)
- **US2 (Phase 4)**: Depends on US1 (needs cards to review)
- **US3 (Phase 5)**: Depends on US2 (extends review logic)
- **US4 (Phase 6)**: Depends on US2 (extends review logic)
- **US5 (Phase 7)**: Depends on US2 (needs review_logs data)
- **Polish (Phase 8)**: Depends on all user stories

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no story dependencies
- **US2 (P1)**: Depends on US1 — needs cards and card_states to exist
- **US3 (P2)**: Depends on US2 — extends SM-2 service with phase logic
- **US4 (P2)**: Depends on US2 — extends review service with limit checks. Can run in parallel with US3.
- **US5 (P3)**: Depends on US2 — reads review_logs. Can run in parallel with US3 and US4.

### Within Each User Story

- DTOs before services
- Services before controllers
- Controllers before module registration
- Tests before implementation (for US2 per constitution)

### Parallel Opportunities

- T002, T003 can run in parallel with T001
- T008–T013 (all migrations) can run in parallel
- T016, T017 (DTOs) can run in parallel
- US3, US4, US5 can run in parallel after US2 completes
- T048, T049, T052 (polish) can run in parallel

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (database + migrations)
3. Complete Phase 3: US1 — Deck and Card CRUD
4. Complete Phase 4: US2 — Review flow with SM-2
5. **STOP and VALIDATE**: Full review cycle works end-to-end

### Full Delivery

6. Complete Phase 5: US3 — Lifecycle phases
7. Complete Phase 6: US4 — Daily limits
8. Complete Phase 7: US5 — Statistics
9. Complete Phase 8: Polish
10. Run quickstart.md validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Constitution mandates TDD for SM-2 algorithm (tests in US2 are NOT optional)
- Raw SQL with parameterized queries throughout — no ORM
- All card_states updates must be atomic (SQL transaction)
- Soft-delete pattern: WHERE deleted_at IS NULL in all queries
