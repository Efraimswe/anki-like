# Research: Prisma Migration

## R1: Prisma with NestJS Integration Pattern

**Decision**: Use `@prisma/client` with a dedicated `PrismaService` extending `PrismaClient` and implementing `OnModuleInit`.

**Rationale**: This is the official NestJS-Prisma integration pattern. PrismaService calls `$connect()` in `onModuleInit`, is exported from a global `PrismaModule`, and injected into services via constructor DI — exactly replacing the current `DatabaseService` pattern.

**Alternatives considered**:
- nestjs-prisma package: Adds unnecessary wrapper; the native pattern is 10 lines of code
- Direct PrismaClient instantiation per service: No connection pooling, no lifecycle management

## R2: Prisma with Neon Serverless PostgreSQL

**Decision**: Use standard Prisma PostgreSQL provider with the existing Neon connection string. No special adapter needed.

**Rationale**: Neon's pooler endpoint (already in use via `DATABASE_URL`) works with standard `pg` protocol. Prisma's `postgresql` provider connects through it natively. The `?sslmode=require` parameter is supported.

**Alternatives considered**:
- @prisma/adapter-neon with @neondatabase/serverless: Only needed for edge runtimes (Cloudflare Workers, Vercel Edge). Our Node.js backend uses standard TCP connections.

## R3: Handling Existing Database with Prisma (Introspect vs Fresh Schema)

**Decision**: Use `prisma db pull` (introspection) to generate the initial schema from the existing database, then refine naming conventions.

**Rationale**: Introspection ensures the Prisma schema exactly matches what exists in production. This avoids any drift between what the SQL migrations created and what Prisma expects. After introspection, we rename models to PascalCase and fields to camelCase per Prisma convention, using `@@map` and `@map` to preserve the actual table/column names.

**Alternatives considered**:
- Writing schema from scratch: Risk of subtle differences from actual DB (e.g., column defaults, index names)
- Baselining with `prisma migrate resolve`: Used after introspection to mark existing state as the baseline

## R4: Preserving PostgreSQL-Specific Features in Prisma

**Decision**: Use Prisma's native PostgreSQL features plus `dbgenerated()` for unsupported constraints.

**Rationale**:
- GIN index on `cards.tags`: Not natively supported by Prisma schema — use `@@index([tags], type: Gin)` (supported since Prisma 4.x)
- CHECK constraints (ease_factor >= 1.3, interval 0-365): Not supported in Prisma schema — these remain in the database. Use a raw migration SQL or keep as DB-level constraints via `prisma migrate` custom SQL.
- UPSERT: Prisma has native `upsert()` method — direct replacement for the raw `ON CONFLICT` queries
- Enum types: Use Prisma `enum` for card_type and phase

## R5: Transaction Pattern for Review Submission

**Decision**: Use Prisma interactive transactions (`prisma.$transaction(async (tx) => { ... })`) to replace the current raw SQL transaction pattern.

**Rationale**: The review submission requires reading card state, computing SM-2, updating card_states, inserting review_log, and incrementing daily_counters atomically. Prisma's interactive transactions provide the same ACID guarantees as the current `BEGIN/COMMIT/ROLLBACK` pattern in DatabaseService.

**Alternatives considered**:
- Sequential writes (Prisma batch transactions): Don't support reads within the transaction
- Application-level locks: Unnecessary complexity when DB transactions work

## R6: Soft-Delete Pattern with Prisma

**Decision**: Use Prisma middleware or explicit `where: { deletedAt: null }` clauses in all queries.

**Rationale**: Prisma doesn't have built-in soft-delete support. The simplest approach is adding `deletedAt: null` to every `where` clause that touches `decks` or `cards` tables, matching the current raw SQL pattern of `WHERE deleted_at IS NULL`. A Prisma middleware could automate this but adds hidden complexity — explicit filtering is clearer for a small codebase.

**Alternatives considered**:
- Prisma middleware for automatic soft-delete filtering: Over-engineering for 6 tables; makes debugging harder
- prisma-extension-soft-delete: Third-party dependency for minimal benefit

## R7: Migration Strategy (Zero Downtime)

**Decision**: Use `prisma db pull` → `prisma migrate resolve --applied "init"` to baseline the existing database, then use `prisma migrate dev` for future changes.

**Rationale**: This marks the current DB state as the baseline migration without running any SQL against the existing database. Future schema changes go through normal `prisma migrate dev` workflow. The old `src/database/migrations/*.sql` files and custom runner are deleted.

**Steps**:
1. `npx prisma db pull` — generates schema from existing DB
2. Refine schema (naming, relations, enums)
3. `npx prisma migrate dev --name init --create-only` — creates migration SQL without applying
4. `npx prisma migrate resolve --applied "init"` — marks as already applied
5. Delete old migration runner and SQL files
