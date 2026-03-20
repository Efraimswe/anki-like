# Feature Specification: Migrate from Raw SQL to Prisma ORM

**Feature Branch**: `002-prisma-migration`
**Created**: 2026-03-19
**Status**: Draft
**Input**: User description: "let's migrate from raw sql to prisma"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Replace Raw SQL with Prisma Schema and Client (Priority: P1)

As a developer, I want all database interactions to use Prisma Client instead of raw SQL strings so that I have type-safe queries, auto-completion, and a single source of truth for the data model.

**Why this priority**: This is the core migration. Every other improvement depends on having Prisma integrated and raw SQL removed.

**Independent Test**: Can be verified by confirming all existing API endpoints return identical responses before and after migration. All existing unit and integration tests continue to pass.

**Acceptance Scenarios**:

1. **Given** the existing database with data, **When** Prisma is introduced, **Then** all existing tables are represented in the Prisma schema and introspection matches the current database structure
2. **Given** any service method that previously used raw SQL, **When** it is rewritten with Prisma Client, **Then** it produces identical results for the same inputs
3. **Given** the application starts up, **When** Prisma Client connects to the database, **Then** all existing functionality works without regression

---

### User Story 2 - Replace Custom Migration Runner with Prisma Migrate (Priority: P2)

As a developer, I want to use Prisma Migrate instead of the custom migration runner so that schema changes are tracked, versioned, and reproducible through standard tooling.

**Why this priority**: Standardizing migrations reduces maintenance burden and enables safer schema evolution, but the app works without this if US1 is done.

**Independent Test**: Can be verified by running Prisma migration commands against a fresh database and confirming the resulting schema matches the current production schema exactly.

**Acceptance Scenarios**:

1. **Given** a fresh database, **When** Prisma migrations are applied, **Then** the resulting schema matches the existing database structure (all tables, indexes, constraints)
2. **Given** the old migration runner and files, **When** Prisma Migrate is adopted, **Then** the old runner and SQL migration files are removed

---

### User Story 3 - Enable Prisma Studio for Database Browsing (Priority: P3)

As a developer, I want a convenient script to launch Prisma Studio so that I can visually browse and edit database records during development.

**Why this priority**: Developer convenience tool; not required for the application to function.

**Independent Test**: Can be verified by running the studio script and confirming the web UI opens and displays all tables with correct data.

**Acceptance Scenarios**:

1. **Given** the Prisma schema is configured, **When** the developer runs the studio script, **Then** a web-based database browser opens showing all tables and their data

---

### Edge Cases

- What happens if the existing database has data that doesn't match Prisma's expected types or constraints?
- How does the system handle the transition period where both raw SQL and Prisma might coexist during incremental migration?
- What happens if Prisma introspection reveals schema differences from what the raw SQL migrations created?
- How are PostgreSQL-specific features (GIN indexes on tags, CHECK constraints on ease_factor) represented in the Prisma schema?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST define a Prisma schema that accurately represents all six existing tables (decks, cards, card_states, review_logs, daily_limits, daily_counters)
- **FR-002**: System MUST replace all raw SQL queries in every service with equivalent Prisma Client calls
- **FR-003**: System MUST maintain identical API response shapes and behavior for all 14 existing endpoints
- **FR-004**: System MUST preserve all existing database constraints (CHECK constraints, unique indexes, GIN indexes, foreign keys, cascades)
- **FR-005**: System MUST remove the custom DatabaseService connection pool and migration runner after Prisma adoption
- **FR-006**: System MUST preserve atomic transaction behavior for review submission (read state, compute SM-2, update state, log review, increment counter)
- **FR-007**: System MUST provide a script to launch Prisma Studio for development database browsing
- **FR-008**: System MUST preserve soft-delete behavior (filtering by deleted_at IS NULL) across all queries
- **FR-009**: All existing tests MUST continue to pass after migration with equivalent assertions

### Key Entities

- **Deck**: Container for flashcards with name, description, soft-delete support
- **Card**: Flashcard with front/back content, type (basic/reverse/cloze), tags, deck relationship
- **CardState**: Review scheduling state per card (interval, ease factor, repetitions, phase, due date)
- **ReviewLog**: Historical record of each review action with before/after state
- **DailyLimit**: Configurable limits for new cards and total reviews per day
- **DailyCounter**: Per-date counters tracking new and review card counts

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of existing API endpoints return identical responses after migration (zero behavioral regression)
- **SC-002**: All existing tests pass without modification to test assertions
- **SC-003**: Zero raw SQL strings remain in service layer code after migration
- **SC-004**: Developer can browse all database tables visually within 10 seconds of running a single command
- **SC-005**: New database schema changes can be created and applied using a single standard command

## Assumptions

- The existing database on Neon PostgreSQL remains the target; no database engine change
- Prisma supports all PostgreSQL features currently in use (GIN indexes, CHECK constraints, UPSERT)
- The migration is internal/technical; no user-facing API changes
- Prisma Client's connection pooling replaces the custom pg Pool configuration
- The SM-2 algorithm service remains pure logic (no database interaction to migrate)
