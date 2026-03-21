# Tasks: Anki-Like Learning Steps & Interval Hints

**Input**: Design documents from `/specs/004-anki-learning-steps/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Database migration and shared utilities

- [x] T001 Add `learning_step` column to CardState and migrate interval from days to minutes in backend/prisma/schema.prisma
- [x] T002 Create and run Prisma migration to apply schema changes via backend/prisma/migrations/
- [x] T003 Add interval formatting utility function (minutes → human-readable "1m", "10m", "1d", "4d", "1mo") in backend/src/reviews/interval-format.ts

**Checkpoint**: Schema updated, migration applied, utility ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Update SM-2 service to work in minutes and support learning steps

**⚠️ CRITICAL**: Both user stories depend on the SM-2 service changes

- [x] T004 Refactor SM2Service to use minute-based intervals throughout, add learning steps config (newSteps: [1, 10], relearningSteps: [10], graduatingInterval: 1440, easyGraduatingInterval: 5760) in backend/src/reviews/sm2.service.ts
- [x] T005 Add `calculateWithLearningSteps()` method to SM2Service that handles learning/relearning phase transitions with step tracking in backend/src/reviews/sm2.service.ts
- [x] T006 Add `previewIntervals()` method to SM2Service that returns projected intervals for all 4 ratings given current card state in backend/src/reviews/sm2.service.ts
- [x] T007 Update existing SM-2 unit tests and add learning step test cases (Again→step0, Good→step1, Good→graduate, Easy→skip, reset on Again) in backend/test/unit/sm2.service.spec.ts
- [x] T008 Update ReviewsService to use minute-based intervals and pass learning step index in backend/src/reviews/reviews.service.ts

**Checkpoint**: SM-2 engine fully updated with learning steps, all tests passing

---

## Phase 3: User Story 1 - Learning Steps for Failed Cards (Priority: P1) 🎯 MVP

**Goal**: Cards rated "Again" re-enter learning phase with sub-day intervals and reappear in same session

**Independent Test**: Start review, click Again, verify card reappears within minutes (not next day)

### Implementation for User Story 1

- [x] T009 [US1] Update ReviewsService.submitReview() to handle learning step advancement (Good→next step, Again→step 0, Easy→graduate) and set dueDate using minute intervals in backend/src/reviews/reviews.service.ts
- [x] T010 [US1] Update ReviewsService.getDueCards() to include learning-phase cards whose dueDate has passed (even if due within same session) in backend/src/reviews/reviews.service.ts
- [x] T011 [US1] Update ReviewsController to include intervalHints in due cards response by calling previewIntervals() in backend/src/reviews/reviews.controller.ts
- [x] T012 [US1] Update frontend ReviewSession to re-fetch or re-sort cards when a learning card becomes due again during the session in frontend/src/pages/ReviewSession.tsx

**Checkpoint**: Cards rated "Again" reappear in same session after learning step interval

---

## Phase 4: User Story 2 - Interval Hints on Rating Buttons (Priority: P2)

**Goal**: Each rating button shows projected next interval (e.g., "1m", "10m", "1d")

**Independent Test**: Reveal card answer, verify each button displays human-readable interval hint

### Implementation for User Story 2

- [x] T013 [US2] Update frontend DueCard type to include intervalHints field in frontend/src/api/types.ts
- [x] T014 [P] [US2] Add interval hint display below each rating button label in frontend/src/pages/ReviewSession.tsx
- [x] T015 [P] [US2] Add frontend interval formatting utility (fallback for display) in frontend/src/utils/formatInterval.ts

**Checkpoint**: All 4 rating buttons show projected interval hints

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T016 Verify existing backend tests pass with minute-based intervals in backend/test/unit/sm2.service.spec.ts
- [x] T017 Manual end-to-end test: create deck, add cards, review with Again/Good/Easy, verify learning steps and interval hints work correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (schema + migration)
- **US1 (Phase 3)**: Depends on Phase 2 (SM-2 with learning steps)
- **US2 (Phase 4)**: Depends on T011 (interval hints in API response)
- **Polish (Phase 5)**: Depends on all stories complete

### Within Each User Story

- Backend changes before frontend changes
- Service layer before controller layer
- Controller before frontend consumption

### Parallel Opportunities

- T003 can run in parallel with T001-T002 (different files)
- T013, T014, T015 can run in parallel (different files)
- US1 backend (T009-T011) must complete before US2 frontend (T014) can consume hints

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Schema migration
2. Complete Phase 2: SM-2 learning steps engine
3. Complete Phase 3: Learning steps in review flow
4. **STOP and VALIDATE**: Cards rated "Again" reappear in same session
5. Then add interval hints (Phase 4)

### Incremental Delivery

1. Schema + SM-2 engine → Foundation ready
2. Add US1 (learning steps) → Test: Again brings card back → MVP!
3. Add US2 (interval hints) → Test: buttons show intervals → Complete!
