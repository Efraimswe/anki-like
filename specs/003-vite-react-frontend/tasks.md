# Tasks: Vite React Frontend

**Input**: Design documents from `/specs/003-vite-react-frontend/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested — test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US0, US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Restructure project into monorepo layout and scaffold frontend

- [x] T001 Move all backend files into `backend/` subdirectory using `git mv` (preserve history)
- [x] T002 Update backend config paths: `backend/tsconfig.json`, `backend/tsconfig.build.json`, `backend/nest-cli.json` to reflect new location
- [x] T003 Update `backend/package.json` scripts if any paths changed
- [x] T004 Move `.env.example` and `.prettierrc` into `backend/`
- [x] T005 Verify backend builds and starts from `backend/` directory
- [x] T006 Scaffold Vite + React + TypeScript project in `frontend/` using `npm create vite@latest`
- [x] T007 Install frontend dependencies: `react-router-dom`, `tailwindcss`, `@tailwindcss/vite`
- [x] T008 Configure TailwindCSS in `frontend/vite.config.ts` and `frontend/src/index.css`
- [x] T009 Create `frontend/.env.example` with `VITE_API_BASE_URL=http://localhost:3000/api/v1`
- [x] T010 Add CORS configuration to backend in `backend/src/main.ts` (allow `http://localhost:5173`)

**Checkpoint**: Both backend and frontend start independently. Frontend shows default Vite page.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared frontend infrastructure that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T011 Create API client module with typed fetch wrapper in `frontend/src/api/client.ts` (base URL from env, JSON headers, error handling)
- [x] T012 [P] Create TypeScript interfaces for all API types in `frontend/src/api/types.ts` (Deck, Card, DueCard, ReviewResult, Statistics, DailyLimits)
- [x] T013 [P] Create shared UI components: Layout shell with nav in `frontend/src/components/Layout.tsx`
- [x] T014 [P] Create shared UI components: LoadingSpinner in `frontend/src/components/LoadingSpinner.tsx`, ErrorMessage in `frontend/src/components/ErrorMessage.tsx`, EmptyState in `frontend/src/components/EmptyState.tsx`
- [x] T015 Configure React Router with route definitions in `frontend/src/App.tsx` (routes: `/`, `/decks/:id`, `/decks/:id/review`, `/stats`)
- [x] T016 Apply base Tailwind styles and friendly color palette in `frontend/src/index.css`

**Checkpoint**: Frontend has routing, API client, shared components, and consistent styling. Ready for user story pages.

---

## Phase 3: User Story 1 - Browse and Manage Decks (Priority: P1) 🎯 MVP

**Goal**: Users can see all decks, create new ones, edit names, and delete decks from the home page.

**Independent Test**: Open app → see deck list → create deck → edit name → delete it. All changes persist via API.

### Implementation for User Story 1

- [x] T017 [US1] Create deck API functions in `frontend/src/api/decks.ts` (getDecks, getDeck, createDeck, updateDeck, deleteDeck)
- [x] T018 [US1] Create DeckList page in `frontend/src/pages/DeckList.tsx` — fetches and displays all decks with card count and due count
- [x] T019 [US1] Add create-deck form/modal to `frontend/src/pages/DeckList.tsx` — name input, submit creates deck and refreshes list
- [x] T020 [US1] Add inline edit and delete actions to each deck item in `frontend/src/pages/DeckList.tsx`
- [x] T021 [US1] Add delete confirmation dialog in `frontend/src/components/ConfirmDialog.tsx`

**Checkpoint**: User Story 1 fully functional — deck CRUD works end-to-end through the UI.

---

## Phase 4: User Story 2 - Manage Cards Within a Deck (Priority: P2)

**Goal**: Users can click into a deck to see its cards, add new cards (front/back), edit, and delete cards.

**Independent Test**: Click deck → see card list → add card with front/back → edit it → delete it.

### Implementation for User Story 2

- [x] T022 [P] [US2] Create card API functions in `frontend/src/api/cards.ts` (getCards, createCard, updateCard, deleteCard)
- [x] T023 [US2] Create DeckDetail page in `frontend/src/pages/DeckDetail.tsx` — shows deck name, card list with front text preview, back to deck list link
- [x] T024 [US2] Add create-card form to `frontend/src/pages/DeckDetail.tsx` — front/back text inputs with validation (non-empty), card type selector (basic/reverse/cloze)
- [x] T025 [US2] Add inline edit and delete actions for each card in `frontend/src/pages/DeckDetail.tsx`
- [x] T026 [US2] Add "Start Review" button to DeckDetail that navigates to `/decks/:id/review`

**Checkpoint**: User Story 2 fully functional — card CRUD works within a deck.

---

## Phase 5: User Story 3 - Review Cards with Spaced Repetition (Priority: P3)

**Goal**: Users can start a review session, see card fronts, reveal backs, and rate recall (Again/Hard/Good/Easy).

**Independent Test**: Start review for a deck with due cards → see front → reveal → rate → next card → session complete message.

### Implementation for User Story 3

- [x] T027 [P] [US3] Create review API functions in `frontend/src/api/reviews.ts` (getDueCards, submitReview)
- [x] T028 [US3] Create ReviewSession page in `frontend/src/pages/ReviewSession.tsx` — fetches due cards, shows remaining count, handles empty state ("nothing to review")
- [x] T029 [US3] Implement card display flow in ReviewSession: show front → "Show Answer" button → reveal back → show rating buttons (Again, Hard, Good, Easy)
- [x] T030 [US3] Implement rating submission in ReviewSession: submit rating → advance to next card → show completion screen when done
- [x] T031 [US3] Show review progress in ReviewSession: remaining cards count, daily limits remaining (remainingNew, remainingReviews)

**Checkpoint**: User Story 3 fully functional — complete review session flow works.

---

## Phase 6: User Story 4 - View Study Statistics (Priority: P4)

**Goal**: Users can view basic study statistics — reviews count, accuracy, retention, daily breakdown.

**Independent Test**: Navigate to stats page → see summary numbers and daily breakdown.

### Implementation for User Story 4

- [x] T032 [P] [US4] Create statistics API functions in `frontend/src/api/statistics.ts` (getStatistics, getDailyLimits)
- [x] T033 [US4] Create Statistics page in `frontend/src/pages/Statistics.tsx` — shows retention rate, total reviews, accuracy, time spent
- [x] T034 [US4] Add daily breakdown table/list to Statistics page showing per-day reviews, time, and accuracy
- [x] T035 [US4] Add daily limits display and edit form to Statistics page (maxNewCards, maxReviews)

**Checkpoint**: User Story 4 fully functional — stats page displays data from API.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements across all views

- [x] T036 [P] Add responsive design tweaks to all pages for mobile viewports
- [x] T037 [P] Add navigation highlighting for active route in `frontend/src/components/Layout.tsx`
- [x] T038 Verify all loading states, error states, and empty states display correctly across all pages
- [x] T039 Run quickstart.md validation — follow setup steps end-to-end and verify both backend and frontend work
- [x] T040 Update root `README.md` with new monorepo structure and setup instructions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (Decks) → US2 (Cards) depends on US1 for navigation context
  - US3 (Review) depends on US2 for having cards to review
  - US4 (Stats) is fully independent of US1-US3
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no story dependencies
- **US2 (P2)**: Can start after US1 (DeckDetail links from DeckList)
- **US3 (P3)**: Can start after US2 (review needs cards created via DeckDetail)
- **US4 (P4)**: Can start after Foundational — independent of US1-US3

### Parallel Opportunities

- T012, T013, T014 can run in parallel (different files, no deps)
- T017 and T022 can run in parallel (different API modules)
- T027 and T032 can run in parallel (different API modules)
- US4 can be built in parallel with US2 or US3

---

## Parallel Example: Foundational Phase

```bash
# These can run in parallel (different files):
Task T012: "Create TypeScript interfaces in frontend/src/api/types.ts"
Task T013: "Create Layout shell in frontend/src/components/Layout.tsx"
Task T014: "Create shared components: LoadingSpinner, ErrorMessage, EmptyState"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (restructure + scaffold)
2. Complete Phase 2: Foundational (API client, types, layout, routing)
3. Complete Phase 3: User Story 1 (deck CRUD)
4. **STOP and VALIDATE**: Test deck management end-to-end
5. Demo if ready — backend integration is proven

### Incremental Delivery

1. Setup + Foundational → infrastructure ready
2. Add US1 (Decks) → Test → Demo (MVP!)
3. Add US2 (Cards) → Test → Demo
4. Add US3 (Review) → Test → Demo (core learning loop complete)
5. Add US4 (Stats) → Test → Demo (full feature set)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
