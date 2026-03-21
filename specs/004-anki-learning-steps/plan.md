# Implementation Plan: Anki-Like Learning Steps & Interval Hints

**Branch**: `004-anki-learning-steps` | **Date**: 2026-03-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-anki-learning-steps/spec.md`

## Summary

The current SM-2 implementation sets `interval = 1 day` on "Again", so failed cards disappear until tomorrow. This feature adds Anki-style learning steps with sub-day (minute-level) intervals so failed cards cycle back within the same session. Additionally, rating buttons will show projected interval hints.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20+
**Primary Dependencies**: NestJS 10+ (backend), Vite 6 + React 19 (frontend), Prisma (ORM)
**Storage**: PostgreSQL (Neon serverless) via Prisma
**Testing**: Jest (backend unit tests)
**Target Platform**: Web (browser SPA + REST API)
**Project Type**: Web application (backend API + frontend SPA)
**Performance Goals**: Review flow loads in <200ms, card transitions feel instant
**Constraints**: Sub-day intervals must be precise to the minute; learning cards must reappear in same session
**Scale/Scope**: Single-user, ~3 files modified backend, ~2 files modified frontend

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Algorithm Correctness (SM-2) | ✅ PASS | This feature enhances SM-2 with learning steps — directly required by updated constitution |
| II. Offline-First | ⚠️ N/A | Frontend is online-only for now; not in scope for this feature |
| III. Test-First | ✅ PASS | SM-2 unit tests exist; will update with learning step test cases |
| IV. Data Integrity | ✅ PASS | CardState mutation remains atomic via Prisma transaction |
| V. Critical Path UX | ✅ PASS | Interval hints and learning steps directly improve the review UX |
| VI. Simplicity | ✅ PASS | Minimal changes: extend SM-2 logic, add 1 field to CardState, update button UI |

## Project Structure

### Documentation (this feature)

```text
specs/004-anki-learning-steps/
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   └── review-api.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   └── reviews/
│       ├── sm2.service.ts          # Modified: add learning steps logic
│       ├── reviews.service.ts      # Modified: pass learning steps config, return interval hints
│       └── reviews.controller.ts   # Modified: new endpoint for interval previews
├── prisma/
│   └── schema.prisma               # Modified: add learningStep field to CardState
└── test/
    └── unit/
        └── sm2.service.spec.ts     # Modified: add learning step test cases

frontend/
└── src/
    ├── pages/
    │   └── ReviewSession.tsx        # Modified: show interval hints on buttons
    └── api/
        └── reviews.ts              # Modified: call interval preview endpoint
```

**Structure Decision**: Existing web application structure (backend/ + frontend/). No new directories needed — this is a modification of existing files.
