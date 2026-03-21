# Tasks: JWT Auth, Settings & Navigation

**Input**: Design documents from `/specs/005-jwt-auth-settings/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rest-api.md

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)

---

## Phase 1: Setup

**Purpose**: Install dependencies and configure shared infrastructure

- [x] T001 Install backend auth dependencies: `bcrypt`, `@types/bcrypt`, `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `@types/passport-jwt`, `@fastify/cookie`, `ua-parser-js`, `@types/ua-parser-js` in backend/package.json
- [x] T002 Update Prisma schema with User and Session models, add `userId` to Deck, update relations in backend/prisma/schema.prisma
- [x] T003 Create destructive migration (truncate all data, add User/Session tables, add userId FK to Deck) in backend/prisma/migrations/2_auth/migration.sql

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Auth infrastructure that MUST be complete before any user story

**Warning**: No user story work can begin until this phase is complete

- [x] T004 Register `@fastify/cookie` in backend/src/main.ts
- [x] T005 [P] Create UsersModule and UsersService (create user, find by email, find by id, update) in backend/src/users/users.module.ts and backend/src/users/users.service.ts
- [x] T006 [P] Create SessionsModule and SessionsService (create session, find by user, find by id, delete, validate refresh token) in backend/src/sessions/sessions.module.ts and backend/src/sessions/sessions.service.ts
- [x] T007 Create AuthModule with AuthService (sign-up, sign-in, refresh, sign-out, cookie helpers, bcrypt hashing) in backend/src/auth/auth.module.ts and backend/src/auth/auth.service.ts
- [x] T008 [P] Create JwtStrategy (extract token from cookie, validate) in backend/src/auth/jwt.strategy.ts
- [x] T009 [P] Create JwtAuthGuard in backend/src/auth/jwt-auth.guard.ts
- [x] T010 [P] Create CsrfGuard (validate X-CSRF-Token header matches csrf_token cookie on POST/PATCH/DELETE) in backend/src/auth/csrf.guard.ts
- [x] T011 Apply JwtAuthGuard globally and CsrfGuard globally in backend/src/app.module.ts (with public route exclusions for auth endpoints)
- [x] T012 Add userId scoping to DecksService (all queries filter by userId from JWT) in backend/src/decks/decks.service.ts
- [x] T013 [P] Add userId scoping to CardsService (join through deck.userId) in backend/src/cards/cards.service.ts
- [x] T014 [P] Add userId scoping to ReviewsService (join through deck.userId) in backend/src/reviews/reviews.service.ts
- [x] T015 [P] Add userId scoping to StatisticsService (join through deck.userId) in backend/src/statistics/statistics.service.ts
- [x] T016 Update DecksController, CardsController, ReviewsController, StatisticsController to extract userId from request and pass to services

**Checkpoint**: Auth infrastructure ready — user story implementation can begin

---

## Phase 3: User Story 1 — Sign Up and Sign In (Priority: P1)

**Goal**: Users can create accounts, sign in, sign out; all data scoped to authenticated user

**Independent Test**: Visit app unauthenticated → redirected to sign-in → sign up → reach dashboard → sign out → sign back in

### Implementation

- [x] T017 [P] [US1] Create sign-up DTO with email/password validation in backend/src/auth/dto/sign-up.dto.ts
- [x] T018 [P] [US1] Create sign-in DTO in backend/src/auth/dto/sign-in.dto.ts
- [x] T019 [US1] Create AuthController with POST /auth/sign-up, /auth/sign-in, /auth/refresh, /auth/sign-out (set/clear HttpOnly cookies) in backend/src/auth/auth.controller.ts
- [x] T020 [P] [US1] Create frontend auth API client (signUp, signIn, signOut, refresh, getMe) in frontend/src/api/auth.ts
- [x] T021 [US1] Create useAuth hook (AuthContext with user state, sign-in/out methods, auto-refresh, CSRF header injection) in frontend/src/hooks/useAuth.tsx
- [x] T022 [P] [US1] Create SignIn page in frontend/src/pages/SignIn.tsx
- [x] T023 [P] [US1] Create SignUp page in frontend/src/pages/SignUp.tsx
- [x] T024 [US1] Create ProtectedRoute component (redirects to /sign-in if not authenticated) in frontend/src/components/ProtectedRoute.tsx
- [x] T025 [US1] Update frontend router: add /sign-in, /sign-up routes; wrap existing routes with ProtectedRoute in frontend/src/App.tsx
- [x] T026 [US1] Configure frontend API client to read csrf_token cookie and send X-CSRF-Token header on mutations in frontend/src/api/client.ts

**Checkpoint**: Sign up, sign in, sign out working; protected routes redirect unauthenticated users

---

## Phase 4: User Story 2 — Persistent Navigation Bar (Priority: P2)

**Goal**: Signed-in users see a navbar with Decks, Cards, Statistics, Settings links and sign-out action

**Independent Test**: Sign in → verify navbar visible on all pages → click each link → verify navigation

### Implementation

- [x] T027 [US2] Create Navbar component (links: Decks, Cards, Statistics, Settings; user display name/email; sign-out button) in frontend/src/components/Navbar.tsx
- [x] T028 [US2] Create layout wrapper that includes Navbar for all authenticated pages in frontend/src/components/Layout.tsx
- [x] T029 [US2] Integrate Layout into router (wrap protected routes with Layout) in frontend/src/App.tsx

**Checkpoint**: Navbar visible on all authenticated pages with working navigation

---

## Phase 5: User Story 3 — Session Management (Priority: P3)

**Goal**: Users can view and revoke active sessions from Settings

**Independent Test**: Sign in from two browsers → Settings > Sessions → see both → revoke one → other browser loses access

### Implementation

- [x] T030 [P] [US3] Create SessionsController with GET /sessions and DELETE /sessions/:id in backend/src/sessions/sessions.controller.ts
- [x] T031 [P] [US3] Create frontend sessions API client (getSessions, revokeSession) in frontend/src/api/sessions.ts
- [x] T032 [US3] Create Settings page with tabs (Profile, Sessions) in frontend/src/pages/Settings.tsx
- [x] T033 [US3] Create Sessions tab component (list sessions with device info, revoke button, current session indicator) in frontend/src/pages/Settings.tsx

**Checkpoint**: Session viewing and revocation working end-to-end

---

## Phase 6: User Story 4 — Settings: Profile and Theme (Priority: P4)

**Goal**: Users can update display name and toggle dark/light theme with persistence

**Independent Test**: Settings > Profile → change name → see in navbar; toggle dark mode → refresh → still dark; sign out/in → still dark

### Implementation

- [x] T034 [P] [US4] Create update-profile DTO in backend/src/users/dto/update-profile.dto.ts
- [x] T035 [P] [US4] Create UsersController with GET /users/me and PATCH /users/me in backend/src/users/users.controller.ts
- [x] T036 [P] [US4] Create frontend users API client (getMe, updateProfile) in frontend/src/api/users.ts
- [x] T037 [US4] Create useTheme hook (apply dark class to html element, persist via PATCH /users/me) in frontend/src/hooks/useTheme.tsx
- [x] T038 [US4] Create ThemeProvider component wrapping app in frontend/src/components/ThemeProvider.tsx
- [x] T039 [US4] Create Profile tab in Settings page (display name edit form, theme toggle) in frontend/src/pages/Settings.tsx
- [x] T040 [US4] Configure TailwindCSS darkMode: 'class' in frontend/tailwind.config.ts (or equivalent)
- [x] T041 [US4] Integrate ThemeProvider into app root in frontend/src/App.tsx

**Checkpoint**: Profile updates and theme toggle working with persistence across sessions

---

## Phase 7: User Story 5 — Cards Section (Priority: P5)

**Goal**: Global cards view showing all cards across all decks with deck name links

**Independent Test**: Navigate to Cards in navbar → see all cards with deck names → click deck name → navigate to deck

### Implementation

- [x] T042 [P] [US5] Add GET /cards endpoint (all cards for user with deck info) to CardsController in backend/src/cards/cards.controller.ts
- [x] T043 [US5] Create AllCards page (list all cards with front text, deck name as link to deck detail) in frontend/src/pages/AllCards.tsx
- [x] T044 [US5] Add /cards route to frontend router in frontend/src/App.tsx

**Checkpoint**: Cards section shows all cards across decks with deck navigation

---

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T045 Add token refresh interceptor (auto-retry 401s with /auth/refresh) in frontend/src/api/client.ts
- [x] T046 Handle edge cases: expired refresh token → clear state and redirect to sign-in
- [x] T047 Add loading and error states to SignIn, SignUp, and Settings pages
- [x] T048 Run quickstart.md validation scenarios end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3-7 (User Stories)**: All depend on Phase 2 completion
  - US1 (Sign Up/In): No dependencies on other stories
  - US2 (Navbar): Depends on US1 (needs auth context for user display)
  - US3 (Sessions): Depends on US1 (needs auth), can parallel with US2
  - US4 (Profile/Theme): Depends on US1 (needs auth), can parallel with US2/US3
  - US5 (Cards Section): Depends on US1 (needs auth) and US2 (needs navbar), can parallel with US3/US4
- **Phase 8 (Polish)**: Depends on all user stories complete

### Within Each User Story

- DTOs/models before services
- Services before controllers
- Backend before frontend API clients
- API clients before hooks/pages
- Hooks before pages that use them

### Parallel Opportunities

- T005, T006 (UsersService, SessionsService) in parallel
- T008, T009, T010 (JWT strategy, guards) in parallel
- T012, T013, T014, T015 (userId scoping across services) in parallel
- T017, T018 (DTOs) in parallel
- T022, T023 (SignIn, SignUp pages) in parallel
- T030, T031 (Sessions backend + frontend API) in parallel
- T034, T035, T036 (Profile DTO, controller, API client) in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (install deps, schema, migration)
2. Complete Phase 2: Foundational (auth infra, guards, userId scoping)
3. Complete Phase 3: User Story 1 (sign up/in/out, protected routes)
4. **STOP and VALIDATE**: Test auth flow end-to-end
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Auth infrastructure ready
2. US1 (Sign Up/In) → Core auth working (MVP!)
3. US2 (Navbar) → Navigation UX complete
4. US3 (Sessions) → Security management
5. US4 (Profile/Theme) → Personalization
6. US5 (Cards Section) → Power user feature
7. Polish → Edge cases, error handling

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Each user story independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
