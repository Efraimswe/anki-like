# Research: Migrate to Next.js Fullstack App

**Date**: 2026-03-31

## R1: JWT Authentication in Next.js App Router

**Decision**: Use `jose` library for JWT operations + Next.js middleware for route protection

**Rationale**: The current backend uses `@nestjs/jwt` + `passport-jwt` which are NestJS-specific. In Next.js App Router, the standard approach is:
- `jose` for JWT sign/verify (Edge Runtime compatible, unlike `jsonwebtoken`)
- `middleware.ts` at root to intercept requests and check auth cookies
- HTTP-only cookies for token storage (replacing the current approach)
- Route Handlers for sign-in/sign-up/refresh/sign-out endpoints

**Alternatives considered**:
- `next-auth` / Auth.js: Overkill for custom JWT auth; adds unnecessary abstraction over existing auth logic
- `jsonwebtoken`: Not Edge Runtime compatible; would require Node.js runtime for middleware
- Server Actions only: Would work but loses REST API compatibility

## R2: Replacing NestJS Controllers with Next.js Route Handlers

**Decision**: Use Next.js Route Handlers (`app/api/*/route.ts`) to replicate existing REST endpoints

**Rationale**: The current backend exposes RESTful endpoints via NestJS controllers. Route Handlers provide the same HTTP method-based routing (GET, POST, PUT, DELETE) with direct access to Prisma. This is a 1:1 mapping that minimizes behavioral changes.

**Alternatives considered**:
- Server Actions only: Good for mutations but doesn't support GET endpoints or external API consumers
- tRPC: Adds type-safety but requires client-side changes; overkill for this migration
- Mixed (Server Actions for mutations + Route Handlers for queries): More idiomatic Next.js but increases migration complexity

## R3: NestJS Validation Replacement

**Decision**: Use Zod for request validation in Route Handlers

**Rationale**: NestJS uses `class-validator` + `class-transformer` with DTOs. In Next.js Route Handlers, Zod schemas provide equivalent validation with better TypeScript inference and no decorator dependency. Each existing DTO maps to a Zod schema.

**Alternatives considered**:
- `class-validator` directly: Works but requires decorator metadata setup, feels unnatural outside NestJS
- No validation library (manual): Error-prone, loses type safety
- `valibot`: Smaller bundle but less ecosystem support

## R4: GSAP Animations in Next.js

**Decision**: Use GSAP with `"use client"` directives on animated components

**Rationale**: GSAP requires DOM access and must run client-side. Components using `@gsap/react` hooks need the `"use client"` directive. This is a minimal change — add the directive to existing animated components.

**Alternatives considered**:
- Replace GSAP with CSS animations: Would change visual behavior (spec requires preservation)
- Framer Motion: Different API, would require rewriting animations

## R5: Testing Strategy

**Decision**: Vitest for unit tests, Playwright for e2e

**Rationale**: The existing backend uses Jest. Vitest is API-compatible with Jest but faster and natively supports ESM/TypeScript. SM-2 unit tests can be migrated with minimal changes (mostly import paths). Playwright covers full-stack e2e testing with Next.js.

**Alternatives considered**:
- Jest: Works but slower, ESM support requires more configuration
- Cypress: Heavier than Playwright for this use case

## R6: Prisma in Next.js

**Decision**: Use standard Prisma singleton pattern with global caching for dev hot-reload

**Rationale**: Next.js hot-reloads in dev create multiple Prisma instances. The standard pattern caches the client on `globalThis` in development. Schema moves from `backend/prisma/` to root `prisma/`. No schema changes needed.

**Alternatives considered**:
- Prisma Accelerate: Unnecessary for current scale
- Drizzle ORM: Would require rewriting all queries; no benefit for migration
