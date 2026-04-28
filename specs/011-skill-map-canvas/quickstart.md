# Quickstart — Skill Map Canvas

A condensed run-through for anyone picking up this feature mid-flight.

## What you're building

A new top-level page at `/map` showing an infinite FigJam-style canvas. Users place stickies / text / shapes and draw connectors. One map per user, autosaved.

Entry point: a new "Progress" item in the existing sidebar (under a new "Insights" section, tagged with a small NEW pill).

## Key files you'll touch

- **Schema**: `prisma/schema.prisma` — add `SkillMap` model + `User.skillMap` relation. Run `prisma migrate dev --name add_skill_map`.
- **API**: `src/app/api/map/route.ts` — `GET` (load-or-seed) + `PUT` (validated replace).
- **Page**: `src/app/(protected)/map/page.tsx` — server component, prefetches via TanStack Query.
- **Canvas**: `src/app/(protected)/map/_components/SkillMapCanvas.tsx` — pan/zoom + node/edge rendering + tool routing.
- **Geometry**: `src/app/(protected)/map/_components/geometry.ts` — `portPoint`, `orthoRoute`, `nearestSideToPoint`, `hitTestEdge`.
- **Doc state**: `src/app/(protected)/map/_components/useSkillMapDoc.ts` — reducer + undo stack + debounced mutation.
- **Sample seed**: `src/lib/skillMap/sample.ts` — `SAMPLE_NODES` + `SAMPLE_EDGES`.
- **Sidebar**: `src/components/layout/AppLayout.tsx` — add Insights group + Progress link + NEW pill. Add locale keys to `messages/`.

## The non-obvious rules

1. **Ports are sticky.** An edge is anchored to exactly one side on each end. When a node moves, the edge stays on that side even if the path looks awkward. Never auto-reroute.
2. **Ortho bend axis is locked at mousedown.** Read the axis from the stable segment descriptor (derived from port sides), NOT from rendered geometry. Otherwise the axis flips mid-drag. See `research.md` Decision 3.
3. **`segOverrides[i]` is a scalar.** Not a list of points. Idempotent. Avoids bend multiplication.
4. **Undo snapshots go at action boundaries.** Not per mousemove frame. Cap at 80.
5. **Empty state means the server returned no row.** Don't re-seed after a user has deleted everything — the row (with empty arrays) already exists at that point.
6. **Canvas mousedown in edit-mode must NOT start a drag.** Gate with `!editing`.
7. **Delete cascades edges.** Any edge touching a deleted node is removed in the same action.
8. **Endpoint drop on empty space reverts.** Never orphan edges.

## Manual smoke test (post-impl)

1. Sign in as a fresh user, click **Progress** in the sidebar → lands on `/map` showing the sample layout.
2. Pan with Space-drag, zoom with Ctrl+wheel, reset view.
3. Place one sticky, one text, one shape. Connect sticky→shape with a straight connector; toggle to ortho; draw another ortho connector; drag a bend handle.
4. Marquee-select a few nodes, delete → connectors disappear too. Undo → everything back. Redo → gone again.
5. Edit the sticky text (double-click, type, blur). Wait ~1s, reload → text persists.
6. Open the same account in a second tab. Edit in tab 1. Reload tab 2 → sees tab 1's state.
7. Toggle dark mode → canvas bg + dot grid + connector stroke switch; sticky/shape fills stay vivid.

## Running locally

```bash
pnpm install
pnpm prisma migrate dev          # apply the new migration
pnpm dev                          # http://localhost:3000/map
pnpm test                         # vitest unit tests (geometry, schema, reducer, api contract)
```

## If things go wrong

- **"Cannot find Edge referenced node"** on PUT: client sent an edge whose `from`/`to` does not exist in `nodes`. Likely a delete-cascade bug in the reducer. See `data-model.md` state transitions.
- **Bend flips mid-drag**: you're reading axis from current path geometry. Fix per research Decision 3.
- **Save fires on every keystroke**: debounce is not wrapped correctly or dep array is wrong. Should be one mutation per ~500ms idle.
- **First-time user sees an empty canvas**: API is writing the row on first GET. Don't — return the seed body without persisting.

## Out of scope (do not build)

- Multiple maps per user
- Real-time collaboration / presence
- Comments, reactions
- Image / media nodes
- PNG/PDF export
