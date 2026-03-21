# Research: Anki-Like Learning Steps

## Decision 1: Learning Step Intervals

**Decision**: Use Anki's default learning steps: [1, 10] minutes for new cards, [10] minutes for relearning (lapsed) cards.

**Rationale**: Anki's defaults are battle-tested across millions of users. The 1min → 10min progression gives enough repetition within a session to reinforce failed cards without being tedious.

**Alternatives considered**:
- SuperMemo's approach (no sub-day steps) — rejected because it's the current broken behavior
- Longer steps [5, 15, 30] — unnecessarily complex for v1; users can customize later

## Decision 2: Interval Storage Granularity

**Decision**: Store intervals in minutes (integer) instead of days. An interval of 1440 = 1 day.

**Rationale**: Sub-day intervals require minute-level precision. Storing in minutes is the simplest approach — no schema type changes needed (still an integer), just a unit change. All existing day-based intervals will be migrated: `interval * 1440`.

**Alternatives considered**:
- Separate `intervalMinutes` field — rejected because it splits logic unnecessarily
- Store as float days (0.00069 = 1min) — rejected because floating point imprecision causes scheduling bugs

## Decision 3: Interval Hint Calculation

**Decision**: Calculate interval hints server-side and return them in the review queue response. The backend will compute what each rating would produce for the current card state and include it in the due cards response.

**Rationale**: Server-side calculation keeps the algorithm logic in one place (SM-2 service). The frontend just displays what it receives.

**Alternatives considered**:
- Client-side calculation — rejected because it duplicates SM-2 logic in the frontend
- Separate endpoint per card — rejected because it causes N+1 request problems

## Decision 4: Graduating Interval

**Decision**: Default graduating interval = 1 day (1440 minutes). Easy graduating interval = 4 days (5760 minutes). Matches Anki defaults.

**Rationale**: These are Anki's proven defaults and match user expectations.

## Decision 5: Learning Step Field on CardState

**Decision**: Add `learningStep` integer field to CardState (default 0). When in learning/relearning phase, this tracks the current position in the steps array.

**Rationale**: Minimal schema change. The step index combined with the config's step array determines the current interval. Reset to 0 on "Again", increment on "Good".
