# Feature Specification: Migrate to Next.js Fullstack App

**Feature Branch**: `006-nextjs-fullstack-migration`
**Created**: 2026-03-31
**Status**: Draft
**Input**: User description: "instead of backend nest frontend vite we need to make it nextjs fullstack app"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unified Application Access (Priority: P1)

A user navigates to the application and experiences the same functionality as today — browsing decks, managing cards, running review sessions, viewing statistics, and managing settings — but served from a single Next.js application instead of separate frontend and backend services.

**Why this priority**: This is the core migration goal. Every existing feature must continue working in the new architecture. Without functional parity, the migration has no value.

**Independent Test**: Can be tested by navigating through every existing page (sign-up, sign-in, deck list, deck detail, review session, settings, statistics) and confirming all actions work as before.

**Acceptance Scenarios**:

1. **Given** an existing user, **When** they sign in, **Then** they can access all previously available features (decks, cards, reviews, statistics, settings, sessions)
2. **Given** a new visitor, **When** they sign up, **Then** their account is created and they can immediately use the application
3. **Given** any authenticated user, **When** they perform any CRUD operation on decks or cards, **Then** the operation succeeds and data persists correctly

---

### User Story 2 - Authentication & Session Management (Priority: P1)

A user signs up, signs in, and manages their active sessions. JWT-based authentication continues to protect all private routes. Users can view and revoke sessions from settings.

**Why this priority**: Authentication is foundational — all other features depend on it. It must work correctly in the new architecture.

**Independent Test**: Can be tested by signing up, signing in, accessing a protected page, and revoking a session from settings.

**Acceptance Scenarios**:

1. **Given** a signed-out user, **When** they attempt to access a protected page, **Then** they are redirected to the sign-in page
2. **Given** a signed-in user, **When** they view their sessions, **Then** they see all active sessions and can revoke any of them
3. **Given** a signed-in user, **When** they update their profile, **Then** changes are saved and reflected immediately

---

### User Story 3 - Review Session with Spaced Repetition (Priority: P1)

A user starts a review session for a deck and reviews cards using the SM-2 spaced repetition algorithm with Anki-style learning steps. Daily limits for new and review cards are respected.

**Why this priority**: This is the core learning feature of the application and must be preserved with identical behavior.

**Independent Test**: Can be tested by creating a deck with cards, starting a review session, and submitting reviews with different ratings to verify scheduling behavior.

**Acceptance Scenarios**:

1. **Given** a deck with due cards, **When** a user starts a review session, **Then** cards are presented according to the SM-2 algorithm with learning steps
2. **Given** a user reviewing cards, **When** they submit a rating, **Then** the next review interval is calculated correctly and the card is rescheduled
3. **Given** daily limits are configured, **When** limits are reached, **Then** no additional new/review cards are presented

---

### User Story 4 - Developer Experience Improvement (Priority: P2)

A developer working on the project deals with a single Next.js codebase instead of managing separate backend and frontend projects with different build systems, configurations, and deployment pipelines.

**Why this priority**: While not user-facing, this is a key motivation for the migration — reducing operational complexity and improving developer velocity.

**Independent Test**: Can be tested by cloning the repo, running a single install and dev command, and verifying the full application starts.

**Acceptance Scenarios**:

1. **Given** a developer cloning the repo, **When** they run the install and dev commands, **Then** the full application starts from a single process
2. **Given** a developer making changes, **When** they modify a server action or page component, **Then** changes are reflected with hot reload

---

### Edge Cases

- What happens when the database is unreachable? The application should display a user-friendly error page.
- What happens when a user's JWT expires mid-session? The user should be redirected to sign-in gracefully without data loss on in-progress reviews.
- What happens when a user accesses a route that doesn't exist? A proper 404 page should be displayed.
- How does the application handle concurrent review submissions for the same card? The last submission should win without causing errors.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide all existing functionality (auth, decks, cards, reviews, statistics, sessions, settings, user profiles) within a single Next.js application
- **FR-002**: System MUST use the existing PostgreSQL database (Neon serverless) via Prisma without schema changes
- **FR-003**: System MUST implement server-side API routes or server actions to replace the existing NestJS REST endpoints
- **FR-004**: System MUST preserve JWT-based authentication with the same security guarantees (password hashing, token-based sessions)
- **FR-005**: System MUST protect all private routes and redirect unauthenticated users to sign-in
- **FR-006**: System MUST preserve the SM-2 spaced repetition algorithm behavior identically, including Anki-style learning steps and daily limits
- **FR-007**: System MUST preserve all existing UI pages: sign-up, sign-in, deck list, deck detail, review session, settings (index, profile, sessions)
- **FR-008**: System MUST maintain the existing visual design (TailwindCSS styling, GSAP animations, responsive mobile-first layout)
- **FR-009**: System MUST be runnable with a single development command from the project root
- **FR-010**: System MUST consolidate the separate backend/ and frontend/ directories into a unified Next.js project structure. Old directories are retained until all features are verified working, then deleted as a final cleanup step

### Key Entities

- **User**: A registered user with email, hashed password, and profile information. Owns decks and has review history.
- **Deck**: A collection of flashcards created by a user with name and description.
- **Card**: A flashcard belonging to a deck with front/back content and scheduling metadata (interval, ease factor, due date, learning step).
- **Review**: A record of a user's review of a card, including rating and resulting schedule changes.
- **Session**: An active authentication session tied to a user, with device/browser metadata.
- **DailyLimits**: Per-user configuration for maximum new cards and review cards per day.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All existing user-facing features are accessible and functional in the migrated application with zero feature regression
- **SC-002**: Application starts and is fully usable from a single development command in under 30 seconds
- **SC-003**: All existing SM-2 algorithm unit tests pass with identical results in the new project structure
- **SC-004**: Users can complete a full workflow (sign up, create deck, add cards, review cards, view statistics) without errors
- **SC-005**: Page load times remain comparable to the current application (under 3 seconds for initial load)
- **SC-006**: The project has a single package.json at the root instead of separate backend/frontend packages

## Clarifications

### Session 2026-03-31

- Q: Should old `backend/` and `frontend/` directories be deleted as part of migration? → A: Delete only after all features are verified working in the new structure (Option C — phased cleanup).

## Assumptions

- The existing Prisma schema and PostgreSQL database will be reused as-is with no data migration needed
- TailwindCSS 4 and GSAP animations are compatible with Next.js (both are framework-agnostic)
- The existing SM-2 algorithm logic can be extracted and reused without modification
- Next.js App Router will be used (current standard) rather than Pages Router
- Server Actions or Route Handlers will replace NestJS REST endpoints
- The existing responsive mobile-first design will be preserved through component reuse
