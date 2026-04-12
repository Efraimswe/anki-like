# Implementation Plan: TanStack Query Migration + Silent Auth Refresh

**Branch**: `007-tanstack-query-auth-migration` | **Date**: 2026-04-12 | **Spec**: `specs/007-tanstack-query-auth-migration/`

## Summary

Replace the ad-hoc `useEffect`+`useState` data fetching pattern and manual optimistic updates with TanStack Query v5. Simultaneously fix the 15-minute logout bug by replacing reactive-only refresh with a proactive refresh timer + module-level refresh lock that eliminates the race condition.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20+
**Primary Dependencies**: Next.js 15, React 19, `@tanstack/react-query` v5, `@tanstack/react-query-devtools`, Prisma, jose (JWT)
**Storage**: PostgreSQL via Prisma (unchanged)
**Testing**: pnpm test (existing suite)
**Target Platform**: Web (Next.js App Router, client components)
**Performance Goals**: Review flow stays under 200ms (constitution §V); list mutations feel instant (optimistic)
**Constraints**: No new DB schema changes; keep httpOnly access token; offline-first principle applies

## Constitution Check

| Principle | Status | Notes |
|---|---|---|
| I. Algorithm Correctness | ✅ PASS | No scheduling logic touched |
| II. Offline-First | ⚠️ CONDITIONAL | TanStack Query caches data in memory — not persisted. Acceptable for now per constitution (sync is Phase 2) |
| III. Test-First | ✅ PASS | Query factories and auth-client.ts are pure functions — unit testable |
| IV. Data Integrity | ✅ PASS | Optimistic rollback on error preserves integrity |
| V. Critical Path UX | ✅ IMPROVEMENT | Review page load improves; no spinners on mutations |
| VI. Simplicity | ✅ PASS | Replaces more complex manual patterns; library is well-known |

## Project Structure

```text
specs/007-tanstack-query-auth-migration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── query-api.md

src/
├── lib/
│   ├── auth-client.ts          ← NEW: fetchApi + refresh lock + proactive refresh
│   ├── auth.ts                 ← MODIFY: add token_expiry cookie
│   └── queries/                ← NEW directory
│       ├── decks.ts
│       ├── cards.ts
│       ├── reviews.ts
│       ├── statistics.ts
│       └── user.ts
├── hooks/
│   └── use-auth.ts             ← MODIFY: re-export from auth-client.ts
└── app/
    ├── providers.tsx            ← MODIFY: add QueryClientProvider + proactive refresh
    └── (protected)/
        ├── decks/
        │   ├── page.tsx         ← MODIFY: useQuery + useMutation
        │   └── [id]/page.tsx    ← MODIFY: useQuery + useMutation
        ├── review/[deckId]/page.tsx  ← MODIFY: useQuery + useMutation
        ├── statistics/page.tsx       ← MODIFY: useQuery
        └── settings/profile/page.tsx ← MODIFY: useQuery + useMutation
```

## Phase 1: Foundation

### Task 1.1 — Install dependencies

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

### Task 1.2 — Create `src/lib/auth-client.ts`

Extract `fetchApi` from `use-auth.ts` into a new module. Add:
- Module-level `refreshPromise: Promise<boolean> | null` (refresh lock)
- `getTokenExpiry(): number | null` — reads `token_expiry` cookie
- `attemptRefresh(): Promise<boolean>` — single shared refresh call
- Updated `fetchApi<T>` — uses `attemptRefresh()` instead of inline `fetch('/api/auth/refresh')`

Key change in `fetchApi` on 401:
```ts
const refreshed = await attemptRefresh();
if (refreshed) { /* retry */ }
else { /* redirect to sign-in */ }
```

### Task 1.3 — Update `src/lib/auth.ts`

In `setAuthCookies()`, add after setting the access token:
```ts
cookieStore.set('token_expiry', String(Date.now() + 15 * 60 * 1000), {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 15 * 60,
});
```

In `clearAuthCookies()`:
```ts
cookieStore.delete('token_expiry');
```

### Task 1.4 — Update `src/hooks/use-auth.ts`

Remove the `fetchApi` function body and the inline refresh logic. Import and re-export from `auth-client.ts`:
```ts
export { fetchApi } from '@/lib/auth-client';
```
Keep `AuthContext`, `AuthContextValue`, `useAuth` unchanged.

### Task 1.5 — Update `src/app/providers.tsx`

1. Add `QueryClientProvider` wrapping children using `isServer` singleton pattern:
```ts
import { isServer, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60_000, gcTime: 5 * 60_000, retry: 1 },
    },
  });
}
let browserQueryClient: QueryClient | undefined;
function getQueryClient() {
  if (isServer) return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
```

2. Add proactive refresh timer inside `AuthProvider` (after user is loaded):
```ts
import { attemptRefresh, getTokenExpiry } from '@/lib/auth-client';

useEffect(() => {
  if (!user) return;
  let timerId: ReturnType<typeof setTimeout>;

  function scheduleRefresh() {
    const expiry = getTokenExpiry();
    if (!expiry) return;
    const delay = (expiry - Date.now()) * 0.8;
    if (delay <= 0) {
      attemptRefresh().then((ok) => { if (ok) scheduleRefresh(); });
      return;
    }
    timerId = setTimeout(() => {
      if (document.visibilityState === 'hidden') {
        const onVisible = () => {
          document.removeEventListener('visibilitychange', onVisible);
          attemptRefresh().then((ok) => { if (ok) scheduleRefresh(); });
        };
        document.addEventListener('visibilitychange', onVisible);
        return;
      }
      attemptRefresh().then((ok) => { if (ok) scheduleRefresh(); });
    }, delay);
  }

  scheduleRefresh();
  return () => clearTimeout(timerId);
}, [user]);
```

3. Wrap root with `QueryClientProvider`:
```tsx
<QueryClientProvider client={queryClient}>
  <ThemeProvider>
    <AuthProvider>
      {children}
      <SelectionTranslateOverlay />
    </AuthProvider>
  </ThemeProvider>
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

## Phase 2: Query Factories

### Task 2.1 — `src/lib/queries/decks.ts`

```ts
import { queryOptions } from '@tanstack/react-query';
import { fetchApi } from '@/lib/auth-client';
import type { Deck } from '@/types';

export const deckKeys = {
  all: ['decks'] as const,
  lists: () => [...deckKeys.all, 'list'] as const,
  detail: (id: string) => [...deckKeys.all, 'detail', id] as const,
};

export const deckListOptions = queryOptions({
  queryKey: deckKeys.lists(),
  queryFn: () => fetchApi<Deck[]>('/api/decks'),
});

export const deckDetailOptions = (id: string) => queryOptions({
  queryKey: deckKeys.detail(id),
  queryFn: () => fetchApi<Deck>(`/api/decks/${id}`),
  enabled: !!id,
});
```

### Task 2.2 — `src/lib/queries/cards.ts`

Keys: `['cards', 'list', deckId]`, `['cards', 'detail', cardId]`
Query fn: `fetchApi<Card[]>('/api/cards?deckId=...')`

### Task 2.3 — `src/lib/queries/reviews.ts`

Keys: `['reviews', 'session', deckId]`, `['reviews', 'daily-limits']`
Query fn: `fetchApi<ReviewSession>('/api/reviews/session/...')`

### Task 2.4 — `src/lib/queries/statistics.ts`

Keys: `['statistics']`
Query fn: `fetchApi<Statistics>('/api/statistics')`

### Task 2.5 — `src/lib/queries/user.ts`

Keys: `['user', 'me']`
Query fn: `fetchApi<User>('/api/users/me')`

## Phase 3: Migrate Pages

### Task 3.1 — `src/app/(protected)/decks/page.tsx`

Replace `useState<Deck[]>` + `useEffect(load)` with `useQuery(deckListOptions)`.

Replace `handleCreate`:
```ts
const createDeck = useMutation({
  mutationFn: (name: string) => fetchApi<Deck>('/api/decks', { method: 'POST', body: JSON.stringify({ name }) }),
  onMutate: async (name) => {
    await queryClient.cancelQueries({ queryKey: deckKeys.lists() });
    const previous = queryClient.getQueryData(deckKeys.lists());
    queryClient.setQueryData(deckKeys.lists(), (old: Deck[] = []) => [
      { id: 'temp-' + Date.now(), name, cardCount: 0, dueCount: 0, newCount: 0 },
      ...old,
    ]);
    return { previous };
  },
  onError: (_err, _name, ctx) => queryClient.setQueryData(deckKeys.lists(), ctx?.previous),
  onSettled: () => queryClient.invalidateQueries({ queryKey: deckKeys.lists() }),
});
```

Replace `handleUpdate` similarly (optimistic map over list).
Replace `handleDelete` similarly (optimistic filter from list).

Remove local `loading`, `error`, `decks` state — use `isPending`, `isError`, `error`, `data` from `useQuery`.

### Task 3.2 — `src/app/(protected)/decks/[id]/page.tsx`

Replace `useEffect` with `useQuery(deckDetailOptions(id))`.
Replace card mutations with `useMutation` + optimistic updates on `['cards', 'list', id]`.

### Task 3.3 — `src/app/(protected)/review/[deckId]/page.tsx`

Replace review session fetch with `useQuery(reviewSessionOptions(deckId))`.
Replace submit mutation with `useMutation` — on settle invalidate `['reviews', 'session', deckId]` and `['daily-limits']` and `['decks']` (due counts change).

### Task 3.4 — `src/app/(protected)/statistics/page.tsx`

Replace `useEffect` with `useQuery(statisticsOptions)`. No mutations needed.

### Task 3.5 — `src/app/(protected)/settings/profile/page.tsx`

Replace profile fetch with `useQuery(currentUserOptions)`.
Replace update mutation with `useMutation` — on settle call `updateUser(data)` from `AuthContext` and invalidate `['user', 'me']`.

## Phase 4: Middleware Refresh

### Task 4.1 — Update `middleware.ts`

In the catch block for access token verification failure on protected page routes, before redirecting to sign-in, attempt an inline refresh:

```ts
} catch {
  const refreshToken = request.cookies.get('refresh_token')?.value;
  if (refreshToken) {
    const refreshUrl = new URL('/api/auth/refresh', request.url);
    const refreshRes = await fetch(refreshUrl, {
      method: 'POST',
      headers: { Cookie: `refresh_token=${refreshToken}` },
    });
    if (refreshRes.ok) {
      const response = NextResponse.next();
      refreshRes.headers.getSetCookie().forEach((cookie) => {
        response.headers.append('Set-Cookie', cookie);
      });
      return response;
    }
  }
  return NextResponse.redirect(new URL('/sign-in', request.url));
}
```

Note: This only applies to page route navigation. API routes continue to rely on the client-side refresh lock.

## Complexity Tracking

No constitution violations. All changes align with Principle V (Critical Path UX — faster mutations) and Principle VI (Simplicity — replacing manual patterns with a standard library).
