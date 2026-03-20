# Research: Spaced Repetition Backend Service

## R1: NestJS with Fastify Adapter

**Decision**: Use `@nestjs/platform-fastify` instead of default Express adapter.

**Rationale**: Fastify is ~2x faster than Express for JSON serialization workloads. NestJS provides first-class Fastify support. The review endpoint (high-frequency, small JSON payloads) benefits from Fastify's schema-based serialization.

**Alternatives considered**:
- Express (NestJS default): Slower, but larger ecosystem. Not needed for this API.
- Hono/Elysia: Faster but no NestJS integration.

## R2: Raw SQL with node-postgres (pg)

**Decision**: Use `pg` (node-postgres) directly with parameterized queries. No ORM.

**Rationale**: User requirement. Raw SQL gives full control over query optimization, especially for the due-cards query which needs efficient date filtering on potentially large card sets. Neon serverless works natively with `pg` over SSL.

**Alternatives considered**:
- TypeORM: User explicitly rejected.
- Prisma: User explicitly rejected (wants raw SQL).
- Drizzle: Lightweight but still an abstraction layer.

**Migration approach**: Plain `.sql` files executed in order, tracked via a `schema_migrations` table.

## R3: SM-2 Algorithm Implementation

**Decision**: Implement classic SM-2 with the quality mapping from the constitution.

**Rationale**: SM-2 is well-documented, deterministic, and testable. The constitution mandates faithful implementation with specific quality mappings.

**Key parameters**:
- Quality mapping: Again=0, Hard=2, Good=3, Easy=5
- Default ease factor: 2.5
- Minimum ease factor: 1.3
- Maximum interval: 365 days
- Ease factor formula: `EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))`
- Interval logic:
  - quality < 3: reset repetitions=0, interval=1
  - repetitions==0: interval=1
  - repetitions==1: interval=6
  - else: interval = round(interval * easeFactor)

**Alternatives considered**:
- FSRS (Free Spaced Repetition Scheduler): More modern but more complex; out of scope for v1 per Simplicity principle.

## R4: Neon Serverless PostgreSQL

**Decision**: Use Neon serverless PostgreSQL with connection pooling.

**Rationale**: User-provided infrastructure. Neon supports standard PostgreSQL wire protocol, works with `pg` driver over SSL with `channel_binding=require`.

**Connection considerations**:
- Use connection pooling (`-pooler` endpoint already in URL)
- Set `ssl: { rejectUnauthorized: true }` for Neon
- Keep pool size reasonable for serverless (max 10 connections)

## R5: Reverse Card Strategy

**Decision**: Auto-generate two separate Card records when a Reverse card is created.

**Rationale**: Clarified with user (Session 2026-03-19). Each direction gets its own CardState and is scheduled independently. This matches Anki's behavior and requires no special-casing in review logic.

**Implementation**: When card type is "reverse", the cards service creates two Card rows: one with original front/back, one with swapped front/back. Both reference the same `sourceCardId` for traceability. Both have type "basic" after creation (they behave as normal cards for review purposes).

## R6: Card Lifecycle Phase Transitions

**Decision**: Graduation from Learning requires 1 "Good" or "Easy" rating. Relearning to Review also requires 1 "Good" or "Easy".

**Rationale**: Simplest model that matches Anki's default behavior for new cards. Keeps implementation straightforward per Simplicity principle. Can be made configurable later.

**State machine**:
```
New → (first review) → Learning
Learning → (Good/Easy) → Review
Learning → (Again) → stays Learning, interval=1
Review → (Again) → Relearning
Review → (Good/Hard/Easy) → stays Review
Relearning → (Good/Easy) → Review
Relearning → (Again) → stays Relearning, interval=1
```

## R7: Statistics Time Range

**Decision**: Statistics are calculated over all-time by default, with optional date range filter.

**Rationale**: All-time gives the most useful default view. Date range filter allows daily/weekly/monthly breakdowns without overcomplicating the API.
