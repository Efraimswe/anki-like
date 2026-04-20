# Feature Specification: Manual Onboarding (no LLM)

**Feature Branch**: `010-manual-onboarding-llm`
**Created**: 2026-04-19
**Status**: Draft
**Input**: Replace the LLM-driven onboarding flow (chat-based level assessment + chat-based goal extraction) with a fully manual flow: visual language picker, manual English-level selection from a 13-item scale, and a manual goal form. Onboarding makes zero LLM calls. The visual style of the existing four-step flow (Leo PNG, float animation, panel layout) is preserved — only the interaction inside steps 2 and 3 changes. Step 4 welcome screen remains. `onboardingCompleted` gate still flips at the end of step 4.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Signup to Dashboard Without Any LLM Call (Priority: P1)

A newly signed-up user reaches the onboarding flow and completes all four steps (language → level → goals → welcome) without a single backend request to the LLM provider. They land on the dashboard with `nativeLanguage`, `englishLevel`, and `goals` populated from their own manual selections.

**Why this priority**: This is the entire point of the revision — onboarding hits 100% of signups, and the current chat-based design makes ~12 LLM requests per signup. At even modest signup volume, that blows through OpenRouter free-tier limits and turns expensive on paid models. Removing LLM from the first-contact path eliminates rate-limit flakes and per-user cost.

**Independent Test**: Sign up a new account with `LLM_API_KEY` unset (or deliberately broken). Complete all four onboarding steps. Verify the user reaches the dashboard, the DB row has all three fields populated, and no request was made to any `/api/onboarding/chat/*` endpoint.

**Acceptance Scenarios**:

1. **Given** a fresh signup, **When** the user completes steps 1-4, **Then** zero outbound requests are made to any LLM provider and the user is redirected to `/dashboard`
2. **Given** `LLM_API_KEY` is unset at signup time, **When** the user completes onboarding, **Then** all four steps function normally and no errors are shown
3. **Given** the user finishes step 4, **When** the DB is inspected, **Then** `onboardingCompleted=true`, `nativeLanguage` matches their step-1 pick, `englishLevel` matches their step-2 pick, and `goals.primary` matches their step-3 text

---

### User Story 2 - Manual Level Self-Selection with 13-Point Scale (Priority: P1)

On step 2, the user sees the 13-item scale (`A1 | A1 solid | A2 | A2 solid | B1 | B1 solid | B2 | B2 solid | C1 | C1 solid | C2 | C2 solid | Fluent`) laid out as selectable chips. They pick one, read a short "not sure? pick lower — you can always update later" line, and continue.

**Why this priority**: Level drives content difficulty across the entire app. The manual anchor replaces the chat-based LLM assessment. Must be correct from day one — a user stuck on "can't pick a level" is a user who can't finish signup.

**Independent Test**: Navigate to step 2 directly (after completing step 1). Verify all 13 chips render, only one can be selected at a time, Continue is disabled until a selection exists, and the stored value matches the chip label.

**Acceptance Scenarios**:

1. **Given** a user on step 2 with no prior level selected, **When** the page renders, **Then** all 13 chips are visible and "Continue" is disabled
2. **Given** a user on step 2, **When** they tap a chip, **Then** only that chip is marked selected and "Continue" becomes enabled
3. **Given** a user on step 2 who previously selected a level, **When** they return to step 2 (e.g. via back-navigation), **Then** their prior selection is pre-highlighted
4. **Given** a user who picks `B1 solid`, **When** step 2 submits, **Then** the DB `englishLevel` field stores the exact string `B1 solid`

---

### User Story 3 - Manual Goal Form With Required Primary Field (Priority: P1)

On step 3, the user fills out a simple form: one required short-text field for the primary goal, plus optional fields for secondary goals, free-text context, and urgency. Submitting saves the form as a JSON blob on the user's `goals` field and advances to step 4.

**Why this priority**: Goals drive tutor personalization. The chat-based extractor is being removed; the replacement must capture at least the same primary-goal field (`goals.primary`) without a chat transcript.

**Independent Test**: Navigate to step 3. Try submitting with an empty primary field — verify the submit is blocked. Fill in primary, leave the rest blank, submit — verify DB stores `{primary: "..."}` and advance occurs. Fill all optional fields, submit again, verify full JSON persists.

**Acceptance Scenarios**:

1. **Given** a user on step 3 with an empty primary field, **When** they click Continue, **Then** the submit is blocked with a visible validation hint
2. **Given** a user on step 3 with only primary filled, **When** they submit, **Then** `goals` is saved as `{primary: "<text>"}` and the user advances to step 4
3. **Given** a user on step 3 with primary + secondary + context + urgency filled, **When** they submit, **Then** `goals` is saved as `{primary, secondary?, context?, urgency?}` with exactly the provided fields
4. **Given** a user who picks the urgency field, **When** the form renders, **Then** urgency is a constrained enum (not free text) — e.g. casual / moderate / urgent

---

### User Story 4 - Existing Visual Style Preserved (Priority: P2)

The four-step layout keeps its current look: Leo PNG on the left panel (float animation, hidden on mobile), two-column responsive grid, top progress bar, existing CSS classes (`onb-panel`, `onb-panel-leo`, `onb-panel-content`), step-4 welcome screen with confetti/summary card. Only the content of step 2's right column and step 3's right column changes. No GSAP.

**Why this priority**: The user explicitly requested the UI style stay the same. Reusing the existing layout classes minimizes churn and preserves the careful responsive work already in place.

**Independent Test**: Visit each of the four steps. Visually compare Leo's placement, background gradient, progress bar, typography, and step-4 confetti/summary against the current production screenshots. Verify mobile and tablet breakpoints still behave correctly.

**Acceptance Scenarios**:

1. **Given** the onboarding root layout, **When** the user opens any step on desktop, **Then** the left panel shows Leo and the right panel shows step-specific content with the same header/progress/bg as today
2. **Given** a mobile viewport (≤640px), **When** the user views any step, **Then** Leo is hidden and the content column expands to fill
3. **Given** step 4, **When** the user reaches it, **Then** the existing welcome/summary/CTA card renders with the user's manual selections (no LLM-generated copy)

---

### User Story 5 - Dead-Code Cleanup (Priority: P3)

After the migration, the chat components, chat API routes, LLM system prompts, LLM client library, and voice-input component are removed from the codebase. None of this code should survive as dead weight "just in case" — it's deleted.

**Why this priority**: Keeps the codebase clean and prevents regression (someone accidentally re-importing the chat UI). Not strictly blocking the user flow, so P3.

**Independent Test**: After migration, grep the codebase for `useLLMChat`, `OnboardingChat`, `api/onboarding/chat`, `@/lib/llm`, `LLM_API_KEY` (the last may remain in `.env.example` for other future features). Verify no app-code imports.

**Acceptance Scenarios**:

1. **Given** the migrated codebase, **When** files are inspected, **Then** `src/components/onboarding/OnboardingChat.tsx`, `src/components/onboarding/VoiceInput.tsx`, `src/hooks/useLLMChat.ts`, `src/hooks/useOnboardingChat.ts`, `src/lib/llm.ts`, `src/lib/onboarding/prompts.ts`, `src/lib/onboarding/copy.ts`, `src/app/api/onboarding/chat/level/`, `src/app/api/onboarding/chat/goals/` no longer exist
2. **Given** the migrated codebase, **When** TypeScript compiles, **Then** zero errors and zero unused-import warnings from the removed modules
3. **Given** the migrated codebase, **When** `package.json` is inspected, **Then** no LLM client library remains unless used elsewhere (e.g. `jose`, `bcrypt` remain untouched)

---

### Edge Cases

- **Revisiting a completed step**: `onboardingCompleted=false` users can navigate back from step 3 to step 2. The prior selection must pre-populate.
- **Partial progress on crash**: If a user completes step 1 and closes the browser, reopening the app lands them back at step 1 (or the earliest incomplete step) because `nativeLanguage` is already saved but later fields are null.
- **Back button from step 4**: Once step 4 sets `onboardingCompleted=true`, back-navigation to any step must redirect them to the dashboard (middleware already handles this).
- **Goals field overflow**: primary goal max length is enforced (e.g. 120 chars) to prevent giant JSON blobs.
- **Level scale i18n**: The 13-item scale uses CEFR codes (`A1`, `B1 solid`, etc.) which are universally recognized. Descriptions/tooltips beside each chip CAN be localized but the chip value stored is the CEFR code.
- **Direct-URL access**: A user who types `/onboarding/step-3` before completing step 1 must be redirected back to the first incomplete step.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST NOT make any LLM or AI-provider request during any part of the onboarding flow (steps 1-4)
- **FR-002**: Step 1 MUST offer a language picker with at least the 70 languages currently in `src/lib/onboarding/languages.ts`, persist the selection to `users.nativeLanguage`, and invalidate the user query cache before advancing
- **FR-003**: Step 2 MUST render the 13-item CEFR scale `[A1, A1 solid, A2, A2 solid, B1, B1 solid, B2, B2 solid, C1, C1 solid, C2, C2 solid, Fluent]` as selectable chips, allow exactly one selection, and persist to `users.englishLevel` as the exact chip string
- **FR-004**: Step 2 MUST display a short guidance line (e.g. "Not sure? Pick lower — you can always update later") near the scale
- **FR-005**: Step 3 MUST render a form with one required field (primary goal, max 120 chars) and three optional fields (secondary goals — free text, context — free text, urgency — enum of `casual | moderate | urgent`)
- **FR-006**: Step 3 MUST persist the submitted form as a JSON object to `users.goals` with shape `{primary: string, secondary?: string, context?: string, urgency?: 'casual'|'moderate'|'urgent'}` — optional fields are omitted (not null) when empty
- **FR-007**: Step 4 MUST display a welcome/summary card that echoes back the user's three manual selections and flips `users.onboardingCompleted` to `true` on CTA click
- **FR-008**: Middleware MUST continue to gate protected routes on `onboardingCompleted=true` (no change to existing middleware logic)
- **FR-009**: The existing onboarding layout, character asset, animations, progress bar, background, and responsive breakpoints MUST be preserved — only the content inside step 2 and step 3 panels changes
- **FR-010**: All chat-based onboarding components, hooks, API routes, system prompts, and their translations MUST be removed from the codebase after migration
- **FR-011**: Revisiting a previously-completed step (via browser back or direct URL) MUST pre-populate the prior selection
- **FR-012**: Users MUST be able to edit their level and goals later from a future settings screen (not in this feature; contract: the DB shape must support partial updates via standard profile PATCH — no additional migration)
- **FR-013**: The dev-mode `/api/dev/reset-onboarding` endpoint MUST continue to reset all three fields (`nativeLanguage`, `englishLevel`, `goals`) and `onboardingCompleted` to their initial state

### Key Entities

- **OnboardingProgress** (conceptual, no new DB table): derived state from `User`. The earliest incomplete field determines which step the user resumes on. Completion order is fixed: language → level → goals → flag-flip
- **LevelChoice**: one of the 13 CEFR scale values above. Stored as a plain string on `users.englishLevel`. Validated server-side against the fixed enum
- **GoalsPayload**: JSON object `{primary: string (required, ≤120 chars), secondary?: string (≤500 chars), context?: string (≤500 chars), urgency?: 'casual'|'moderate'|'urgent'}`. Stored on `users.goals`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero LLM requests are made during any onboarding session — verified by inspecting network traces or server logs across 10 test signups
- **SC-002**: Median time from step-1 landing to step-4 CTA is under 90 seconds for a user who knows their level (down from ~180s on the LLM chat flow, which required 8+ back-and-forth messages)
- **SC-003**: 100% of new signups reach the dashboard without encountering an LLM-provider error (rate limit, 503, timeout) because no such calls are made
- **SC-004**: `users.englishLevel` contains exactly one of the 13 whitelisted scale values after step 2 — zero cases of legacy values or chat-derived free text
- **SC-005**: `users.goals` is a well-formed JSON object with a required `primary` field of ≤120 chars after step 3 — zero cases of malformed payloads
- **SC-006**: Post-migration, `grep -r 'useLLMChat\|OnboardingChat\|onboarding/chat'` over `src/` returns zero matches in app code

## Assumptions

- The existing DB columns `nativeLanguage: string?`, `englishLevel: string?`, `goals: Json?`, `onboardingCompleted: bool` are already present (from feature 008) and need no schema migration
- `users.englishLevel` is already nullable string; the new 13-value whitelist replaces any enum-like validation at the API boundary, not at the DB level
- The existing `/api/onboarding/language` endpoint can be reused as-is for step 1
- `/api/onboarding/level` and `/api/onboarding/goals` endpoints already exist (from feature 008) — if they currently expect chat transcripts, they will be simplified to accept the manual payload
- The language picker and its ~70 languages need no changes
- Voice-input and speech-to-text were only used inside the chat UI; removing the chat removes the need for voice — so `VoiceInput` is deleted with the rest of the chat stack
- All LLM-related translations (`copy.ts`, `GREETINGS` maps) are deleted along with the chat components
- No new environment variables are required; `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` remain untouched in config since they are not used by onboarding anymore (they may still be used by future non-onboarding features and should remain in `.env.example`)
