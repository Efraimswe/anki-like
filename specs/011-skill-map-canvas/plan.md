# Implementation Plan: Skill Map — Phase 1 (FigJam-style Hub Canvas)

**Branch**: `011-skill-map-canvas` | **Date**: 2026-04-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-skill-map-canvas/spec.md`

## Summary

Add a new `/map` route rendering a FigJam-style infinite canvas (pan/zoom, text/sticky/shape nodes, straight + orthogonal connectors, select/marquee/drag/resize, undo/redo). A "Progress" entry in the existing sidebar (under a new "Insights" group, marked NEW) navigates to it. Per-user persistence is a single `SkillMap` Prisma model keyed by `userId`; edits autosave via a TanStack Query mutation debounced ~500ms. First-time users are served a seeded sample map from the server. No external graph library — nodes are DOM, connectors are a single SVG overlay, with ~200 lines of plain geometry (`portPoint` / `orthoRoute` / `nearestSideToPoint`) as prescribed by the design handoff.

## Technical Context

**Language/Version**: TypeScript 5.9, Node.js 20+
**Primary Dependencies**: Next.js 15 (App Router), React 19, TanStack Query v5, Prisma 6 (@prisma/client), jose (JWT session), Tailwind CSS 4, Zod, lucide-react
**Storage**: PostgreSQL (Neon serverless) via Prisma — new `SkillMap` model keyed 1:1 on `User.id`. Nodes and edges stored as `Json` columns.
**Testing**: Vitest (unit + logic); optional manual QA via `next dev` in browser for canvas interactions
**Target Platform**: Web (modern browsers — Chromium/WebKit/Firefox current); dark-mode compatible with existing theme toggle
**Project Type**: Next.js full-stack web app (App Router `src/app/` + API route handlers under `src/app/api/`)
**Performance Goals**: Smooth pan/zoom at 60fps on a map of ≥100 nodes + ≥200 connectors; autosave debounced to ~500ms; initial map render within existing app page-load budget
**Constraints**: No additional graph library (handoff rejects react-flow); no Canvas API (DOM nodes + single SVG overlay); no server-side viewport persistence (client-only); hard cap at 2000 nodes / 4000 edges per save (guardrail); last-write-wins for same-user multi-tab
**Scale/Scope**: Personal maps, tens to low-hundreds of nodes per user; one map per user in Phase 1

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Algorithm Correctness (SM-2) | ✅ N/A | Feature does not touch the review/scheduling path. |
| II. Offline-First | ⚠️ Justified deviation | The review flow remains offline-capable; Skill Map is an auxiliary hub feature explicitly specced as server-persisted. Local-only persistence would defeat cross-device continuity and is not required by the constitution for non-review features. |
| III. Test-First | ✅ Pass | Pure-geometry helpers (`portPoint`, `orthoRoute`, `nearestSideToPoint`) and the Zod validators for the API get vitest unit tests written before implementation. UI interactions (drag/marquee/bend handles) are test-after per constitution's allowance for layout/styling concerns. |
| IV. Data Integrity | ✅ Pass | Saves are full-document replacement gated by Zod validation; server rejects oversized payloads without touching the prior row. `SkillMap` has a migration. No silent data loss — local buffer survives failed saves and retries. |
| V. Critical Path UX | ✅ Pass | Does not alter the review flow. The map page itself must not introduce a loading spinner that blocks first paint — the page uses a TanStack Query prefetch + skeleton, matching existing dashboard patterns. |
| VI. Simplicity | ✅ Pass | No new external graph/canvas lib. Undo/redo is a simple snapshot stack. Single table. Phase 1 scope excludes collaboration, export, multi-map, and rich text — matching YAGNI. |

**Verdict**: PASS. The only deviation (II) is a scoped, documented exception for a non-review auxiliary feature.

## Project Structure

### Documentation (this feature)

```text
specs/011-skill-map-canvas/
├── plan.md                       # This file
├── research.md                   # Phase 0
├── data-model.md                 # Phase 1
├── quickstart.md                 # Phase 1
├── contracts/
│   ├── api-map.md                # GET/PUT /api/map contracts
│   └── schemas.ts                # Zod schemas (Node, Edge, SkillMapDoc)
└── tasks.md                      # /speckit.tasks output (not created here)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (protected)/
│   │   └── map/
│   │       ├── page.tsx                    # Server component; TanStack Query prefetch of /api/map
│   │       └── _components/
│   │           ├── SkillMapCanvas.tsx      # Client: pan/zoom + nodes + edges + tool routing
│   │           ├── Toolbar.tsx             # Floating bottom-center toolbar + submenus
│   │           ├── NodeView.tsx            # Text / Sticky / Shape renderer + resize handles + ports
│   │           ├── EdgeLayer.tsx           # SVG overlay: paths, arrows, bend handles, endpoint handles
│   │           ├── ZoomControls.tsx        # Bottom-right – / % / + / reset
│   │           ├── ContextMenu.tsx         # Right-click empty-canvas menu
│   │           ├── useSkillMapDoc.ts       # useReducer doc state + undo/redo stack + debounced save
│   │           └── geometry.ts             # portPoint / orthoRoute / nearestSideToPoint / hitTestEdge
│   └── api/
│       └── map/
│           └── route.ts                    # GET (load or seed) + PUT (validated replace)
├── components/
│   └── layout/
│       └── AppLayout.tsx                   # EDIT: add "Insights" group + "Progress" item + NEW pill
├── lib/
│   ├── queries/
│   │   └── skillMap.ts                     # TanStack Query keys, fetcher, mutation, seed helper
│   └── skillMap/
│       ├── sample.ts                       # SAMPLE_NODES + SAMPLE_EDGES for first-time seed
│       └── schema.ts                       # Re-export of contracts/schemas.ts for runtime
├── types/
│   └── skillMap.ts                         # TS types derived from Zod schemas
└── middleware.ts                           # unchanged; /map is already under (protected)

prisma/
├── schema.prisma                           # EDIT: add SkillMap model + User.skillMap relation
└── migrations/
    └── <timestamp>_add_skill_map/
        └── migration.sql

tests/
└── skillMap/
    ├── geometry.test.ts                    # portPoint, orthoRoute, nearestSideToPoint
    ├── schema.test.ts                      # Zod validation (caps, shapes, enums)
    ├── docReducer.test.ts                  # create/delete/move/resize/connector/undo/redo
    └── apiContract.test.ts                 # GET returns seed on empty; PUT rejects oversized
```

**Structure Decision**: Matches the existing Next.js App Router layout. The canvas, its helpers, and state hook live under `src/app/(protected)/map/_components/` (colocation convention already used elsewhere). Shared data-layer pieces (queries, sample seed, schema re-exports) go under `src/lib/` alongside existing Prisma/query helpers. Tests live under `tests/skillMap/` matching the existing `tests/` directory. No new top-level directory is introduced.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| II. Offline-First — Skill Map is server-only | Cross-device continuity and reliable persistence for a diagram that has no offline review implications. | Local-only storage (IndexedDB) loses the map on browser data clears and prevents device switching. The review flow (the actual offline-critical path) is untouched. |
