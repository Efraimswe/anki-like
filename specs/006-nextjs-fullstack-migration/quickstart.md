# Quickstart: Next.js Fullstack Migration

## Prerequisites

- Node.js 20+
- PostgreSQL (Neon serverless) — existing database, no changes needed

## Setup

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# DATABASE_URL and JWT_SECRET must be configured

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev
```

## Key Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run e2e tests (Playwright) |
| `npm run lint` | Lint with ESLint |
| `npx prisma studio` | Open Prisma Studio |
| `npx prisma generate` | Regenerate Prisma client |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Neon) |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRY` | Access token expiry (e.g., "15m") |
| `REFRESH_EXPIRY` | Refresh token expiry (e.g., "7d") |

## Project Layout

- `src/app/` — Next.js App Router pages and API routes
- `src/lib/` — Business logic (SM-2, auth, Prisma client)
- `src/components/` — React components
- `src/hooks/` — React hooks
- `prisma/` — Schema and migrations
- `tests/` — Unit and e2e tests
