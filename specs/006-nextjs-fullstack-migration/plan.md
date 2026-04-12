# Implementation Plan: Migrate to Next.js Fullstack App

**Branch**: `006-nextjs-fullstack-migration` | **Date**: 2026-03-31 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-nextjs-fullstack-migration/spec.md`

## Summary

Migrate the existing separate NestJS backend + Vite React frontend into a single Next.js 15 App Router application. All existing functionality (auth, decks, cards, reviews, statistics, sessions, settings) is preserved with the same PostgreSQL database via Prisma. Old directories are retained until full verification, then removed.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20+
**Primary Dependencies**: Next.js 15, React 19, Prisma, bcrypt, jose (JWT), TailwindCSS 4, GSAP, lucide-react
**Storage**: PostgreSQL (Neon serverless) via Prisma
**Testing**: Vitest (unit), Playwright (e2e)
**Target Platform**: Web (server-rendered + client)
**Project Type**: web-service (fullstack)
**Performance Goals**: Page load <3s, review flow <200ms interaction
**Constraints**: Zero feature regression, existing DB schema unchanged
**Scale/Scope**: Single-user app, 8 pages, 7 API domains

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Algorithm Correctness (SM-2) | PASS | SM-2 logic extracted as-is from backend; unit tests preserved |
| II. Offline-First | DEFERRED | Current app is not offline-first (uses server DB). Constitution aspirational here — no regression. |
| III. Test-First | PASS | SM-2 tests migrated; new API routes tested |
| IV. Data Integrity | PASS | Same Prisma schema, same atomic mutations |
| V. Critical Path UX | PASS | Review flow preserved, same client components |
| VI. Simplicity | PASS | Consolidating two projects into one reduces complexity |

## Project Structure

### Documentation (this feature)

```text
specs/006-nextjs-fullstack-migration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api-routes.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Home redirect
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx          # Auth-guarded layout
│   │   ├── decks/
│   │   │   ├── page.tsx        # Deck list
│   │   │   └── [id]/page.tsx   # Deck detail
│   │   ├── review/
│   │   │   └── [deckId]/page.tsx
│   │   ├── settings/
│   │   │   ├── page.tsx        # Settings index
│   │   │   ├── profile/page.tsx
│   │   │   └── sessions/page.tsx
│   │   └── statistics/page.tsx
│   └── api/
│       ├── auth/
│       │   ├── sign-up/route.ts
│       │   ├── sign-in/route.ts
│       │   ├── refresh/route.ts
│       │   └── sign-out/route.ts
│       ├── decks/
│       │   └── [...]/route.ts
│       ├── cards/
│       │   └── [...]/route.ts
│       ├── reviews/
│       │   └── [...]/route.ts
│       ├── sessions/
│       │   └── [...]/route.ts
│       ├── statistics/
│       │   └── route.ts
│       └── users/
│           └── [...]/route.ts
├── lib/
│   ├── prisma.ts               # Prisma client singleton
│   ├── auth.ts                 # JWT helpers (jose), middleware utils
│   ├── sm2.ts                  # SM-2 algorithm (extracted from backend)
│   └── daily-limits.ts         # Daily limit logic
├── components/
│   ├── ui/                     # Shared UI (LoadingSpinner, ErrorMessage, etc.)
│   └── layout/                 # Layout, ProtectedRoute
├── hooks/
│   ├── use-auth.ts
│   └── use-theme.ts
├── types/
│   └── index.ts
prisma/
├── schema.prisma               # Moved from backend/prisma/
└── migrations/                 # Existing migrations
tests/
├── unit/
│   └── sm2.test.ts             # Migrated SM-2 tests
└── e2e/
public/
middleware.ts                   # Auth middleware (JWT check, redirect)
next.config.ts
tailwind.config.ts
package.json
```

**Structure Decision**: Single Next.js project at repo root. App Router with route groups `(auth)` for public pages and `(protected)` for authenticated pages. API Route Handlers replace NestJS controllers. Business logic in `lib/`. Prisma schema moved to root `prisma/`.

## Complexity Tracking

No constitution violations requiring justification.
