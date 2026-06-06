# Anki-Like

Spaced repetition flashcard app with a NestJS backend and React frontend.

## Project Structure

```
backend/    # NestJS + Fastify + Prisma API
frontend/   # Vite + React + TailwindCSS SPA
specs/      # Feature specifications
```

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env    # set DATABASE_URL
pnpm install
pnpm exec prisma migrate deploy
pnpm run start:dev      # http://localhost:3000
```

### Frontend

```bash
cd frontend
cp .env.example .env    # set VITE_API_BASE_URL
pnpm install
pnpm run dev            # http://localhost:5173
```

## Tech Stack

- **Backend**: NestJS 11, Fastify, Prisma, PostgreSQL (Neon)
- **Frontend**: Vite 6, React 19, React Router 7, TailwindCSS 4
