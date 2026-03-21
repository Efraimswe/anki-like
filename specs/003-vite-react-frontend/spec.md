# Feature Specification: Vite React Frontend

**Feature Branch**: `003-vite-react-frontend`
**Created**: 2026-03-20
**Status**: Draft
**Input**: User description: "build simple frontend on vite react spa, just to see how backend works, simple but friendly design"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Project Structure Separation (Priority: P0)

Before the frontend is built, the existing backend code must be moved into a `backend/` subdirectory and the frontend scaffolded in a `frontend/` subdirectory, creating a clean monorepo layout.

**Why this priority**: This is a structural prerequisite — all other work depends on this separation being done first.

**Independent Test**: Can be tested by verifying the backend still builds and runs from `backend/`, and the frontend dev server starts from `frontend/`.

**Acceptance Scenarios**:

1. **Given** the current flat project structure, **When** the restructure is complete, **Then** all backend source code, config, and dependencies reside under `backend/`
2. **Given** the restructured project, **When** the user runs the backend from `backend/`, **Then** it starts and responds to API requests as before
3. **Given** the restructured project, **When** the user runs the frontend dev server from `frontend/`, **Then** it starts and serves the app

---

### User Story 2 - Browse and Manage Decks (Priority: P1)

A user opens the frontend app and sees a list of all their decks. They can create a new deck, edit its name, or delete it. This is the main entry point and proves the frontend can communicate with the backend API.

**Why this priority**: Decks are the top-level entity — without deck management, nothing else is usable.

**Independent Test**: Can be fully tested by opening the app, creating a deck, editing it, and deleting it.

**Acceptance Scenarios**:

1. **Given** the app is loaded, **When** the user views the home page, **Then** all existing decks are displayed with their names and card counts
2. **Given** the user is on the home page, **When** they create a new deck, **Then** the deck appears in the list without a page reload
3. **Given** a deck exists, **When** the user edits or deletes it, **Then** the change is reflected immediately in the list

---

### User Story 3 - Manage Cards Within a Deck (Priority: P2)

A user clicks into a deck and sees all cards in it. They can add new cards (front/back), edit existing cards, and delete cards.

**Why this priority**: Cards are the core content — users need to populate decks before reviewing.

**Independent Test**: Can be tested by navigating into a deck, adding a card with front/back text, editing it, and deleting it.

**Acceptance Scenarios**:

1. **Given** the user opens a deck, **When** the deck loads, **Then** all cards are listed showing front text and a preview of back text
2. **Given** the user is inside a deck, **When** they add a new card with front and back text, **Then** the card appears in the list
3. **Given** a card exists, **When** the user edits or deletes it, **Then** the change is reflected immediately

---

### User Story 4 - Review Cards with Spaced Repetition (Priority: P3)

A user starts a review session for a deck. Cards due for review are shown one at a time — front first, then the user reveals the back and rates their recall. The rating is submitted to the backend.

**Why this priority**: This is the core learning loop, but depends on decks and cards existing first.

**Independent Test**: Can be tested by starting a review session, revealing a card answer, and submitting a quality rating.

**Acceptance Scenarios**:

1. **Given** a deck has cards due for review, **When** the user starts a review session, **Then** the first due card's front is displayed
2. **Given** a card front is shown, **When** the user reveals the answer, **Then** the back text is displayed along with rating buttons
3. **Given** the user rates a card, **When** they submit the rating, **Then** the next due card is shown (or a completion message if none remain)

---

### User Story 5 - View Study Statistics (Priority: P4)

A user can view basic statistics about their study activity — cards reviewed, upcoming reviews, and per-deck progress.

**Why this priority**: Nice to have for demonstrating the statistics API, but not essential for core functionality.

**Independent Test**: Can be tested by navigating to a statistics page and verifying numbers display.

**Acceptance Scenarios**:

1. **Given** the user has review history, **When** they open the statistics page, **Then** summary stats (cards reviewed today, total reviews) are displayed

### Edge Cases

- What happens when the backend API is unreachable? The frontend should show a clear connection error message.
- What happens when a deck has zero cards and the user starts a review? The frontend should show an informative empty state.
- What happens when the user submits a card with empty front or back text? Validation should prevent submission.
- What happens when a review session has no cards due? The user should see a "nothing to review" message.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Project MUST be restructured into `backend/` and `frontend/` top-level directories before frontend development begins
- **FR-002**: Backend MUST continue to function identically after being moved to `backend/`
- **FR-003**: Frontend MUST be a Vite + React single-page application in `frontend/`
- **FR-004**: Frontend MUST provide full CRUD interface for decks (list, create, edit, delete)
- **FR-005**: Frontend MUST provide full CRUD interface for cards within a deck (list, create, edit, delete)
- **FR-006**: Frontend MUST provide a review session interface showing card front, revealing back, and submitting quality ratings
- **FR-007**: Frontend MUST display loading states while API requests are in progress
- **FR-008**: Frontend MUST display user-friendly error messages when API requests fail
- **FR-009**: Frontend MUST provide a statistics view showing basic study metrics
- **FR-010**: Frontend MUST use a clean, friendly visual design suitable for a study tool
- **FR-011**: Frontend MUST validate that card front and back text are not empty before submission

### Key Entities

- **Deck**: A named collection of cards — displayed as a list on the home page
- **Card**: A flashcard with front and back text, belonging to a deck
- **Review Session**: A sequence of due cards presented for recall rating
- **Statistics**: Aggregated study data (reviews per day, cards due, deck progress)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can perform all deck and card CRUD operations from the frontend without using API tools
- **SC-002**: Users can complete a full review session (reveal + rate) for a deck entirely through the UI
- **SC-003**: The frontend loads and displays the deck list within 2 seconds on a standard connection
- **SC-004**: All backend functionality remains working after the project restructure with no API changes
- **SC-005**: The design is visually clean and consistent — no unstyled or broken layouts across all views

## Assumptions

- No authentication is needed — single-user experience consistent with current backend design
- The backend API base URL will be configured via environment variable for the frontend
- The frontend will use a lightweight approach — no complex state management library required
- The design will use a CSS utility framework or simple custom styles — no heavy component library needed
