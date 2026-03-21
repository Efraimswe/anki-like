# Feature Specification: Anki-Like Learning Steps & Interval Hints

**Feature Branch**: `004-anki-learning-steps`
**Created**: 2026-03-20
**Status**: Draft
**Input**: User description: "Fix spaced repetition to include Anki-like learning steps with sub-day intervals and show interval hints on review buttons"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Learning Steps for Failed Cards (Priority: P1)

When a user rates a card as "Again" during a review session, the card should re-enter a learning phase with short, sub-day intervals (e.g., 1 minute, then 10 minutes) before graduating back to the review queue. Currently, "Again" sets the card to 1 day — the user never sees the card again in the same session.

**Why this priority**: This is the core bug — without learning steps, the spaced repetition system cannot reinforce failed cards within the same study session, which is the fundamental behavior users expect from Anki-style tools.

**Independent Test**: Start a review session, click "Again" on a card, and verify the card reappears within the same session after the learning step interval elapses.

**Acceptance Scenarios**:

1. **Given** a card is in the review phase, **When** the user rates it "Again", **Then** the card enters a learning/relearning phase with a short interval (e.g., 1 minute) and reappears in the current session
2. **Given** a card is in the learning phase at step 1, **When** the user rates it "Good", **Then** the card advances to step 2 (e.g., 10 minutes) and reappears after that interval
3. **Given** a card is on its final learning step, **When** the user rates it "Good", **Then** the card graduates back to the review queue with the appropriate graduated interval
4. **Given** a card is in the learning phase, **When** the user rates it "Again", **Then** the card resets to the first learning step

---

### User Story 2 - Interval Hints on Rating Buttons (Priority: P2)

During a review session, each rating button should display a hint showing the next interval if that button is clicked (e.g., "Again" shows "<1m", "Good" shows "10m", "Easy" shows "4d"). This matches Anki's behavior and helps the user make informed rating decisions.

**Why this priority**: Interval hints are essential UX for spaced repetition — users need to see the consequences of their rating choice to make informed decisions. However, it depends on the scheduling logic from US1.

**Independent Test**: Reveal a card answer and verify each button shows a human-readable interval hint below its label.

**Acceptance Scenarios**:

1. **Given** a card answer is revealed, **When** the user sees the rating buttons, **Then** each button displays the projected next interval in human-readable format (e.g., "1m", "10m", "1d", "4d")
2. **Given** a new card in the learning phase, **When** the answer is revealed, **Then** the "Good" button shows the next learning step interval and "Easy" shows the graduated interval
3. **Given** a review card with interval of 30 days, **When** the answer is revealed, **Then** the buttons show calculated intervals based on the card's current state (e.g., Again: 1m, Hard: 15d, Good: 1mo, Easy: 2mo)

### Edge Cases

- What happens when a card completes all learning steps but the session ends? The card should retain its learning progress and resume from where it left off in the next session.
- What happens when the user rates "Easy" on a learning card? The card should skip remaining learning steps and graduate immediately with a bonus interval.
- How are sub-day intervals displayed? Use short human-readable labels: "1m" for 1 minute, "10m" for 10 minutes, "1h" for 1 hour, "1d" for 1 day, "2mo" for 2 months.
- What happens when interval calculations produce fractional minutes? Round to the nearest sensible unit.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support sub-day intervals measured in minutes for learning-phase cards
- **FR-002**: System MUST define configurable learning steps (default: 1 minute, 10 minutes) for new and failed cards
- **FR-003**: When a card is rated "Again", it MUST re-enter the learning phase at step 1 with a sub-day interval
- **FR-004**: When a learning-phase card is rated "Good", it MUST advance to the next learning step; on the final step, it MUST graduate to review phase
- **FR-005**: When a learning-phase card is rated "Easy", it MUST immediately graduate with a bonus interval (skip remaining steps)
- **FR-006**: Learning-phase cards MUST reappear within the same review session when their step interval elapses
- **FR-007**: Each rating button MUST display the projected next interval as a human-readable hint below the button label
- **FR-008**: Interval hints MUST be calculated based on the card's current scheduling state
- **FR-009**: The scheduling system MUST store the current learning step index so progress persists across sessions
- **FR-010**: Sub-day intervals MUST be stored in minutes (not days) to allow precise scheduling

### Key Entities

- **Learning Steps**: An ordered list of sub-day intervals (in minutes) that a card progresses through when in learning/relearning phase
- **Card State (extended)**: Now includes a learning step index and supports minute-level interval granularity
- **Interval Hint**: A projected next-interval value calculated for each rating option, displayed to the user

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Cards rated "Again" reappear within the same study session (within 1-10 minutes, not next day)
- **SC-002**: Users can see the projected interval for each rating option before making their choice
- **SC-003**: Cards progress through learning steps correctly — each "Good" rating advances one step until graduation
- **SC-004**: The review experience matches expected Anki behavior for learning-phase cards (sub-day cycling)

## Assumptions

- Default learning steps: [1, 10] (minutes) — matching Anki's defaults
- Default graduating interval: 1 day (after completing all learning steps with "Good")
- Default easy graduating interval: 4 days (when "Easy" is pressed on a learning card)
- Interval display format follows Anki conventions: "<1m", "10m", "1d", "4d", "1mo", etc.
- The backend API will expose a new endpoint or extend the existing review response to include projected intervals for each rating
- The constitution will be updated to reflect learning-step requirements as part of Algorithm Correctness
