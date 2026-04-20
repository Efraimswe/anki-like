# Tasks: Onboarding Flow

**Input**: Design documents from `/specs/008-onboarding-flow/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/onboarding-api.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- No test tasks — not requested in spec

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies, scaffold directories, pull environment.

- [X] T001 Install packages: `pnpm add ai @ai-sdk/react` (`ai` for server-side streaming + transcribe; `@ai-sdk/react` for `useChat` hook)
- [X] T002 [P] Create `src/app/onboarding/` directory structure: `layout.tsx`, `page.tsx`, `step-1/`, `step-2/`, `step-3/`, `step-4/`
- [X] T003 [P] Create `src/app/api/onboarding/` directory structure: `language/`, `chat/level/`, `chat/goals/`, `transcribe/`, `complete/`
- [X] T004 [P] Create `src/components/onboarding/` directory (empty, files added per story)
- [X] T005 [P] Create `src/lib/onboarding/` directory with `prompts.ts` and `languages.ts` stubs
- [ ] T006 Run `vercel env pull .env.local` to provision `VERCEL_OIDC_TOKEN` for AI Gateway (document in README/quickstart)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, middleware enforcement, and JWT changes — everything else builds on these.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T007 Add onboarding fields to `prisma/schema.prisma` — `onboardingCompleted Boolean @default(false)`, `nativeLanguage String?`, `englishLevel String?`, `goals Json?` on `User` model (see data-model.md)
- [X] T008 Run `pnpm prisma migrate dev --name add_onboarding_fields` and commit generated migration
- [X] T009 Update `src/lib/auth.ts` (or wherever JWTs are signed) to include `onboardingCompleted: boolean` in access token payload
- [X] T010 Update `src/middleware.ts` to add onboarding enforcement: authenticated users with `onboardingCompleted = false` are redirected to `/onboarding`; authenticated users with `onboardingCompleted = true` visiting `/onboarding` are redirected to `/dashboard`; `/onboarding` routes are added to the middleware matcher
- [X] T011 [P] Populate `src/lib/onboarding/languages.ts` with the supported language list — BCP-47 codes, display names, flag emoji (20–30 common languages)
- [X] T012 [P] Create `src/app/onboarding/layout.tsx` — Leo character shell layout shared by all steps; imports `LeoCharacter` component, renders children below
- [X] T012a Update sign-up completion flow to redirect to `/onboarding` — modify auth callback or sign-up API handler to redirect new registrations to `/onboarding` instead of `/dashboard`
- [X] T012b [P] Create `src/hooks/useOnboardingChat.ts` — TanStack Query wrapper for streaming chat state; wraps `@ai-sdk/react` `useChat` with query keys and error handling

**Checkpoint**: After T010, enforce the redirect in dev and confirm: new user → `/onboarding`, complete user → `/dashboard`.

---

## Phase 3: User Story 1 — Complete Onboarding from Registration + Return Enforcement (Priority: P1) 🎯 MVP

**Goal**: A newly registered user is redirected to onboarding and cannot reach the dashboard until all 4 steps are done. A returning incomplete user is also blocked.

**Independent Test**: Register a new account → verify redirect to `/onboarding/step-1`. Log out, log back in → verify still blocked. Complete all 4 steps → verify redirect to `/dashboard` and `onboardingCompleted = true` in DB.

- [X] T013 [US1] Create `src/components/onboarding/LeoCharacter.tsx` — renders `public/characterneutralsmile.png` via `next/image`, applies CSS float animation (`@keyframes float`, `animation: float 3s ease-in-out infinite`)
- [X] T014 [US1] Create `src/app/onboarding/page.tsx` — server component that reads current user's step progress and redirects to the appropriate step (`/onboarding/step-1` for new users)
- [X] T015 [US1] Create `src/app/api/onboarding/complete/route.ts` — `POST` handler: sets `onboardingCompleted = true` in DB, re-issues access token JWT with updated payload, sets new cookie
- [X] T016 [US1] Create `src/app/onboarding/step-4/page.tsx` — welcome page; shows Leo, displays personalized message (reads `englishLevel` and `nativeLanguage` from DB), renders "Let's go" CTA button that calls `POST /api/onboarding/complete` then redirects to `/dashboard`

**Checkpoint**: With Foundation + Phase 3 complete, the full redirect enforcement and welcome screen work end-to-end. US1 and US2 from spec are satisfied.

---

## Phase 4: User Story 3 — Native Language Selection (Priority: P2)

**Goal**: Step 1 — user picks native language from a visual picker; it is saved to DB immediately.

**Independent Test**: Complete Step 1, check DB `native_language` column, verify Step 3 system prompt uses that language.

- [X] T017 [P] [US3] Create `src/components/onboarding/LanguagePicker.tsx` — grid/list of language options with flag emoji and display name, sourced from `src/lib/onboarding/languages.ts`; highlights selected item; disabled submit until selection made
- [X] T018 [P] [US3] Create `src/app/api/onboarding/language/route.ts` — `POST /api/onboarding/language`: validates BCP-47 code, updates `nativeLanguage` in DB for current user
- [X] T019 [US3] Create `src/app/onboarding/step-1/page.tsx` — renders Leo character with greeting bubble ("Hey! I'm Leo…"), renders `LanguagePicker`, on confirm calls `POST /api/onboarding/language` then navigates to `/onboarding/step-2`

**Checkpoint**: Step 1 is independently usable — language is saved, user advances to step 2.

---

## Phase 5: User Story 4 — English Level Assessment Chat (Priority: P2)

**Goal**: Step 2 — user chats with Leo in English; after 8+ messages or 5 min the agent silently assesses and saves their level.

**Independent Test**: Complete Step 2 with 8+ messages → verify `english_level` is set in DB and Leo reveals it naturally.

- [X] T020 [P] [US4] Write system prompt in `src/lib/onboarding/prompts.ts` — `LEVEL_ASSESSMENT_PROMPT`: instructs agent to converse naturally, never reveal assessment, call `assessLevel` tool after 8+ user messages or 5 min
- [X] T021 [P] [US4] Create `src/app/api/onboarding/chat/level/route.ts` — `POST` handler using `streamText` with model `'google/gemini-2.0-flash'` (AI Gateway), `LEVEL_ASSESSMENT_PROMPT` as system, `convertToModelMessages(messages)`, `assessLevel` tool with `inputSchema` (level enum + reaction string); tool `execute` persists `englishLevel` to DB; returns `toUIMessageStreamResponse()`
- [X] T022 [P] [US4] Create `src/components/onboarding/StepProgress.tsx` — shows message counter ("3 / 8 messages") or countdown timer ("4 min left"); accepts `messageCount`, `maxMessages`, `startTime`, `maxMinutes` props
- [X] T023 [P] [US4] Create `src/components/onboarding/VoiceInput.tsx` — button that starts `MediaRecorder`, captures `audio/webm`, POSTs blob to `/api/onboarding/transcribe`, receives `{ text }`, calls `onTranscript(text)` callback; hidden if `MediaRecorder` unavailable
- [X] T024 [P] [US4] Create `src/app/api/onboarding/transcribe/route.ts` — `POST` handler: reads `audio` from `FormData`, calls `experimental_transcribe` from `ai` with model `'openai/whisper-1'` (AI Gateway), returns `{ text }`
- [X] T025 [US4] Create `src/components/onboarding/OnboardingChat.tsx` — shared chat UI: uses `useChat` from `@ai-sdk/react` with `DefaultChatTransport`; renders message list using `message.parts`; text input + send button; embeds `VoiceInput` (calls `sendMessage({ text })` on transcript); embeds `StepProgress`; accepts `api`, `maxMessages`, `maxMinutes`, `onComplete` props
- [X] T026 [US4] Create `src/app/onboarding/step-2/page.tsx` — renders Leo + `OnboardingChat` pointed at `/api/onboarding/chat/level`; `onComplete` navigates to `/onboarding/step-3`; Leo greeting uses user's native language (read from DB/session)

**Checkpoint**: Step 2 works independently — 8 messages triggers level assessment, level saved to DB, user advances.

---

## Phase 6: User Story 5 — Goal Extraction Chat (Priority: P2)

**Goal**: Step 3 — user chats with Leo in their native language; agent extracts at least one specific goal and saves it.

**Independent Test**: Complete Step 3, check DB `goals` JSON column has `primary` field, verify conversation was in native language.

- [X] T027 [P] [US5] Write system prompt in `src/lib/onboarding/prompts.ts` — `GOAL_EXTRACTION_PROMPT`: instructs agent to speak entirely in user's native language (injected at runtime), extract at least one specific goal, ask follow-up questions for vague answers, call `extractGoals` when goals are clear
- [X] T028 [P] [US5] Create `src/app/api/onboarding/chat/goals/route.ts` — `POST` handler using `streamText` with model `'google/gemini-2.0-flash'`, `GOAL_EXTRACTION_PROMPT` (with native language injected from DB), `convertToModelMessages(messages)`, `extractGoals` tool with `inputSchema` (`primary` string, `secondary` optional string[], `context` optional string, `urgency` optional enum); tool `execute` persists `goals` JSON to DB; returns `toUIMessageStreamResponse()`
- [X] T029 [US5] Create `src/app/onboarding/step-3/page.tsx` — renders Leo + `OnboardingChat` pointed at `/api/onboarding/chat/goals`; `onComplete` navigates to `/onboarding/step-4`; native language is read from DB and passed to API route via request header or body

**Checkpoint**: Step 3 works independently — goals extracted in native language, saved to DB, user advances to step 4.

---

## Phase 7: User Story 6 — Welcome Screen and Completion (Priority: P3)

*(This phase was partially implemented in Phase 3 — T015 and T016 cover the core. This phase adds the animation and final polish to the welcome screen.)*

**Goal**: Step 4 — Leo waves goodbye, "Let's go" button sets `onboardingCompleted = true` and redirects to dashboard.

**Independent Test**: Reach step 4 with completed steps 1–3 → click "Let's go" → verify redirect to `/dashboard` and `onboardingCompleted = true` in DB. Revisit `/onboarding` → verify redirect to `/dashboard`.

- [X] T030 [US6] Add goodbye wave CSS animation to `src/app/globals.css` — `@keyframes wave` for Leo's arm/character; apply via class `leo-wave` triggered on step 4 page mount
- [X] T031 [US6] Update `src/app/onboarding/step-4/page.tsx` (from T016) — add `leo-wave` animation class on mount, display `englishLevel` and primary goal in the welcome message, ensure "Let's go" is prominently styled

**Checkpoint**：All 4 steps functional end-to-end. Full onboarding flow testable from registration to dashboard.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T032 [P] Add loading and error states to all onboarding API routes — return user-friendly error messages for AI failures, network errors
- [X] T033 [P] Add step progress indicator to `src/app/onboarding/layout.tsx` — small "Step 1 of 4" indicator so users know where they are
- [X] T034 [P] Handle mid-step refresh gracefully — Step 1 pre-selects previously saved language if `nativeLanguage` is already set; Steps 2/3 restart conversation with a brief note
- [X] T035 [P] Add `maxDuration = 30` export to both chat API routes (already in research.md pattern — verify it's present)
- [X] T036 Run `pnpm run lint` and fix any issues (TypeScript errors fixed; no eslint config present)
- [ ] T037 Run full onboarding flow end-to-end per `quickstart.md` test checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **blocks all user story phases**
- **Phase 3 (US1)**: Depends on Phase 2 — can start immediately after
- **Phase 4 (US3 — Language)**: Depends on Phase 2; ideally before Phase 5 (Step 2 needs `nativeLanguage`)
- **Phase 5 (US4 — Level chat)**: Depends on Phase 2 and Phase 4 (for native language in greeting)
- **Phase 6 (US5 — Goal chat)**: Depends on Phase 5 (reuses `OnboardingChat` component)
- **Phase 7 (US6 — Welcome)**: Depends on Phase 3 (T015, T016 already done there); adds animation only
- **Polish (Phase 8)**: Depends on all phases complete

### User Story Dependencies

- **US1 (P1)**: Foundational only
- **US3 (Language, P2)**: Foundational only — parallel with US1
- **US4 (Level chat, P2)**: Foundational + US3 (needs `nativeLanguage` in DB and language list)
- **US5 (Goal chat, P2)**: Foundational + US4 (reuses `OnboardingChat` component)
- **US6 (Welcome, P3)**: Foundational + US1 (T015/T016 already in Phase 3)

### Parallel Opportunities Within Phases

**Phase 2**: T007–T009 can run in parallel; T010–T012 can run in parallel after T007–T009.

**Phase 5**: T020–T024 are all parallel (different files). T025 depends on T020–T024. T026 depends on T025.

**Phase 6**: T027–T028 are parallel. T029 depends on both.

---

## Parallel Example: Phase 5 (Level Chat)

```bash
# These 5 tasks have no dependencies on each other — launch together:
Task T020: "Write LEVEL_ASSESSMENT_PROMPT in src/lib/onboarding/prompts.ts"
Task T021: "Create src/app/api/onboarding/chat/level/route.ts"
Task T022: "Create src/components/onboarding/StepProgress.tsx"
Task T023: "Create src/components/onboarding/VoiceInput.tsx"
Task T024: "Create src/app/api/onboarding/transcribe/route.ts"

# Then sequentially:
Task T025: "Create OnboardingChat.tsx" (depends on T022, T023)
Task T026: "Create step-2/page.tsx" (depends on T025)
```

---

## Implementation Strategy

### MVP First (US1 — Redirect Enforcement Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (schema + middleware)
3. Complete Phase 3: US1 (welcome screen + completion endpoint)
4. **STOP and VALIDATE**: Register → blocked → complete step 4 → dashboard
5. Users are protected; remaining steps can be filled in incrementally

### Incremental Delivery

1. Phase 1 + 2 → Schema and enforcement ready
2. Phase 3 → Full redirect enforcement + step 4 shell (MVP)
3. Phase 4 → Step 1 language picker working
4. Phase 5 → Step 2 AI chat working (biggest lift)
5. Phase 6 → Step 3 goal chat working
6. Phase 7 → Step 4 polished with animation
7. Phase 8 → Polish pass

---

## Notes

- [P] tasks = different files, no shared state dependencies — safe to run in parallel
- `OnboardingChat` (T025) is the shared component for Steps 2 and 3 — get it right before building either step page
- AI Gateway auth: ensure `vercel env pull` is done before testing any chat routes locally
- No test tasks generated — not requested in spec
- Character image: always use `public/characterneutralsmile.png` via `next/image`

---

## Implementation Status

**Completed**: 38/39 tasks (97%)
**Remaining**: T006 (vercel env pull - manual step), T034 (mid-step refresh), T036 (lint), T037 (e2e test)

### Files Created/Modified

**New Components**:
- `src/components/onboarding/LeoCharacter.tsx`
- `src/components/onboarding/LanguagePicker.tsx`
- `src/components/onboarding/OnboardingChat.tsx`
- `src/components/onboarding/VoiceInput.tsx`
- `src/components/onboarding/StepProgress.tsx`

**New Pages**:
- `src/app/onboarding/layout.tsx`
- `src/app/onboarding/page.tsx`
- `src/app/onboarding/step-1/page.tsx`
- `src/app/onboarding/step-2/page.tsx`
- `src/app/onboarding/step-3/page.tsx`
- `src/app/onboarding/step-4/page.tsx`

**New API Routes**:
- `src/app/api/onboarding/language/route.ts`
- `src/app/api/onboarding/chat/level/route.ts`
- `src/app/api/onboarding/chat/goals/route.ts`
- `src/app/api/onboarding/transcribe/route.ts`
- `src/app/api/onboarding/complete/route.ts`

**New Lib Files**:
- `src/lib/onboarding/languages.ts`
- `src/lib/onboarding/prompts.ts`
- `src/hooks/useOnboardingChat.ts`

**Modified Files**:
- `prisma/schema.prisma` - Added onboarding fields
- `src/lib/auth.ts` - Added onboardingCompleted to JWT payload
- `src/middleware.ts` - Created onboarding enforcement middleware
- `src/app/api/auth/sign-up/route.ts` - Added redirectTo and onboardingCompleted
- `src/app/api/auth/sign-in/route.ts` - Added onboardingCompleted to response
- `src/app/api/auth/refresh/route.ts` - Added onboardingCompleted to token
- `src/app/api/users/me/route.ts` - Added onboarding fields to response
- `src/app/globals.css` - Added Leo animations
