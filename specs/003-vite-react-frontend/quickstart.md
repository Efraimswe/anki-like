# Quickstart: Vite React Frontend

## Prerequisites

- Node.js 20+
- Backend running (see `backend/` README)
- PostgreSQL database accessible by backend

## Project Structure

```
anki-like/
├── backend/    # NestJS API (existing, relocated)
└── frontend/   # Vite + React SPA (new)
```

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env   # configure DATABASE_URL
npm install
npx prisma migrate deploy
npm run start:dev       # runs on http://localhost:3000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env   # set VITE_API_BASE_URL=http://localhost:3000/api/v1
npm install
npm run dev             # runs on http://localhost:5173
```

## Available Scripts

### Backend (`backend/`)
- `npm run start:dev` — Start dev server with hot reload
- `npm test` — Run tests
- `npm run lint` — Lint code

### Frontend (`frontend/`)
- `npm run dev` — Start Vite dev server
- `npm run build` — Production build
- `npm run preview` — Preview production build
- `npm test` — Run Vitest tests

## Key URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api/v1
- Deck list: http://localhost:5173/ (home page)
