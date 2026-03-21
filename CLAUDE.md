# anki-like Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-21

## Active Technologies
- TypeScript 5.x / Node.js 20+ + NestJS 10+, @nestjs/platform-fastify, prisma, @prisma/client (replacing pg) (002-prisma-migration)
- PostgreSQL (Neon serverless) — same database, different client (002-prisma-migration)
- TypeScript 5.x / Node.js 20+ + Vite 6, React 19, React Router 7 (client-side), TailwindCSS 4 (003-vite-react-frontend)
- N/A (frontend consumes backend API; backend uses PostgreSQL via Prisma) (003-vite-react-frontend)
- TypeScript 5.x / Node.js 20+ + NestJS 10+ (backend), Vite 6 + React 19 (frontend), Prisma (ORM) (004-anki-learning-steps)
- PostgreSQL (Neon serverless) via Prisma (004-anki-learning-steps)
- TypeScript 5.x / Node.js 20+ + NestJS 10+ (backend), Vite 6 + React 19 (frontend), Prisma (ORM), bcrypt (password hashing), @nestjs/jwt + @nestjs/passport + passport-jwt (auth) (005-jwt-auth-settings)

- TypeScript 5.x / Node.js 20+ + NestJS 10+, @nestjs/platform-fastify, pg (node-postgres) (001-nestjs-backend)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x / Node.js 20+: Follow standard conventions

## Recent Changes
- 005-jwt-auth-settings: Added TypeScript 5.x / Node.js 20+ + NestJS 10+ (backend), Vite 6 + React 19 (frontend), Prisma (ORM), bcrypt (password hashing), @nestjs/jwt + @nestjs/passport + passport-jwt (auth)
- 004-anki-learning-steps: Added TypeScript 5.x / Node.js 20+ + NestJS 10+ (backend), Vite 6 + React 19 (frontend), Prisma (ORM)
- 003-vite-react-frontend: Added TypeScript 5.x / Node.js 20+ + Vite 6, React 19, React Router 7 (client-side), TailwindCSS 4


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
