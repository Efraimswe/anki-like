# Implementation Plan: Onboarding Flow

**Branch**: `008-onboarding-flow` | **Date**: 2026-04-13 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/008-onboarding-flow/spec.md`

## Summary

Implement a 4-step guided onboarding flow (Leo character, language selection, AI level assessment chat, AI goal extraction chat, welcome screen) that is mandatory for all new users. Middleware enforces the `onboardingCompleted` flag — no protected route is reachable until all steps complete. Steps 2 and 3 use streaming AI chat (Vercel AI SDK + Gemini 2.0 Flash) with optional voice input via MediaRecorder + transcription.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20+  
**Primary Dependencies**: Next.js 15, React 19, TanStack Query v5, Prisma 6, Vercel AI SDK (ai + @ai-sdk/google), jose (JWT), TailwindCSS 4  
**Storage**: PostgreSQL via Prisma (Neon serverless)  
**Testing**: Vitest  
**Target Platform**: Next.js App Router (web, server + client components)  
**Project Type**: Full-stack web application  
**Performance Goals**: Onboarding pages load in <200ms; AI streaming first token in <1s  
**Constraints**: Voice input is progressive enhancement (text-only fallback); AI SDK streaming must work in App Router route handlers  
**Scale/Scope**: Per-user, lightweight — onboarding runs once per user

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Algorithm Correctness (SM-2) | ✅ PASS | Onboarding does not touch SM-2 scheduling |
| II. Offline-First | ⚠️ EXCEPTION | Onboarding requires AI streaming — network needed. Acceptable: onboarding is a one-time setup flow, not part of the core review loop |
| III. Test-First | ✅ REQUIRED | Agent tool logic (`assessLevel`, `extractGoals`) MUST have unit tests before implementation |
| IV. Data Integrity | ✅ REQUIRED | Schema changes need Prisma migration; `onboardingCompleted` flag is additive |
| V. Critical Path UX | ✅ PASS | Review flow not affected |
| VI. Simplicity | ✅ JUSTIFIED | AI chat complexity is the core product differentiator for onboarding; no simpler alternative delivers the same personalization |

**Exception for Principle II**: Onboarding is a one-time setup flow explicitly dependent on AI. It is not part of the review loop and does not need to be offline-capable.

## Project Structure

### Documentation (this feature)

```text
specs/008-onboarding-flow/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── onboarding-api.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── onboarding/               # NEW: onboarding pages (public to auth, gated by onboardingCompleted)
│   │   ├── layout.tsx            # Leo character shell layout
│   │   ├── page.tsx              # Step router — redirects to current step
│   │   ├── step-1/page.tsx       # Language selection
│   │   ├── step-2/page.tsx       # AI level assessment chat
│   │   ├── step-3/page.tsx       # AI goal extraction chat
│   │   └── step-4/page.tsx       # Welcome + completion
│   ├── (protected)/
│   │   └── dashboard/
│   └── api/
│       ├── auth/
│       ├── onboarding/           # NEW: onboarding API routes
│       │   ├── language/route.ts         # POST: save native language
│       │   ├── chat/
│       │   │   ├── level/route.ts        # POST: streaming level assessment chat
│       │   │   └── goals/route.ts        # POST: streaming goal extraction chat
│       │   ├── transcribe/route.ts       # POST: voice → text transcription
│       │   └── complete/route.ts         # POST: set onboardingCompleted = true
│       ├── cards/
│       ├── decks/
│       └── reviews/
├── components/
│   ├── onboarding/               # NEW: onboarding-specific components
│   │   ├── LeoCharacter.tsx      # Character image + float animation
│   │   ├── LanguagePicker.tsx    # Step 1 visual language picker
│   │   ├── OnboardingChat.tsx    # Shared chat UI for Steps 2 & 3
│   │   ├── VoiceInput.tsx        # MediaRecorder voice capture button
│   │   └── StepProgress.tsx      # Message counter / timer display
│   └── ui/
├── lib/
│   ├── auth.ts
│   └── onboarding/              # NEW
│       ├── prompts.ts           # System prompts for level & goal agents
│       └── languages.ts         # Supported language list with flags
├── hooks/
│   └── useOnboardingChat.ts     # NEW: TanStack Query + streaming state
└── middleware.ts                # MODIFIED: add onboardingCompleted check
```

**Structure Decision**: Next.js App Router, single repo. Onboarding pages live under `/onboarding/` route group (not inside `(protected)` — middleware handles redirect logic separately for onboarding vs protected routes).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Offline exception (Principle II) | AI streaming is the core onboarding mechanism | A static form cannot assess English level or extract goals with the same quality |
