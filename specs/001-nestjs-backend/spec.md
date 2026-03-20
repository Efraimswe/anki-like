# Feature Specification: Spaced Repetition Backend Service

**Feature Branch**: `001-nestjs-backend`
**Created**: 2026-03-19
**Status**: Draft
**Input**: User description: "Build backend for Anki-like spaced repetition system — full feature set from constitution"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Organize Flashcards (Priority: P1)

A user creates decks to organize their study material, then adds flashcards
to those decks. Cards can be Basic (front/back), Reverse (auto-generates
both directions), or Cloze (fill-in-the-blank). Users can tag cards for
cross-deck organization.

**Why this priority**: Without cards and decks, no other feature functions.
This is the foundational data layer.

**Independent Test**: Create a deck, add cards of each type, retrieve them,
update them, and delete them. Verify all CRUD operations work independently.

**Acceptance Scenarios**:

1. **Given** no decks exist, **When** user creates a deck named "Spanish Vocab", **Then** the deck is persisted and retrievable by its ID
2. **Given** a deck exists, **When** user adds a Basic card with front "Hola" and back "Hello", **Then** the card is stored with type "basic" and linked to the deck
3. **Given** a deck exists, **When** user adds a Reverse card, **Then** the system auto-generates two separate cards (front→back and back→front), each with its own independent review state
4. **Given** a deck exists, **When** user adds a Cloze card with "The capital of France is {{Paris}}", **Then** the system parses and stores the cloze deletion correctly
5. **Given** cards exist, **When** user assigns tags ["geography", "europe"], **Then** cards are retrievable by tag across decks
6. **Given** a card exists, **When** user updates the front text, **Then** the change is persisted without affecting review state
7. **Given** a card exists, **When** user deletes it, **Then** the card is soft-deleted and no longer appears in reviews or listings

---

### User Story 2 - Review Cards with Spaced Repetition (Priority: P1)

A user starts a review session for a deck. The system presents due cards
(cards whose scheduled review date is today or earlier). The user sees the
front, mentally recalls the answer, reveals the back, then rates their
recall quality: Again, Hard, Good, or Easy. The system updates the card's
review schedule based on the SM-2 algorithm.

**Why this priority**: The review loop is the core product experience —
spaced repetition has no value without it.

**Independent Test**: Create cards, trigger them as due, complete a review
session rating cards with different qualities, verify intervals and ease
factors update correctly per SM-2.

**Acceptance Scenarios**:

1. **Given** a deck with due cards, **When** user requests due cards, **Then** the system returns cards where dueDate <= now, ordered by due date
2. **Given** a new card (0 repetitions), **When** user rates "Good", **Then** interval becomes 1 day and repetitions increments to 1
3. **Given** a card with 1 repetition, **When** user rates "Good", **Then** interval becomes 6 days
4. **Given** a card with 2+ repetitions, **When** user rates "Good", **Then** interval = previous interval * easeFactor
5. **Given** any card, **When** user rates "Again", **Then** interval resets to 1 day and repetitions resets to 0
6. **Given** any card, **When** user rates "Easy", **Then** interval increases faster than "Good" rating
7. **Given** any card, **When** user rates "Hard", **Then** interval increases slightly (less than "Good")
8. **Given** a card with ease factor near minimum, **When** user rates "Again", **Then** ease factor does not drop below 1.3
9. **Given** a review is submitted, **When** the system updates the card, **Then** dueDate is set to now + new interval

---

### User Story 3 - Card Lifecycle Management (Priority: P2)

Cards progress through lifecycle phases: New → Learning → Review → Relearning.
New cards enter the Learning phase on first review. Cards that are failed
during Review enter Relearning. The system tracks and enforces these
transitions.

**Why this priority**: Lifecycle phases affect how cards are scheduled and
presented, building on the core review mechanics.

**Independent Test**: Move a card through all four phases by simulating
review sequences, verify phase transitions are correct.

**Acceptance Scenarios**:

1. **Given** a newly created card, **Then** its phase is "new"
2. **Given** a "new" card, **When** it is reviewed for the first time, **Then** its phase transitions to "learning"
3. **Given** a "learning" card, **When** user rates "Good" enough times to graduate, **Then** phase transitions to "review"
4. **Given** a "review" card, **When** user rates "Again", **Then** phase transitions to "relearning"
5. **Given** a "relearning" card, **When** user rates "Good", **Then** phase transitions back to "review"

---

### User Story 4 - Daily Review Limits (Priority: P2)

The system enforces configurable daily limits on new cards introduced per
day and total reviews per day to prevent burnout. Once limits are reached,
no additional cards of that category are presented.

**Why this priority**: Prevents user burnout and is a key differentiator
for sustainable learning habits.

**Independent Test**: Set limits to small numbers (e.g., 2 new, 5 reviews),
perform reviews up to the limit, verify the system stops presenting cards.

**Acceptance Scenarios**:

1. **Given** a daily new card limit of 20, **When** user has already seen 20 new cards today, **Then** no more new cards are presented
2. **Given** a daily review limit of 200, **When** user has completed 200 reviews today, **Then** session ends with "daily limit reached" message
3. **Given** limits are configurable, **When** user sets new card limit to 10, **Then** the limit takes effect for the current day
4. **Given** a new day begins, **Then** daily counters reset

---

### User Story 5 - Study Statistics (Priority: P3)

Users can view their study statistics including retention rate, number of
reviews per day, time spent studying, and accuracy percentage. Statistics
help users track their learning progress over time.

**Why this priority**: Valuable for motivation and self-assessment but
not essential for core learning functionality.

**Independent Test**: Complete several review sessions over multiple days,
retrieve statistics, verify calculations are accurate.

**Acceptance Scenarios**:

1. **Given** completed reviews exist, **When** user requests statistics, **Then** retention rate is calculated as (correct reviews / total reviews) * 100
2. **Given** reviews over multiple days, **When** user requests daily breakdown, **Then** reviews-per-day counts are accurate for each date
3. **Given** review sessions with timestamps, **When** user requests time spent, **Then** total study time is calculated from session durations
4. **Given** reviews with ratings, **When** user requests accuracy, **Then** accuracy percentage reflects the ratio of Good+Easy ratings to total ratings

---

### Edge Cases

- What happens when a deck has no due cards? System returns empty list with next due date
- What happens when ease factor calculation would go below 1.3? Floor at 1.3
- What happens when interval calculation overflows reasonable bounds? Cap at 365 days
- What happens when a card is deleted mid-review session? Skip it gracefully, continue session
- What happens when Cloze syntax is malformed? Reject with descriptive error
- What happens when the same card is reviewed twice in the same request? Process only the first, ignore duplicate
- What happens when daily limit is set to 0? No cards of that type are presented

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support full CRUD operations for decks (create, read, update, soft-delete)
- **FR-002**: System MUST support full CRUD operations for cards within decks (create, read, update, soft-delete)
- **FR-003**: System MUST support three card types: Basic, Reverse, and Cloze
- **FR-004**: System MUST parse Cloze deletion syntax using `{{answer}}` notation
- **FR-005**: System MUST implement the SM-2 spaced repetition algorithm for scheduling reviews
- **FR-006**: System MUST enforce ease factor floor of 1.3
- **FR-007**: System MUST return due cards for a deck filtered by dueDate <= current timestamp
- **FR-008**: System MUST accept review ratings: Again (quality 0), Hard (quality 2), Good (quality 3), Easy (quality 5)
- **FR-009**: System MUST update interval, ease factor, repetitions, and due date atomically after each review
- **FR-010**: System MUST track card lifecycle phases: New, Learning, Review, Relearning
- **FR-011**: System MUST enforce phase transitions according to defined rules
- **FR-012**: System MUST enforce configurable daily limits for new cards (default: 20) and total reviews (default: 200)
- **FR-013**: System MUST reset daily counters at the start of each calendar day
- **FR-014**: System MUST calculate and return study statistics: retention rate, reviews per day, time spent, accuracy percentage
- **FR-015**: System MUST support tagging cards with arbitrary string tags
- **FR-016**: System MUST support querying cards by tag across decks
- **FR-017**: System MUST cap maximum review interval at 365 days
- **FR-018**: System MUST use soft-delete for decks and cards

### Key Entities

- **Deck**: A named collection of flashcards. Contains a name and serves as the organizational unit.
- **Card**: A flashcard with front content, back content, a type (Basic/Reverse/Cloze), and optional tags. Belongs to exactly one deck.
- **CardState (ReviewState)**: The scheduling state for a card — interval (days), ease factor, repetition count, due date, and lifecycle phase. Separate from card content to allow independent evolution.
- **ReviewLog**: A record of each individual review event — card reviewed, rating given, timestamp, time taken. Used for statistics calculation.
- **DailyLimit**: Configuration for maximum new cards per day and maximum reviews per day, with daily counters.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a deck and add 100 cards in under 5 minutes of total interaction time
- **SC-002**: Due cards for a deck are retrieved in under 200ms for decks with up to 10,000 cards
- **SC-003**: Review state updates complete in under 100ms per card
- **SC-004**: SM-2 algorithm produces identical scheduling results to reference SM-2 implementation for all rating sequences
- **SC-005**: Daily limits correctly prevent over-studying in 100% of tested scenarios
- **SC-006**: Statistics calculations match manual calculations with less than 0.1% deviation
- **SC-007**: System handles 100 concurrent users performing reviews without degradation
- **SC-008**: No data loss occurs during normal operations — all card states are recoverable

## Clarifications

### Session 2026-03-19

- Q: How are Reverse cards stored? → A: Option A — auto-generate two separate Card records (front→back and back→front), each with its own independent CardState. This matches Anki's behavior and keeps scheduling logic uniform.

## Assumptions

- Single-user system for v1 — no authentication or multi-tenancy required
- No sync or offline capabilities needed — this is a server-side backend
- No import/export functionality in v1
- Calendar day for daily limit resets is based on UTC
- Cloze syntax uses `{{answer}}` format; multiple cloze deletions in one card are supported
- Reverse cards auto-generate two separate Card records (front→back and back→front), each independently scheduled
- Maximum interval cap of 365 days is a reasonable upper bound
- Review session management is stateless — client tracks session progress, server processes individual reviews
