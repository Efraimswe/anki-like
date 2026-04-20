---
description: "Task list for feature 010: Manual Onboarding (no LLM)"
---

# Tasks: Manual Onboarding (no LLM)

**Input**: Design documents from `/specs/010-manual-onboarding-llm/`
**Prerequisites**: plan.md ✅, spec.md ✅ (research.md, data-model.md, contracts/ not yet generated — tasks derive directly from plan + spec)

**Tests**: Tests not explicitly requested by the user. Optional contract-test tasks are included but marked OPTIONAL per the Constitution's Test-First spirit for API boundaries; skip if fast-iterating.

**Organization**: Tasks are grouped by user story (US1-US5) from [spec.md](spec.md). Stories US2 and US3 are the two independently deliverable work-units; US1 is the flow-integration umbrella that validates once US2+US3 land; US4 is visual-parity verification; US5 is dead-code removal.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1-US5)
- All paths are relative to repo root `/home/skaylet/dev/anki-like/`

## Path Conventions

Single Next.js 15 App Router project. All app code lives under `src/`. Spec artifacts under `specs/010-manual-onboarding-llm/`. No monorepo split.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm branch + toolchain. No new dependencies required (zod ^3.25, TanStack Query v5, Next 15, React 19 already installed).

- [X] T001 Confirm active branch is `010-manual-onboarding-llm` via `git status`; if not, checkout from `master` with `git checkout -b 010-manual-onboarding-llm`
- [X] T002 [P] Verify `zod` is importable from `src/lib/onboarding/*` by checking [package.json](package.json) pins `zod ^3.25.67` (no install needed)
- [X] T003 [P] Read [prisma/schema.prisma](prisma/schema.prisma) and confirm `User` model already has `nativeLanguage String?`, `englishLevel String?`, `goals Json?`, `onboardingCompleted Boolean @default(false)` — no migration needed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the shared validation primitives consumed by both US2 (level) and US3 (goals). These MUST exist before any UI or API route can import them.

**⚠️ CRITICAL**: US2 and US3 both block on this phase.

- [X] T004 [P] Create canonical CEFR level list at [src/lib/onboarding/levels.ts](src/lib/onboarding/levels.ts) — export `LEVELS` as a readonly tuple of the 13 strings `['A1', 'A1 solid', 'A2', 'A2 solid', 'B1', 'B1 solid', 'B2', 'B2 solid', 'C1', 'C1 solid', 'C2', 'C2 solid', 'Fluent']`, a `Level` type alias `(typeof LEVELS)[number]`, and an `isLevel(value: unknown): value is Level` type-guard used by the server for validation
- [X] T005 [P] Create Zod schema for goals payload at [src/lib/onboarding/goals.ts](src/lib/onboarding/goals.ts) — export `GoalsSchema` with shape `{ primary: z.string().trim().min(1).max(120), secondary: z.string().trim().max(500).optional(), context: z.string().trim().max(500).optional(), urgency: z.enum(['casual', 'moderate', 'urgent']).optional() }`, export the inferred `GoalsPayload` type, and apply `.strict()` to reject unknown fields. Optional fields must be omitted (not stored as empty strings) — preprocess to drop empties before validation.

**Checkpoint**: Foundation ready — US2 and US3 can proceed in parallel.

---

## Phase 3: User Story 1 - Signup to Dashboard Without Any LLM Call (Priority: P1) 🎯 MVP

**Goal**: A new signup completes all four onboarding steps with zero LLM-provider requests and reaches `/dashboard` with `nativeLanguage`, `englishLevel`, and `goals` populated.

**Independent Test**: With `LLM_API_KEY` unset, sign up a fresh user, walk through all four steps, and assert: (a) no request fires to any `/api/onboarding/chat/*` endpoint (none exist post-cleanup), (b) the user lands on `/dashboard`, (c) the DB row has all three fields populated.

**Dependency note**: This story's acceptance depends on US2 and US3 being complete. Its implementation tasks here cover only the flow-control glue that sits *around* steps 2 and 3.

### Implementation for User Story 1

- [X] T006 [US1] Update the onboarding root redirect at [src/app/onboarding/page.tsx](src/app/onboarding/page.tsx) — read the user record via `/api/users/me` (or the existing server-side helper) and redirect to the earliest step whose backing field is null: `nativeLanguage` null → step-1, `englishLevel` null → step-2, `goals` null → step-3, otherwise → step-4. No new DB column; compute purely from existing fields.
- [X] T007 [US1] Rewrite step-4 page at [src/app/onboarding/step-4/page.tsx](src/app/onboarding/step-4/page.tsx) so the summary card echoes `user.nativeLanguage`, `user.englishLevel`, and `user.goals.primary` (manual selections, no LLM-generated copy). Keep the existing confetti/CTA/layout. CTA still POSTs to `/api/onboarding/complete` to flip `onboardingCompleted = true` and redirects to `/dashboard`.
- [X] T008 [US1] Verify [src/middleware.ts](src/middleware.ts) still gates protected routes on `onboardingCompleted=true` and redirects incomplete users to `/onboarding` — no code change expected, but read and confirm. Add a code comment ONLY if the gate logic is non-obvious (otherwise leave untouched per the no-unnecessary-comments rule).
- [X] T009 [US1] Verify [src/app/api/onboarding/complete/route.ts](src/app/api/onboarding/complete/route.ts) atomically sets `onboardingCompleted = true` and refreshes the JWT with the new flag so middleware sees it on the next request — no code change expected.

**Checkpoint**: Once US2 and US3 also land, the whole zero-LLM flow is provable end-to-end.

---

## Phase 4: User Story 2 - Manual Level Self-Selection with 13-Point Scale (Priority: P1)

**Goal**: Step 2 renders 13 CEFR chips, single-select, guidance line, Continue disabled until selection, persists exact chip string to `users.englishLevel`, pre-highlights prior selection on return.

**Independent Test**: With `nativeLanguage` already set, navigate to `/onboarding/step-2`. Verify 13 chips render, only one selects at a time, Continue disabled initially, stored value equals the chip label, and revisiting the step pre-highlights the prior pick.

### Tests for User Story 2 (OPTIONAL — only if tests requested) ⚠️

- [X] T010 [P] [US2] (optional) Contract test for POST `/api/onboarding/level` at `tests/contract/test_onboarding_level.ts` — assert 200 on each of the 13 valid level strings, assert 400 on a non-whitelisted string like `"Pro"`, assert 401 when unauthenticated

### Implementation for User Story 2

- [X] T011 [P] [US2] Create [src/app/api/onboarding/level/route.ts](src/app/api/onboarding/level/route.ts) — POST handler that: requires authenticated user via JWT (mirror pattern in [src/app/api/onboarding/complete/route.ts](src/app/api/onboarding/complete/route.ts)), parses `{ level: string }` from JSON body, validates against `isLevel` from [src/lib/onboarding/levels.ts](src/lib/onboarding/levels.ts) (400 on miss), updates `prisma.user.update({ where: { id }, data: { englishLevel: level } })`, returns `{ ok: true, englishLevel: level }`
- [X] T012 [P] [US2] Create [src/components/onboarding/LevelPicker.tsx](src/components/onboarding/LevelPicker.tsx) — client component that takes `{ value: Level | null, onChange: (l: Level) => void }`, renders the 13 chips from `LEVELS` in a responsive grid (4×3 + 1 on desktop, 2-column on mobile), uses existing `onb-chip` styling conventions (check [src/app/globals.css](src/app/globals.css) for matching chip classes — reuse language-picker chip styles if available, otherwise inline styles matching existing tokens `--color-accent`, `--color-border`)
- [X] T013 [US2] Rewrite [src/app/onboarding/step-2/page.tsx](src/app/onboarding/step-2/page.tsx) — delete OnboardingChat usage, render `<LevelPicker value={level} onChange={setLevel}>`, show the "Not sure? Pick lower — you can always update later" guidance line directly below the picker, render a Continue button disabled until `level !== null`. On click: POST to `/api/onboarding/level` with `{ level }`, invalidate the `['user']` query cache, `router.push('/onboarding/step-3')`. Preserve the `onb-panel` / `onb-panel-leo` / `onb-panel-content` structure, `<LeoCharacter animate="float" size="md" showNametag />` on the left, the same header typography as step-1. Pre-fill `level` state from `user.englishLevel` if present (satisfies FR-011 pre-populate on revisit).

**Checkpoint**: Step-2 is fully functional in isolation — navigating back from step-3 shows the prior pick pre-highlighted.

---

## Phase 5: User Story 3 - Manual Goal Form With Required Primary Field (Priority: P1)

**Goal**: Step 3 renders a form with a required primary goal field (≤120 chars) plus optional secondary/context/urgency fields, validates client- and server-side, persists to `users.goals` as a clean JSON object (omitting empty optionals), and advances to step-4.

**Independent Test**: With `nativeLanguage` and `englishLevel` set, navigate to `/onboarding/step-3`. Submit empty → blocked. Submit primary only → DB stores `{primary}` and advances. Submit all four filled → DB stores full `{primary, secondary, context, urgency}`. Urgency field is constrained to the three enum values (radio or segmented control, not free text).

### Tests for User Story 3 (OPTIONAL — only if tests requested) ⚠️

- [X] T014 [P] [US3] (optional) Contract test for POST `/api/onboarding/goals` at `tests/contract/test_onboarding_goals.ts` — assert 200 with primary-only payload, 200 with full payload, 400 on missing primary, 400 on primary >120 chars, 400 on urgency outside enum, 400 on unknown fields (Zod `.strict`)

### Implementation for User Story 3

- [X] T015 [P] [US3] Create [src/app/api/onboarding/goals/route.ts](src/app/api/onboarding/goals/route.ts) — POST handler that: requires authenticated user, parses body with `GoalsSchema.safeParse` from [src/lib/onboarding/goals.ts](src/lib/onboarding/goals.ts) (400 with formatted zod issues on failure), updates `prisma.user.update({ where: { id }, data: { goals: parsed } })`, returns `{ ok: true, goals: parsed }`
- [X] T016 [P] [US3] Create [src/components/onboarding/GoalsForm.tsx](src/components/onboarding/GoalsForm.tsx) — client component that takes `{ initialValue: GoalsPayload | null, onSubmit: (g: GoalsPayload) => void | Promise<void> }` and renders: required `primary` textarea with visible char counter and 120-char hard cap, optional `secondary` textarea, optional `context` textarea, optional `urgency` as a three-option segmented control (`casual | moderate | urgent`) with a "skip" affordance. Show inline validation hint under `primary` when the user clicks Continue with it empty. Omit empty optionals from the submitted payload (FR-006 — optional fields must be omitted, not null).
- [X] T017 [US3] Rewrite [src/app/onboarding/step-3/page.tsx](src/app/onboarding/step-3/page.tsx) — delete OnboardingChat usage and the redundant left-side Leo speech bubble (already gone per feature 009 cleanup, confirm it's still clean). Render `<GoalsForm initialValue={user.goals ?? null} onSubmit={handleSubmit} />` where `handleSubmit` POSTs to `/api/onboarding/goals`, invalidates `['user']`, then `router.push('/onboarding/step-4')`. Keep the `onb-panel` structure, Leo on the left (with the optional goal-preview chip above Leo when `user.goals?.primary` exists), existing header ("Why English?" or equivalent). Pre-fill from `user.goals` on revisit (FR-011).

**Checkpoint**: Step-3 is fully functional in isolation — a user can fill primary only, submit, and reach step-4.

---

## Phase 6: User Story 4 - Existing Visual Style Preserved (Priority: P2)

**Goal**: Desktop, tablet, and mobile breakpoints for all four steps render identically to the pre-migration design: Leo on the left (hidden <640px), progress bar, background gradient, typography, step-4 welcome card with manual-selection summary.

**Independent Test**: Visit each of the four steps on desktop (≥1024px), tablet (768-1023px), and mobile (≤640px) viewports. Compare Leo placement, background, progress bar, typography, and step-4 card against the prior screenshots. No layout regressions.

### Implementation for User Story 4

- [X] T018 [US4] Manual visual QA against current design: open each of [src/app/onboarding/step-1/page.tsx](src/app/onboarding/step-1/page.tsx), [src/app/onboarding/step-2/page.tsx](src/app/onboarding/step-2/page.tsx), [src/app/onboarding/step-3/page.tsx](src/app/onboarding/step-3/page.tsx), [src/app/onboarding/step-4/page.tsx](src/app/onboarding/step-4/page.tsx) in the browser at 375px / 768px / 1280px. Confirm `onb-panel` / `onb-panel-leo` / `onb-panel-content` classes are applied on steps 2-4 and that Leo hides at <640px (existing breakpoint). No code changes expected — if a regression surfaces, fix in the offending page file (not in `globals.css` unless unavoidable).
- [X] T019 [US4] Verify `<LeoCharacter animate="float" size="md" showNametag />` is present on steps 1-4 with the same props as pre-migration (CSS float animation, no GSAP). Grep for `GSAP` / `gsap` under [src/app/onboarding/](src/app/onboarding/) and confirm zero matches.
- [X] T020 [US4] Confirm step-4 summary card renders all three manual selections (`nativeLanguage`, `englishLevel`, `goals.primary`) and the existing CTA styling. Take screenshots of all four steps post-migration and attach to the PR description.

**Checkpoint**: Visual parity confirmed; no CSS churn required.

---

## Phase 7: User Story 5 - Dead-Code Cleanup (Priority: P3)

**Goal**: Chat components, chat API routes, LLM system prompts, LLM client lib, voice input, and related translations are fully removed. TypeScript compiles clean.

**Independent Test**: Post-migration, `grep -r 'useLLMChat\|OnboardingChat\|onboarding/chat\|@/lib/llm' src/` returns zero matches. `npx tsc --noEmit` exits 0. `pnpm lint` exits 0.

### Implementation for User Story 5

- [X] T021 [P] [US5] Delete [src/components/onboarding/OnboardingChat.tsx](src/components/onboarding/OnboardingChat.tsx)
- [X] T022 [P] [US5] Delete [src/components/onboarding/VoiceInput.tsx](src/components/onboarding/VoiceInput.tsx)
- [X] T023 [P] [US5] Delete [src/hooks/useLLMChat.ts](src/hooks/useLLMChat.ts)
- [X] T024 [P] [US5] Delete [src/hooks/useOnboardingChat.ts](src/hooks/useOnboardingChat.ts) (if it exists per plan — check first; `ls` showed it in the 009 working tree)
- [X] T025 [P] [US5] Delete [src/lib/llm.ts](src/lib/llm.ts)
- [X] T026 [P] [US5] Delete [src/lib/onboarding/prompts.ts](src/lib/onboarding/prompts.ts)
- [X] T027 [P] [US5] Delete [src/lib/onboarding/copy.ts](src/lib/onboarding/copy.ts)
- [X] T028 [P] [US5] Delete the entire [src/app/api/onboarding/chat/](src/app/api/onboarding/chat/) directory (both `level/` and `goals/` subdirs)
- [X] T029 [P] [US5] Delete [src/app/api/onboarding/transcribe/](src/app/api/onboarding/transcribe/) if it exists and is only used by VoiceInput (verify by greping for `/api/onboarding/transcribe` first; if any non-onboarding caller uses it, leave it and note in the PR)
- [X] T030 [US5] Run `grep -r 'useLLMChat\|OnboardingChat\|useOnboardingChat\|onboarding/chat\|@/lib/llm\|VoiceInput\|getCopy\|prompts' src/` and verify zero matches in app code. Any lingering imports → remove the import line in the offending file.
- [X] T031 [US5] Run `npx tsc --noEmit` from repo root — MUST exit 0 with zero errors and zero unused-import warnings.

**Checkpoint**: Codebase is clean; no dead weight from the LLM chat era.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, lint, type, and end-to-end smoke before merging.

- [X] T032 [P] Run `pnpm lint` from repo root — MUST exit 0.
- [X] T033 [P] Run `npx tsc --noEmit` from repo root — MUST exit 0 (re-check after polish edits).
- [X] T034 End-to-end smoke with `pnpm dev`: hit the dev-reset endpoint at `POST /api/dev/reset-onboarding`, then walk through steps 1→4 in Chrome DevTools with the Network tab filtered for any URL containing `chat` or `openrouter` or `openai` — confirm zero such requests fire. Then inspect the DB row (via Prisma Studio or a quick query) and confirm `nativeLanguage`, `englishLevel`, `goals`, and `onboardingCompleted=true` are populated correctly.
- [X] T035 Verify [src/app/api/dev/reset-onboarding/route.ts](src/app/api/dev/reset-onboarding/route.ts) still resets `nativeLanguage`, `englishLevel`, `goals` (back to null) and `onboardingCompleted` (back to false) — per FR-013. No code change expected; read and confirm.
- [X] T036 Update [CLAUDE.md](CLAUDE.md) "Recent Changes" to note `010-manual-onboarding-llm: manual-only onboarding, no LLM calls, CEFR chip picker + goals form`. (Run `.specify/scripts/bash/update-agent-context.sh claude` if that script is available; otherwise edit manually.)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup (T001-T003)**: No dependencies — start immediately
- **Phase 2 Foundational (T004-T005)**: Depends on Phase 1 — blocks US2 and US3
- **Phase 3 US1 (T006-T009)**: Depends on Phase 2. T006 and T007 read user fields that are written by US2 and US3, so US1's *validation* comes after US2+US3 land even though the code itself can be written in parallel.
- **Phase 4 US2 (T010-T013)**: Depends on Phase 2 (T004). Independently deliverable.
- **Phase 5 US3 (T014-T017)**: Depends on Phase 2 (T005). Independently deliverable.
- **Phase 6 US4 (T018-T020)**: Depends on US2 + US3 being rendered (T013, T017)
- **Phase 7 US5 (T021-T031)**: Depends on US2 and US3 being complete (can't delete `OnboardingChat.tsx` until no page imports it). T021-T029 can run in parallel; T030 and T031 are sequential validation gates.
- **Phase 8 Polish (T032-T036)**: Depends on all prior phases

### User Story Dependencies

- **US2 (P1)** and **US3 (P1)** are truly independent of each other — different files, different endpoints, different page routes. They can be worked by two developers in parallel.
- **US1 (P1)** is an *integration* story — its implementation tasks (T006-T009) touch the root onboarding page and step-4 summary, which depend on US2 and US3's DB fields being populated. Sequence: US2+US3 in parallel → US1 integration → US4 visual QA → US5 cleanup.
- **US4 (P2)** is verification-only. Runs after US2+US3 renders exist.
- **US5 (P3)** is deletion. Runs after US2+US3 have removed the old imports.

### Parallel Opportunities

- T002, T003 in parallel (different files)
- T004, T005 in parallel (different files)
- T011, T012 in parallel within US2 (different files: API route and component)
- T015, T016 in parallel within US3 (different files: API route and component)
- T010, T011, T012 in parallel within US2 if tests are requested
- T014, T015, T016 in parallel within US3 if tests are requested
- All of T021-T029 in parallel within US5 (each is a distinct file deletion)
- T032, T033 in parallel in Polish

---

## Parallel Example: User Story 2 (two developers)

```bash
# After Phase 2 lands:
Task: "Create src/app/api/onboarding/level/route.ts with Zod-free isLevel validation"   # T011
Task: "Create src/components/onboarding/LevelPicker.tsx 13-chip selector"               # T012
# Then sequentially:
Task: "Rewrite src/app/onboarding/step-2/page.tsx to render LevelPicker + POST handler" # T013
```

## Parallel Example: User Story 5 cleanup

```bash
# All deletions are independent — run in one sweep:
Task: "Delete src/components/onboarding/OnboardingChat.tsx"   # T021
Task: "Delete src/components/onboarding/VoiceInput.tsx"       # T022
Task: "Delete src/hooks/useLLMChat.ts"                         # T023
Task: "Delete src/hooks/useOnboardingChat.ts"                  # T024
Task: "Delete src/lib/llm.ts"                                  # T025
Task: "Delete src/lib/onboarding/prompts.ts"                   # T026
Task: "Delete src/lib/onboarding/copy.ts"                      # T027
Task: "Delete src/app/api/onboarding/chat/ (recursive)"        # T028
```

---

## Implementation Strategy

### MVP First (US2 + US3 + US1 integration)

1. Phase 1 Setup (T001-T003)
2. Phase 2 Foundational (T004-T005) — create levels.ts + goals.ts schemas
3. Phase 4 US2 (T011-T013) and Phase 5 US3 (T015-T017) **in parallel** (two developers) or sequentially (one developer, US2 first)
4. Phase 3 US1 (T006-T009) — wire the root redirect and step-4 summary
5. **STOP and VALIDATE**: reset onboarding, walk steps 1→4, confirm zero LLM requests, confirm DB row, confirm dashboard redirect.
6. This is the shippable MVP — US4 and US5 are polish that can merge in the same PR or follow.

### Incremental Delivery

1. Merge US2 alone → step-2 chat is replaced with the chip picker; step-3 still uses the old chat — half-migrated but functional.
2. Merge US3 → step-3 form replaces goal chat; whole flow is manual.
3. Merge US1 integration → resume-from-earliest-incomplete and step-4 summary echo manual selections.
4. Merge US4 → visual regression check passes.
5. Merge US5 → dead code removed.

### Parallel Team Strategy

Two developers:

1. Both run Setup + Foundational together (30-60 min)
2. Developer A: US2 (T011-T013) — level picker
3. Developer B: US3 (T015-T017) — goals form
4. When both land: Developer A picks up US1 integration (T006-T009); Developer B starts US5 cleanup (T021-T031)
5. Final polish together.

---

## Notes

- **[P] means different files.** Even within a single user story, [P] tasks touch distinct files and have no read-dependency on each other's output.
- **Zero LLM guarantee** is implicit — no task adds an LLM import. Phase 7 cleanup explicitly removes every LLM call site from `src/`.
- **No DB migration.** All four fields (`nativeLanguage`, `englishLevel`, `goals`, `onboardingCompleted`) already exist from feature 008.
- **Commit cadence**: commit after each task or logical group (e.g. "US2 complete" at the end of T013).
- **Validation gates**: T030, T031, T033 are blocking — do not mark US5 or Polish done while any fails.
- **Do NOT touch `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` in `.env.example`** — they remain for future non-onboarding features (spec Assumption).

---

## Task Count Summary

| Phase | Count | Parallelizable |
|---|---|---|
| 1 Setup | 3 | 2 |
| 2 Foundational | 2 | 2 |
| 3 US1 integration | 4 | 0 |
| 4 US2 level picker | 3 (+1 optional test) | 2 (+1 test) |
| 5 US3 goals form | 3 (+1 optional test) | 2 (+1 test) |
| 6 US4 visual QA | 3 | 0 |
| 7 US5 cleanup | 11 | 9 |
| 8 Polish | 5 | 2 |
| **Total** | **34** (36 with optional tests) | **19** (+2 with tests) |

**Suggested MVP scope**: Phases 1-5 only (T001-T017). Ship US2+US3+US1. US4 and US5 can follow in the same PR or a fast-follow.
