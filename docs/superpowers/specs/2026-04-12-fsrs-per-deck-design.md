# Per-Deck FSRS Scheduler Design

## Summary

Replace the current SM-2 scheduler with an FSRS implementation that mirrors the latest stable Anki release behavior, using the backend as the scheduling source of truth and returning precomputed interval hints to the client for an instant-feeling review UI.

As of April 12, 2026, the latest stable Anki release is `25.09.2`. The implementation should align with Anki `25.09.x` behavior and validate formulas/defaults against current upstream Anki sources during implementation, because scheduler details can change between releases.

The scheduler must be per-deck in the same spirit as Anki deck options/presets. In this app, the first version will store FSRS settings per deck directly instead of introducing a reusable preset system.

## Product Behavior

### Review flow

- The review session API remains the source of truth for which cards are available and what each rating button means.
- When the frontend requests a review session for a deck, the backend returns the due cards plus precomputed interval hints for `again`, `hard`, `good`, and `easy`.
- The frontend does not run the scheduler locally. It only renders server-provided hints and submits the chosen rating.
- Reviewing should feel instant by keeping the current session-fetch/submit loop, with the backend always returning data ready to render.

### Scheduler behavior

- Scheduling must switch from SM-2 to FSRS for review cards.
- Learning and relearning steps remain deck-configurable concepts, but review scheduling must follow FSRS logic and defaults matching current stable Anki.
- Existing cards should migrate with a hybrid strategy:
  - cards with meaningful review history/state should be converted into initial FSRS memory state
  - cards without meaningful state should behave like new cards
- The first implementation should apply new or optimized parameters to future scheduling decisions. It should not immediately reschedule every existing card in the deck.

### Per-deck settings

- Each deck gets its own FSRS configuration.
- The first version must support:
  - desired retention
  - maximum interval
  - FSRS parameters/weights
  - optimization status/metadata
- The first version does not require manual editing of raw FSRS weights.

### Optimization

- Optimization is per-deck.
- A user can trigger optimization from a deck-level settings/options surface.
- Optimization applies immediately on success.
- If a deck does not have enough review history, optimization must refuse to run and keep default Anki FSRS parameters for that deck.
- The UI should clearly communicate success, refusal due to insufficient data, and failure.

## Data Model Direction

### Card state

The current `CardState` model is SM-2 shaped and stores `easeFactor` and `repetitions`. FSRS needs memory-state fields instead.

The implementation should move `CardState` to an FSRS-oriented model:

- keep:
  - `phase`
  - `interval`
  - `learningStep`
  - `dueDate`
- add:
  - `stability`
  - `difficulty`
  - any additional FSRS scheduling fields required for Anki parity
- stop using SM-2-specific state for scheduling:
  - `easeFactor`
  - `repetitions`

Old columns may be retained temporarily for migration safety, but the runtime scheduler should no longer depend on them once FSRS is active.

### Deck-level FSRS config

Each deck should have stored FSRS config rather than a single app-wide config. This can be modeled either as fields on `Deck` or as a dedicated `DeckFsrsConfig` relation. A dedicated relation is preferable if it keeps deck concerns cleaner and makes optimization metadata explicit.

Expected stored values:

- `desiredRetention`
- `maximumInterval`
- `weights`
- timestamps for creation/update
- optional optimization metadata such as review-count snapshot and last optimized time

### Review history

Optimization depends on review history, so `ReviewLog` remains a key source of truth. The implementation should preserve enough data for later optimization passes and avoid schema changes that make historical replay harder.

## API and UI Changes

### Review APIs

- `GET /api/reviews/session/:deckId`
  - must switch interval hint generation from SM-2 to FSRS
  - must read deck-specific FSRS config
  - must keep returning card payloads the frontend can render without extra computation
- `POST /api/reviews/submit`
  - must schedule with FSRS
  - must persist updated FSRS memory state
  - must preserve review logging needed for optimization and statistics

### Deck settings/options UI

Add a deck-level settings/options surface reachable from the deck detail page. It should expose:

- current FSRS mode/config summary
- optimize action
- optimization result state

It does not need full manual raw-weight editing in this feature.

## Acceptance Criteria

- Review scheduling behavior no longer comes from `src/lib/sm2.ts`.
- Interval hints displayed in the review UI come from backend-computed FSRS results.
- FSRS settings are stored per deck and used when reviewing cards from that deck.
- Per-deck optimization can be triggered from the UI.
- Optimization refuses gracefully when review history is insufficient.
- Existing non-trivial cards continue reviewing through migration without being reset to fully new behavior.
- Unit and route-level tests cover FSRS scheduling, migration/conversion, and optimization guardrails.

## Assumptions

- "Same as Anki" means parity with latest stable Anki behavior at implementation time, currently `25.09.2`.
- Per-deck settings are sufficient for this app; a reusable preset system can be introduced later if needed.
- Offline review queueing is explicitly out of scope for this feature.
