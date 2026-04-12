# anki-like Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-12

## Active Technologies
- TypeScript 5.x / Node.js 20+ + NestJS 10+, @nestjs/platform-fastify, prisma, @prisma/client (replacing pg) (002-prisma-migration)
- PostgreSQL (Neon serverless) — same database, different client (002-prisma-migration)
- TypeScript 5.x / Node.js 20+ + Vite 6, React 19, React Router 7 (client-side), TailwindCSS 4 (003-vite-react-frontend)
- N/A (frontend consumes backend API; backend uses PostgreSQL via Prisma) (003-vite-react-frontend)
- TypeScript 5.x / Node.js 20+ + NestJS 10+ (backend), Vite 6 + React 19 (frontend), Prisma (ORM) (004-anki-learning-steps)
- PostgreSQL (Neon serverless) via Prisma (004-anki-learning-steps)
- TypeScript 5.x / Node.js 20+ + NestJS 10+ (backend), Vite 6 + React 19 (frontend), Prisma (ORM), bcrypt (password hashing), @nestjs/jwt + @nestjs/passport + passport-jwt (auth) (005-jwt-auth-settings)
- TypeScript 5.x / Node.js 20+ + Next.js 15, React 19, Prisma, bcrypt, jose (JWT), TailwindCSS 4, GSAP, lucide-react (006-nextjs-fullstack-migration)
- TypeScript 5.x / Node.js 20+ + Next.js 15, React 19, `@tanstack/react-query` v5, `@tanstack/react-query-devtools`, Prisma, jose (JWT) (007-tanstack-query-auth-migration)
- PostgreSQL via Prisma (unchanged) (007-tanstack-query-auth-migration)

- TypeScript 5.x / Node.js 20+ + NestJS 10+, @nestjs/platform-fastify, pg (node-postgres) (001-nestjs-backend)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

pnpm test && pnpm run lint

## Code Style

TypeScript 5.x / Node.js 20+: Follow standard conventions

## Recent Changes
- 007-tanstack-query-auth-migration: Added TypeScript 5.x / Node.js 20+ + Next.js 15, React 19, `@tanstack/react-query` v5, `@tanstack/react-query-devtools`, Prisma, jose (JWT)
- 006-nextjs-fullstack-migration: Added TypeScript 5.x / Node.js 20+ + Next.js 15, React 19, Prisma, bcrypt, jose (JWT), TailwindCSS 4, GSAP, lucide-react
- 005-jwt-auth-settings: Added TypeScript 5.x / Node.js 20+ + NestJS 10+ (backend), Vite 6 + React 19 (frontend), Prisma (ORM), bcrypt (password hashing), @nestjs/jwt + @nestjs/passport + passport-jwt (auth)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
