# Tasks: Migrate to Next.js Fullstack App

**Input**: Design documents from `/specs/006-nextjs-fullstack-migration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested. Test tasks omitted except SM-2 unit test migration (required by spec SC-003).

**Organization**: Tasks grouped by user story for independent implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize Next.js project at repo root alongside existing code

- [X] T001 Initialize Next.js 15 project at repo root with App Router, TypeScript, TailwindCSS 4, ESLint in package.json and next.config.ts
- [X] T002 Move Prisma schema and migrations from backend/prisma/ to prisma/ and configure prisma/ path in package.json
- [X] T003 [P] Create environment config with .env.example containing DATABASE_URL, JWT_SECRET, JWT_EXPIRY, REFRESH_EXPIRY
- [X] T004 [P] Install dependencies: @prisma/client, prisma, bcrypt, jose, lucide-react, react-spinners, zod in package.json
- [X] T005 [P] Configure TypeScript tsconfig.json with path aliases (@/lib, @/components, @/hooks, @/types)
- [X] T006 Create Prisma client singleton with dev hot-reload caching in src/lib/prisma.ts
- [X] T007 Create shared TypeScript types (User, Deck, Card, CardState, ReviewLog, DailyLimit, Session, API error format) in src/types/index.ts

**Checkpoint**: Project scaffolded, Prisma connected, dependencies installed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Auth infrastructure and root layout that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Implement JWT helpers (sign, verify, decode) using jose library in src/lib/auth.ts
- [X] T009 Implement auth middleware for route protection (JWT verification, cookie parsing, redirect to sign-in) in middleware.ts
- [X] T010 [P] Create root layout with TailwindCSS, global styles, and font configuration in src/app/layout.tsx
- [X] T011 [P] Create shared UI components (LoadingSpinner, ErrorMessage, EmptyState, ConfirmDialog) migrated from frontend/src/components/ to src/components/ui/
- [X] T012 [P] Create useAuth hook (auth state, sign-in/out methods, token refresh) in src/hooks/use-auth.ts
- [X] T013 [P] Create useTheme hook migrated from frontend/src/hooks/useTheme.tsx to src/hooks/use-theme.ts
- [X] T014 Create Layout component (nav, sidebar, mobile responsive) migrated from frontend/src/components/Layout.tsx to src/components/layout/Layout.tsx
- [X] T015 Create protected layout wrapper that redirects unauthenticated users in src/app/(protected)/layout.tsx
- [X] T016 [P] Create Zod validation schemas for all DTOs (sign-up, sign-in, create-deck, update-deck, create-card, update-card, submit-review, update-daily-limits, update-profile, statistics-query) in src/lib/validations.ts

**Checkpoint**: Foundation ready — auth, layout, shared components, validation all in place

---

## Phase 3: User Story 2 — Authentication & Session Management (Priority: P1) 🎯 MVP

**Goal**: Users can sign up, sign in, manage sessions, and update profile. All private routes are protected.

**Independent Test**: Sign up → sign in → access protected page → view sessions → revoke a session → update profile

### Implementation

- [X] T017 [P] [US2] Implement sign-up API route (validate input, hash password, create user + session, return JWT) in src/app/api/auth/sign-up/route.ts
- [X] T018 [P] [US2] Implement sign-in API route (validate credentials, create session, return JWT) in src/app/api/auth/sign-in/route.ts
- [X] T019 [P] [US2] Implement token refresh API route (validate refresh cookie, rotate tokens) in src/app/api/auth/refresh/route.ts
- [X] T020 [P] [US2] Implement sign-out API route (invalidate session, clear cookies) in src/app/api/auth/sign-out/route.ts
- [X] T021 [US2] Create sign-up page migrated from frontend/src/pages/sign-up/ to src/app/(auth)/sign-up/page.tsx
- [X] T022 [US2] Create sign-in page migrated from frontend/src/pages/sign-in/ to src/app/(auth)/sign-in/page.tsx
- [X] T023 [P] [US2] Implement sessions list API route (GET) in src/app/api/sessions/route.ts
- [X] T024 [P] [US2] Implement session revoke API route (DELETE) in src/app/api/sessions/[id]/route.ts
- [X] T025 [US2] Create sessions settings page migrated from frontend/src/pages/settings-sessions/ to src/app/(protected)/settings/sessions/page.tsx
- [X] T026 [P] [US2] Implement get profile API route (GET /users/me) in src/app/api/users/me/route.ts
- [X] T027 [P] [US2] Implement update profile API route (PATCH /users/me) in src/app/api/users/me/route.ts (same file, PATCH handler)
- [X] T028 [US2] Create profile settings page migrated from frontend/src/pages/settings-profile/ to src/app/(protected)/settings/profile/page.tsx
- [X] T029 [US2] Create settings index page migrated from frontend/src/pages/settings-index/ to src/app/(protected)/settings/page.tsx

**Checkpoint**: Auth flow complete — sign up, sign in, session management, profile updates all working

---

## Phase 4: User Story 1 — Unified Application Access (Priority: P1)

**Goal**: Users can browse decks, manage cards with full CRUD, and view statistics — all existing features accessible.

**Independent Test**: Sign in → create deck → add cards → edit card → delete card → view deck list with counts → view statistics

### Implementation

- [X] T030 [P] [US1] Implement decks list API route (GET, with card/due counts) in src/app/api/decks/route.ts
- [X] T031 [P] [US1] Implement create deck API route (POST) in src/app/api/decks/route.ts (same file, POST handler)
- [X] T032 [P] [US1] Implement get/update/delete deck API routes in src/app/api/decks/[id]/route.ts
- [X] T033 [P] [US1] Implement create card API route (POST) in src/app/api/cards/route.ts
- [X] T034 [P] [US1] Implement update/delete card API routes in src/app/api/cards/[id]/route.ts
- [X] T035 [P] [US1] Implement statistics API route (GET with period query) in src/app/api/statistics/route.ts
- [X] T036 [US1] Create deck list page migrated from frontend/src/pages/deck-list/ to src/app/(protected)/decks/page.tsx
- [X] T037 [US1] Create deck detail page (with cards list, add/edit/delete cards) migrated from frontend/src/pages/deck-detail/ to src/app/(protected)/decks/[id]/page.tsx
- [X] T038 [US1] Create statistics page migrated from frontend/src/pages/ (if exists) or built per contracts to src/app/(protected)/statistics/page.tsx

**Checkpoint**: All CRUD operations for decks and cards working, statistics visible

---

## Phase 5: User Story 3 — Review Session with Spaced Repetition (Priority: P1)

**Goal**: Users can start review sessions with SM-2 algorithm, submit ratings, and have daily limits enforced.

**Independent Test**: Create deck with cards → start review → submit ratings (Again, Hard, Good, Easy) → verify scheduling → check daily limits

### Implementation

- [X] T039 [US3] Extract and migrate SM-2 algorithm logic from backend/src/modules/reviews/sm2.service.ts to src/lib/sm2.ts
- [X] T040 [US3] Extract and migrate daily limits logic from backend/src/modules/reviews/daily-limits.service.ts to src/lib/daily-limits.ts
- [X] T041 [P] [US3] Migrate SM-2 unit tests from backend/test/unit/sm2.service.spec.ts to tests/unit/sm2.test.ts (adapt for Vitest)
- [X] T042 [P] [US3] Implement review session API route (GET /reviews/session/:deckId — fetch due cards respecting daily limits) in src/app/api/reviews/session/[deckId]/route.ts
- [X] T043 [P] [US3] Implement submit review API route (POST /reviews/submit — apply SM-2, update card state, log review) in src/app/api/reviews/submit/route.ts
- [X] T044 [P] [US3] Implement daily limits API routes (GET, PUT) in src/app/api/reviews/daily-limits/route.ts
- [X] T045 [US3] Create review session page (show front → reveal → rate with interval hints) migrated from frontend/src/pages/review-session/ to src/app/(protected)/review/[deckId]/page.tsx
- [X] T046 [US3] Migrate interval formatting helper from backend/src/modules/reviews/interval-format.ts to src/lib/interval-format.ts

**Checkpoint**: Full review flow working — SM-2 scheduling, learning steps, daily limits, interval hints on buttons

---

## Phase 6: User Story 4 — Developer Experience (Priority: P2)

**Goal**: Single-command development, unified project structure.

**Independent Test**: Clone repo → npm install → npm run dev → app fully functional on localhost:3000

### Implementation

- [X] T047 [US4] Configure npm scripts (dev, build, start, test, lint, prisma:generate, prisma:studio) in package.json
- [X] T048 [US4] Configure Vitest for unit testing in vitest.config.ts
- [X] T049 [US4] Create home page redirect (/ → /decks for authenticated, /sign-in for unauthenticated) in src/app/page.tsx
- [X] T050 [US4] Add 404 not-found page in src/app/not-found.tsx
- [X] T051 [US4] Add global error boundary page in src/app/error.tsx
- [X] T052 [US4] Verify all SM-2 unit tests pass with `npm test`

**Checkpoint**: Single-command dev experience working, all tests pass

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: UI polish, final verification, old code cleanup

- [X] T053 [P] Ensure client-only pages/components that need browser APIs use "use client" appropriately
- [X] T054 [P] Ensure all API routes return consistent error format per contracts/api-routes.md
- [X] T055 Verify complete user flow: sign up → create deck → add cards → review → statistics → settings
- [ ] T056 Verify JWT expiry mid-session redirects gracefully to sign-in
- [ ] T057 Remove backend/ and frontend/ directories after full verification
- [ ] T058 Run quickstart.md validation (fresh install → dev → full flow)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US2 Auth (Phase 3)**: Depends on Phase 2 — recommended first (other stories need auth to test)
- **US1 CRUD (Phase 4)**: Depends on Phase 2 — can run parallel with Phase 3
- **US3 Reviews (Phase 5)**: Depends on Phase 2 — can run parallel with Phase 3/4
- **US4 DevEx (Phase 6)**: Depends on Phases 3-5 (needs all features to validate)
- **Polish (Phase 7)**: Depends on all story phases complete

### User Story Dependencies

- **US2 (Auth)**: Independent — no dependency on other stories
- **US1 (CRUD)**: Independent — no dependency on other stories (but needs auth routes from US2 to fully test end-to-end)
- **US3 (Reviews)**: Independent — needs decks/cards from US1 to fully test, but API routes can be built independently
- **US4 (DevEx)**: Depends on US1 + US2 + US3 all complete

### Within Each User Story

- API routes (marked [P]) can be built in parallel
- Pages depend on their corresponding API routes
- Migrations/extractions before new implementations

### Parallel Opportunities

- T003, T004, T005 in Phase 1 (all independent config files)
- T010, T011, T012, T013, T016 in Phase 2 (separate files)
- T017, T018, T019, T020 in Phase 3 (independent API routes)
- T030-T035 in Phase 4 (independent API routes)
- T041, T042, T043, T044 in Phase 5 (independent files)
- T053, T054 in Phase 7 (independent concerns)

---

## Parallel Example: Phase 3 (Auth API Routes)

```text
# Launch all auth API routes together:
Task: "Implement sign-up API route in src/app/api/auth/sign-up/route.ts"
Task: "Implement sign-in API route in src/app/api/auth/sign-in/route.ts"
Task: "Implement token refresh API route in src/app/api/auth/refresh/route.ts"
Task: "Implement sign-out API route in src/app/api/auth/sign-out/route.ts"

# Then pages (depend on routes):
Task: "Create sign-up page in src/app/(auth)/sign-up/page.tsx"
Task: "Create sign-in page in src/app/(auth)/sign-in/page.tsx"
```

---

## Implementation Strategy

### MVP First (Auth + Basic Access)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US2 Auth — sign in/up works
4. **STOP and VALIDATE**: Can sign up, sign in, access protected pages
5. Complete Phase 4: US1 CRUD — decks and cards work
6. **STOP and VALIDATE**: Full CRUD operational

### Incremental Delivery

1. Setup + Foundational → Project scaffolded
2. US2 Auth → Users can authenticate (MVP!)
3. US1 CRUD → Users can manage decks/cards
4. US3 Reviews → Full spaced repetition working
5. US4 DevEx → Clean single-command experience
6. Polish → Animations, error handling, old code removal

### Recommended Solo Developer Order

Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- SM-2 logic is extracted as-is — algorithm behavior must not change
- Old backend/ and frontend/ directories are kept until T057 (post-verification cleanup)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
