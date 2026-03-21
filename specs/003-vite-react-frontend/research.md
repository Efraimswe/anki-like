# Research: Vite React Frontend

## R1: Monorepo Structure Approach

**Decision**: Move existing code into `backend/` subdirectory; scaffold `frontend/` with Vite. No monorepo tool (nx, turborepo) — just two independent `package.json` files.

**Rationale**: This is the simplest approach for two projects. A monorepo tool adds configuration overhead with no benefit at this scale. Each project runs independently with its own dev server.

**Alternatives considered**:
- Turborepo/Nx: Overkill for 2 projects with no shared code
- Workspace (npm workspaces): Adds complexity for shared deps that don't exist yet

## R2: Frontend Stack Choices

**Decision**: Vite 6 + React 19 + React Router 7 (client SPA) + TailwindCSS 4

**Rationale**:
- Vite: Fastest dev server, simple config, widely adopted
- React 19: Latest stable, user already agreed on React
- React Router 7: Standard client-side routing for React SPAs
- TailwindCSS 4: Utility-first CSS enables friendly design quickly without a component library

**Alternatives considered**:
- CSS Modules: More boilerplate for similar result
- shadcn/ui: Nice components but adds complexity for a demo UI
- Zustand/Redux: No global state management needed — React state + fetch is sufficient

## R3: API Communication

**Decision**: Thin fetch wrapper with typed functions per endpoint. No axios, no react-query.

**Rationale**: The app is simple — ~10 API calls total. A typed wrapper around `fetch` with error handling is sufficient. Adding axios or react-query would be premature complexity.

**Alternatives considered**:
- Axios: Adds a dependency for minimal benefit (fetch does everything needed)
- React Query / SWR: Great for complex caching, but this app has simple read/write patterns
- Generated client from OpenAPI: Backend doesn't have OpenAPI spec; manual typing is fine for ~10 endpoints

## R4: Backend Restructure Approach

**Decision**: `git mv` all backend files into `backend/`. Update import paths in configs (tsconfig, nest-cli). Verify backend builds and starts from new location.

**Rationale**: `git mv` preserves git history. Config paths (prisma, tsconfig) need updating since they're relative to the project root.

**Alternatives considered**:
- Symlinks: Fragile, platform-dependent
- Copy + delete: Loses git history

## R5: CORS Configuration

**Decision**: Backend must enable CORS for the frontend dev server origin (typically `http://localhost:5173`). Configure via NestJS/Fastify CORS options.

**Rationale**: Frontend and backend run on different ports during development. Without CORS, browser blocks API calls.

**Alternatives considered**:
- Vite proxy: Works but masks real deployment setup. CORS is needed in production anyway.
- Same-origin deployment: Not applicable during development
