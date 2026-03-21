# Implementation Plan: JWT Auth, Settings & Navigation

**Branch**: `005-jwt-auth-settings` | **Date**: 2026-03-21 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-jwt-auth-settings/spec.md`

## Summary

Add JWT-based authentication (email/password), persistent navbar, session management, user settings (profile + theme), and a global Cards section. All existing data is wiped during migration. Tokens stored in HttpOnly cookies with CSRF protection.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20+
**Primary Dependencies**: NestJS 10+ (backend), Vite 6 + React 19 (frontend), Prisma (ORM), bcrypt (password hashing), @nestjs/jwt + @nestjs/passport + passport-jwt (auth)
**Storage**: PostgreSQL (Neon serverless) via Prisma
**Testing**: Jest (unit), Supertest (e2e)
**Target Platform**: Web (SPA + REST API)
**Project Type**: Web application (monorepo: backend/ + frontend/)
**Performance Goals**: Sign-in < 2s, token refresh transparent, theme toggle < 200ms
**Constraints**: HttpOnly cookies for tokens, CSRF protection on mutations, no OAuth/social login v1
**Scale/Scope**: Single-user to multi-user transition; ~6 new backend endpoints, ~5 new frontend pages/sections

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Algorithm Correctness (SM-2) | PASS | No changes to scheduling logic |
| II. Offline-First | JUSTIFIED VIOLATION | Auth requires network; existing offline-first principle applies to review flow, which remains functional once authenticated |
| III. Test-First | PASS | Auth guards and token flows will have unit tests |
| IV. Data Integrity | PASS | Existing data deleted per clarification; all new data scoped to user with foreign keys |
| V. Critical Path UX | PASS | Review flow unchanged; auth adds sign-in gate but doesn't slow review |
| VI. Simplicity | PASS | Minimal auth (email/password only), no OAuth, no password reset v1 |

## Project Structure

### Documentation (this feature)

```text
specs/005-jwt-auth-settings/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── rest-api.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   ├── jwt-auth.guard.ts
│   │   ├── csrf.guard.ts
│   │   └── dto/
│   │       ├── sign-up.dto.ts
│   │       └── sign-in.dto.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   └── dto/
│   │       └── update-profile.dto.ts
│   ├── sessions/
│   │   ├── sessions.module.ts
│   │   ├── sessions.service.ts
│   │   └── sessions.controller.ts
│   ├── cards/        # Updated: add userId scoping
│   ├── decks/        # Updated: add userId scoping
│   ├── reviews/      # Updated: add userId scoping
│   └── statistics/   # Updated: add userId scoping
├── prisma/
│   ├── schema.prisma            # Add User, Session models; add userId to existing models
│   └── migrations/
│       └── 2_auth/migration.sql # Wipe data + add auth tables + userId columns

frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── ThemeProvider.tsx
│   ├── pages/
│   │   ├── SignIn.tsx
│   │   ├── SignUp.tsx
│   │   ├── AllCards.tsx
│   │   └── Settings.tsx         # Profile + Theme + Sessions tabs
│   ├── api/
│   │   ├── auth.ts
│   │   ├── sessions.ts
│   │   └── users.ts
│   └── hooks/
│       ├── useAuth.tsx
│       └── useTheme.tsx
```

**Structure Decision**: Extend existing backend/frontend monorepo layout. New `auth/`, `users/`, `sessions/` modules in backend. New auth pages and navbar in frontend.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Offline-First (Principle II) | Auth inherently requires network for sign-in/sign-up | Review flow still works once authenticated and cards are loaded; offline-first applies to the study session, not to authentication |
