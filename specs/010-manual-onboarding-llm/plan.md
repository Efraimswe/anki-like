# Implementation Plan: Verify Onboarding is localStorage-First (Steps 1-3) with Single HTTP Commit (Step 4)

**Branch**: `010-manual-onboarding-llm` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)
**Input**: User inspection request — confirm the 4-step flow stores 1/2/3 to localStorage only, reads from localStorage (not DB), and makes exactly one HTTP call at step 4 that persists all three fields.

## Summary

The current onboarding implementation **already matches the stated intent**. No code changes are required. This plan documents the inspection, pinpoints the exact code that proves each invariant, and flags two minor observations that are out of scope for this request.

## Stated Intent (verbatim from user)

1. **Step 1** — stores native language in localStorage temporarily.
2. **Step 2** — does what it does (level picker), but reads native language from **localStorage, not the database**.
3. **Step 3** — same pattern as step 2: reads native language from localStorage.
4. **Step 4** — takes everything from localStorage and makes a **single real HTTP call** that writes all three fields (`nativeLanguage`, `englishLevel`, `goals`) to the database. **Only step 4** makes an HTTP call.

## Inspection Findings (file-by-file)

### ✅ Step 1 — localStorage write, no HTTP

[src/app/onboarding/step-1/page.tsx](../../src/app/onboarding/step-1/page.tsx)
- Line 14: pre-fills from `readDraft().nativeLanguage`
- Line 20: writes via `writeDraft({ nativeLanguage })` — **no fetch()**
- Line 21: `router.push('/onboarding/step-2')`

### ✅ Step 2 — localStorage read/write, no DB, no HTTP

[src/app/onboarding/step-2/page.tsx](../../src/app/onboarding/step-2/page.tsx)
- Line 17-19: reads `readDraft().englishLevel` for pre-fill
- Line 21-25: `writeDraft({ englishLevel: level })` then pushes to step-3 — **no fetch()**
- No import or reference to any `user`, `useQuery`, or `/api/*` call
- Does not read `nativeLanguage` at all (UI text is localized by next-intl, which short-circuits to English on `/onboarding/*` — see i18n note below)

### ✅ Step 3 — localStorage read/write, no DB, no HTTP

[src/app/onboarding/step-3/page.tsx](../../src/app/onboarding/step-3/page.tsx)
- Line 14: reads `readDraft().goals ?? null` for pre-fill
- Line 16-19: `writeDraft({ goals })` then pushes to step-4 — **no fetch()**
- No DB access, no React Query, no API call

### ✅ Step 4 — single HTTP call, writes all three fields

[src/app/onboarding/step-4/page.tsx](../../src/app/onboarding/step-4/page.tsx)
- Line 21-26: reads `{ nativeLanguage, englishLevel, goals }` from `readDraft()`; redirects to step-1 if anything is missing
- Line 33-42: **single** `fetch('/api/onboarding/complete', { method: 'POST', body: { nativeLanguage, englishLevel, goals } })`
- Line 48-50: clears localStorage draft and invalidates user query cache on success

### ✅ The backend commit is atomic

[src/app/api/onboarding/complete/route.ts](../../src/app/api/onboarding/complete/route.ts)
- Validates all three fields server-side (line 16-25)
- One `prisma.user.update` writes `nativeLanguage`, `englishLevel`, `goals`, `interfaceLanguage`, and flips `onboardingCompleted = true` in a single DB call (line 34-43)
- Re-issues the JWT with the updated `onboardingCompleted` claim so middleware sees the new flag on the next request (line 46-49)

### ✅ `/api/onboarding/` contains only `complete/`

`ls src/app/api/onboarding/` → `complete` (only). No `level/`, `goals/`, `language/`, or `chat/` routes exist. The cleanup from tasks T028/T029 is done.

### ✅ No in-onboarding DB reads

`grep -r 'fetch\(|useQuery|useMutation|/api/' src/app/onboarding/ src/components/onboarding/` returns **only** the single fetch in step-4. No other onboarding file reads from the API or DB.

### ✅ i18n explicitly skips DB for onboarding paths

[src/i18n/request.ts](../../src/i18n/request.ts) line 8-15: on any `/onboarding/*` path the config returns `{ locale: 'en', messages: en.json }` **without touching Prisma**. This means the onboarding UI is always English — there is no hidden path where `nativeLanguage` is pulled from the DB to localize steps 2 or 3.

## What does NOT fit (and requires NO change)

Nothing. All four invariants hold in the code on disk.

## Minor observations (out of scope for this request)

These are noted for completeness, not proposed changes:

- **OB-1** — [src/app/onboarding/page.tsx](../../src/app/onboarding/page.tsx) always redirects to `step-1` regardless of how far the user got. A more polished resume-UX would read `readDraft()` and jump to the earliest incomplete step. The current behavior is acceptable because step-1 itself pre-fills from localStorage, so a returning user sees their prior language chip highlighted. (Original task T006 proposed reading the DB for this — we chose not to, which is correct per the stated intent.)
- **OB-2** — `localStorage` persists indefinitely. A user who abandons onboarding for weeks will resume with stale draft data. Not a correctness issue, but worth a future `clearDraft()` on sign-out.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20+
**Primary Dependencies**: Next.js 15 (App Router), React 19, Prisma 6, TanStack Query v5, next-intl, jose (JWT)
**Storage**: localStorage (client draft) → single Postgres write on commit
**Testing**: Manual smoke via `pnpm dev` + DevTools Network tab (no automated tests required for this verification)
**Target Platform**: Vercel (Next.js App Router, Fluid Compute)
**Project Type**: Web application (single Next.js project — frontend + API routes in one repo)
**Constraints**: Zero LLM requests during onboarding; single DB write at commit
**Scale/Scope**: 4-page onboarding funnel

## Constitution Check

No constitution file exists at `.specify/memory/constitution.md`. No gates to evaluate.

## Project Structure

```text
src/
├── app/
│   ├── onboarding/
│   │   ├── page.tsx                # redirect to step-1
│   │   ├── layout.tsx
│   │   ├── step-1/page.tsx         # localStorage only
│   │   ├── step-2/page.tsx         # localStorage only
│   │   ├── step-3/page.tsx         # localStorage only
│   │   └── step-4/page.tsx         # single POST /api/onboarding/complete
│   └── api/onboarding/complete/route.ts   # atomic 3-field write + flag flip
├── components/onboarding/          # LanguagePicker, LevelPicker, GoalsForm, LeoSide, LeoCharacter
├── lib/onboarding/
│   ├── clientState.ts              # readDraft / writeDraft / clearDraft (localStorage KEY='onboardingDraft')
│   ├── languages.ts
│   ├── levels.ts
│   └── goals.ts                    # Zod schema
└── i18n/request.ts                 # short-circuits to 'en' for /onboarding/*
```

**Structure Decision**: Unchanged from current state. No new files, no deletions.

## Phases

### Phase 0 — Research
Not needed. All questions answered by reading the existing files listed above.

### Phase 1 — Design & Contracts
Not needed. No new entities, no new contracts. The one existing contract (`POST /api/onboarding/complete` → `{ ok: true }`) already accepts the shape `{ nativeLanguage, englishLevel, goals }` and is covered by the server-side Zod + enum validation in [route.ts](../../src/app/api/onboarding/complete/route.ts).

### Phase 2 — Tasks
**No tasks. No code changes required.** If the user later accepts OB-1 as in-scope, the single change would be in [src/app/onboarding/page.tsx](../../src/app/onboarding/page.tsx) to branch on `readDraft()` fields before redirecting — but that is a UX polish, not a correctness fix for the stated invariants.

## Complexity Tracking

No violations. No justifications required.
