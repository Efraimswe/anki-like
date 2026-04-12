# Research: TanStack Query Migration + Silent Auth Refresh

## Decision 1: TanStack Query v5 Setup Pattern

**Decision**: Use the `isServer`-based singleton pattern for `QueryClient` in `providers.tsx`.

**Rationale**: `QueryClientProvider` requires a client component but `layout.tsx` is a server component. The singleton pattern (module-level `browserQueryClient`) prevents the cache from being destroyed during React suspense transitions. `useState(() => new QueryClient())` is simpler but loses the cache on re-render.

**Alternatives considered**: `useState` initialization — rejected because React suspense can cause re-renders that recreate the client and wipe the cache.

---

## Decision 2: Query Key Architecture

**Decision**: Key factory pattern (`deckKeys.all`, `deckKeys.detail(id)`, etc.) co-located with `queryOptions()` helper in `/src/lib/queries/` files.

**Rationale**: The `queryOptions()` helper (new in v5) keeps `queryKey` and `queryFn` in one place — prevents drift when the same query is used in components, prefetch calls, and invalidations. Key factories enable fuzzy invalidation: `invalidateQueries({ queryKey: deckKeys.all })` clears all deck-related queries automatically.

**Alternatives considered**: Inline query keys per-component — rejected because key strings scatter across files, making invalidation fragile.

---

## Decision 3: Optimistic Updates Pattern

**Decision**: Full `onMutate` / `onError` / `onSettled` pattern on all mutations that modify list data (create/update/delete decks, cards).

**Rationale**: 
- `onMutate`: `await cancelQueries` → snapshot via `getQueryData` → apply optimistic state via `setQueryData` → return context
- `onError`: rollback using context snapshot
- `onSettled`: always `invalidateQueries` to sync with server truth (covers both success and error paths)

**Alternatives considered**: Update-on-confirm (current approach — wait for server, then setDecks) — rejected because it causes visible flicker on every mutation.

---

## Decision 4: Suspense Strategy

**Decision**: Use standard `useQuery` with `isPending` / `isError` checks for initial migration. Reserve `useSuspenseQuery` for future refactor of page-level data fetching.

**Rationale**: `useSuspenseQuery` removes the `enabled` option and requires `<Suspense>` + `<ErrorBoundary>` wrappers everywhere. It's a bigger refactor than needed now. `useQuery` maps 1:1 to the existing `useEffect`+`useState` pattern.

**v5 status vocabulary**: `status: 'loading'` → `status: 'pending'` / `isPending: true`. `isLoading` now means `isPending && isFetching` (first fetch specifically).

---

## Decision 5: Auth Refresh Strategy

**Decision**: Proactive refresh at 80% of token lifetime (12 min of 15 min) + reactive 401 fallback protected by a module-level refresh lock.

**Rationale**: 
- **Root cause of logouts**: Multiple concurrent requests all get 401 simultaneously, each independently calls `/api/auth/refresh`, causing token rotation conflicts (second refresh sees an already-rotated refresh token → fails → redirect to sign-in).
- **Refresh lock** (`refreshPromise` singleton): If N requests all get 401, only one refresh call is made. Others await the same promise. After the refresh, all N retry with the new cookie.
- **Proactive timer**: Fires at 80% lifetime, uses `token_expiry` non-httpOnly cookie to know when to refresh. Eliminates the 401 flash entirely under normal usage.
- **Middleware refresh**: For hard page navigations near expiry, middleware tries to refresh inline before redirecting to sign-in.

**Alternatives considered**:
- Longer access token lifetime — rejected: security regression
- Reactive refresh only (status quo) — rejected: race condition causes logouts
- Refresh only on user interaction — rejected: background tabs still lose session

---

## Decision 6: token_expiry Cookie

**Decision**: Add a non-httpOnly `token_expiry` cookie (millisecond timestamp) set alongside the access token in `setAuthCookies`.

**Rationale**: The access token is httpOnly and unreadable by JS. The client needs to know expiry to schedule proactive refresh. A plain timestamp number has no security value — it's not a credential. 

**Alternatives considered**: localStorage — rejected: not accessible in middleware/server. `exp` claim in a readable duplicate token — over-engineered.

---

## v4 → v5 Breaking Changes (Reference)

| v4 | v5 |
|---|---|
| `cacheTime` | `gcTime` |
| `status: 'loading'` | `status: 'pending'` |
| `isLoading` | `isPending` (for first-time fetch) |
| `useErrorBoundary` | `throwOnError` |
| `suspense: true` on `useQuery` | Use `useSuspenseQuery` |
| `keepPreviousData` option | `placeholderData: keepPreviousData` |
| `onSuccess`/`onError`/`onSettled` on `useQuery` | **Removed** — only exist on `useMutation` |
