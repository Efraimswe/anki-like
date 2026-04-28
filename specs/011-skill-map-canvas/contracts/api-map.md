# API Contract — `/api/map`

Base path: `/api/map` (Next.js App Router route handler).

Auth: session required (same mechanism as other `(protected)` routes — JWT cookie verified in `middleware.ts` and/or via `getSessionFromRequest()`). Unauthenticated → **401**.

## `GET /api/map`

Load the current user's Skill Map. If no row exists, return the seeded sample **without** writing to the database.

**Request**: no body.

**200 Response**:

```json
{
  "title": "My Skill Map",
  "nodes": [
    {
      "id": "n_abc",
      "type": "shape",
      "x": 40, "y": 80, "w": 200, "h": 120,
      "text": "SPEAKING",
      "shape": "rect",
      "fill": "shape-amber"
    }
  ],
  "edges": [
    {
      "id": "e_xyz",
      "from": "n_abc",
      "fromSide": "r",
      "to": "n_def",
      "toSide": "l",
      "kind": "straight"
    }
  ],
  "updatedAt": "2026-04-22T10:00:00.000Z",
  "isSeed": true
}
```

- `isSeed: true` iff the payload is the seeded sample (no row existed). The client uses this hint only to label telemetry; it is NOT required to branch rendering on it.

**401**: unauthenticated.

## `PUT /api/map`

Replace the current user's map with the provided document. First call for a user creates the row; subsequent calls update it.

**Request body**:

```ts
{
  title: string;       // 1..255 chars
  nodes: Node[];       // ≤ 2000, see schemas.ts
  edges: Edge[];       // ≤ 4000, see schemas.ts
}
```

**200 Response**:

```json
{
  "title": "My Skill Map",
  "nodes": [ ... ],
  "edges": [ ... ],
  "updatedAt": "2026-04-22T10:00:00.000Z"
}
```

**422 Response** (validation failure):

```json
{
  "error": "invalid_payload",
  "issues": [ { "path": ["nodes", 0, "type"], "message": "Invalid enum value." } ]
}
```

Validation failures include: exceeding caps, orphan edge references (Edge.from or Edge.to not present in Nodes), invalid discriminator, non-finite numeric coordinates, oversize strings.

**On validation failure, the persisted row is not modified.**

**401**: unauthenticated.

## Caching

- GET and PUT both set `Cache-Control: no-store` (per-user mutable data).
- Client uses TanStack Query cache keyed by `['skillMap', userId]`. Mutation invalidates on success; failures keep the local optimistic state and retry.

## Rate Limiting / Guardrails

- Hard caps (2000 / 4000) are the only server-side guard in Phase 1.
- No explicit rate limiter in Phase 1 — autosave debounce keeps request rate ≤ ~2 rps per user under realistic editing.

## Status Matrix

| Case | Response |
|---|---|
| Authed, first GET, no row | 200 + seeded body, `isSeed: true` |
| Authed, GET after any PUT | 200 + persisted body, `isSeed: false` |
| Authed, PUT with valid body | 200 + echo |
| Authed, PUT with invalid body | 422 + issues; prior row intact |
| Unauthed | 401 |
| Method not allowed | 405 |
