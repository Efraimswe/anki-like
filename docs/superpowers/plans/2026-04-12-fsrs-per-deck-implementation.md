# Per-Deck FSRS Scheduler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace SM-2 with Anki-parity FSRS, store settings per deck, return server-computed interval hints, and add per-deck optimization.

**Architecture:** Introduce a shared server-side FSRS domain module and a deck-level FSRS config model, migrate card state from SM-2 fields to FSRS memory-state fields, keep the review UI thin by rendering backend-computed hints, and add a deck settings path for optimization. Validate formulas/defaults against Anki `25.09.x` during implementation.

**Tech Stack:** Next.js App Router, Prisma/PostgreSQL, TypeScript, Zod, Vitest

---

## File Structure

- `prisma/schema.prisma`
  - Extend deck/card state schema for per-deck FSRS config and FSRS memory state.
- `prisma/migrations/*`
  - Add migration for FSRS config/state fields and any compatibility backfill.
- `src/lib/fsrs.ts`
  - New FSRS scheduler core and interval preview helpers.
- `src/lib/fsrs-defaults.ts`
  - Anki-aligned default config/constants for latest stable target.
- `src/lib/fsrs-migration.ts`
  - Conversion helpers from current SM-2-ish card state to FSRS memory state.
- `src/lib/fsrs-optimize.ts`
  - Optimization orchestration and insufficient-data guard.
- `src/lib/validations.ts`
  - Add schemas for FSRS optimization/settings route inputs if needed.
- `src/types/index.ts`
  - Replace SM-2-shaped review/client types with FSRS-aware types.
- `src/app/api/reviews/session/[deckId]/route.ts`
  - Read deck FSRS config and return FSRS interval hints.
- `src/app/api/reviews/submit/route.ts`
  - Apply FSRS scheduling and persist memory-state updates.
- `src/app/api/decks/[id]/...`
  - Add deck-level FSRS settings/optimization endpoints or extend existing deck route structure.
- `src/app/(protected)/decks/[id]/page.tsx`
  - Add entry point to deck settings/options.
- `src/app/(protected)/decks/[id]/settings/page.tsx` or equivalent
  - Deck-level FSRS settings/optimization UI.
- `tests/unit/*`
  - New FSRS core, migration, and optimization tests.
- `tests` or route-level test targets
  - Review/session endpoint behavior tests.

## Task 1: Lock Anki Parity Inputs

**Files:**
- Create: `src/lib/fsrs-defaults.ts`
- Modify: `docs/superpowers/specs/2026-04-12-fsrs-per-deck-design.md`

- [ ] Capture the target Anki stable version in code comments/constants as the parity target (`25.09.x` at implementation time).
- [ ] Record the exact default FSRS values used by Anki for:
  - desired retention
  - maximum interval
  - default parameter weights
  - any required learning/relearning interactions
- [ ] Add a short implementation note in the spec if upstream Anki source confirms any behavior that differs from the current assumptions.

## Task 2: Redesign Persistence for Per-Deck FSRS

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_fsrs_per_deck/*`

- [ ] Add per-deck FSRS configuration storage.
- [ ] Add FSRS memory-state fields to `CardState`.
- [ ] Decide whether old SM-2 fields remain nullable/unused for compatibility or are removed immediately; prefer keeping them temporarily if migration risk is lower.
- [ ] Ensure schema supports:
  - reading deck-specific FSRS settings fast during session generation
  - persisting optimized weights per deck
  - updating card memory state on every review
- [ ] Include a migration/backfill strategy for existing rows so current data remains schedulable after deploy.

## Task 3: Implement FSRS Core and Migration Helpers

**Files:**
- Create: `src/lib/fsrs.ts`
- Create: `src/lib/fsrs-migration.ts`
- Remove or deprecate usage of: `src/lib/sm2.ts`

- [ ] Implement the pure FSRS scheduling core used by the backend.
- [ ] Implement preview/hint generation from the same core so session payloads can include rating hints.
- [ ] Implement hybrid conversion for existing cards:
  - convert meaningful existing review state into FSRS memory state
  - treat trivial/no-history cards as effectively new
- [ ] Keep date/time handling deterministic and server-safe.
- [ ] Document any places where Anki behavior is approximated rather than copied exactly, and keep those approximations out of user-visible defaults where possible.

## Task 4: Replace Review Route Integration

**Files:**
- Modify: `src/app/api/reviews/session/[deckId]/route.ts`
- Modify: `src/app/api/reviews/submit/route.ts`
- Modify: `src/types/index.ts`

- [ ] Update session loading to fetch deck FSRS config with the selected deck.
- [ ] Replace SM-2 `previewIntervals()` usage with FSRS preview generation.
- [ ] Replace SM-2 state mapping in submit with FSRS state loading and persistence.
- [ ] Keep response shapes stable where possible so the current review page needs minimal changes.
- [ ] Update review-result payloads and shared types to stop exposing obsolete SM-2 fields unless still needed for compatibility.

## Task 5: Add Per-Deck Optimization Backend

**Files:**
- Create: `src/lib/fsrs-optimize.ts`
- Modify: relevant deck API route files under `src/app/api/decks/...`
- Modify: `src/lib/validations.ts`

- [ ] Add a deck-scoped optimization action that reads that deck’s review history only.
- [ ] Enforce an insufficient-history threshold before optimization runs.
- [ ] On success, persist optimized parameters immediately to that deck’s FSRS config.
- [ ] On refusal, return a clear API response explaining that defaults remain active.
- [ ] On failure, keep the previous config unchanged.

## Task 6: Add Deck-Level FSRS Settings UI

**Files:**
- Modify: `src/app/(protected)/decks/[id]/page.tsx`
- Create: `src/app/(protected)/decks/[id]/settings/page.tsx` or an equivalent deck-options route/component
- Modify: `src/types/index.ts`

- [ ] Add a visible path from deck detail into deck-level options/settings.
- [ ] Show the deck’s current FSRS status:
  - default vs optimized
  - key summary values relevant to the user
- [ ] Add an optimize action with loading, success, refusal, and failure states.
- [ ] Keep the UX narrow: no raw-weight editor in this feature.

## Task 7: Update Review UI Contract Usage

**Files:**
- Modify: `src/app/(protected)/review/[deckId]/page.tsx`
- Modify: `src/types/index.ts`

- [ ] Ensure the review page consumes backend-provided interval hints without local scheduler assumptions.
- [ ] Preserve the instant-feeling flow by continuing to render hints directly from the session payload and requesting the next payload after submit.
- [ ] Remove UI coupling to SM-2-specific fields/types if any remain.

## Task 8: Replace Tests and Add New Coverage

**Files:**
- Replace or add under: `tests/unit/*`
- Add route/integration tests in the existing test layout

- [ ] Replace the current SM-2 unit suite with FSRS-focused scheduler tests.
- [ ] Add migration conversion tests for:
  - mature cards
  - trivial/new cards
  - relearning/learning edge cases if supported by the final model
- [ ] Add optimization tests for:
  - insufficient history refusal
  - successful per-deck optimization persistence
- [ ] Add route-level tests for:
  - session payload includes FSRS hints
  - submit persists FSRS state
  - deck-level optimization endpoint behavior

## Task 9: Clean Up SM-2 Runtime Usage

**Files:**
- Modify or remove: `src/lib/sm2.ts`
- Modify: any files importing `sm2`

- [ ] Remove runtime imports of `src/lib/sm2.ts`.
- [ ] Keep a compatibility shim only if it reduces migration churn during the rollout.
- [ ] Ensure no API route or UI component still depends on SM-2 behavior.

## Task 10: Verify End-to-End Behavior

**Files:**
- No required new files; verify against code and tests

- [ ] Run unit tests for FSRS core and migration logic.
- [ ] Run the repo test suite.
- [ ] Run a review flow manually:
  - load a deck session
  - reveal card
  - submit each rating
  - observe next-card/hint behavior
- [ ] Run optimization manually on:
  - a deck with insufficient history
  - a deck with enough history
- [ ] Confirm the deck uses deck-specific parameters after optimization.

## Assumptions

- The parity target is latest stable Anki, currently `25.09.2`, and implementation work must verify final formulas/defaults against upstream sources at coding time.
- Deck-level FSRS settings are stored directly per deck in v1; reusable presets are out of scope.
- Optimization updates parameters for future scheduling decisions and does not perform a full retroactive deck reschedule in v1.
- Offline queueing is out of scope.
