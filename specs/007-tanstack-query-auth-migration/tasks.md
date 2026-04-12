# Tasks: TanStack Query Migration + Silent Auth Refresh

**Input**: Design documents from `/specs/007-tanstack-query-auth-migration/`
**Branch**: `007-tanstack-query-auth-migration`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and prepare the directory structure

- [x] T001 Install `@tanstack/react-query` and `@tanstack/react-query-devtools` via `pnpm add @tanstack/react-query @tanstack/react-query-devtools`
- [x] T002 [P] Create directory `src/lib/queries/` (will hold all query factories)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Auth client extraction and `token_expiry` cookie — required before any page can use the new query pattern

**⚠️ CRITICAL**: All user story phases depend on this foundation

- [x] T003 Create `src/lib/auth-client.ts` — move `fetchApi` from `src/hooks/use-auth.ts`; add module-level `refreshPromise: Promise<boolean> | null`; implement `attemptRefresh(): Promise<boolean>` (refresh lock — only one concurrent refresh call); update `fetchApi` to call `attemptRefresh()` instead of inline `fetch('/api/auth/refresh')`; export both `fetchApi` and `attemptRefresh` and `getTokenExpiry`
- [x] T004 Add `getTokenExpiry(): number | null` to `src/lib/auth-client.ts` — reads `document.cookie` for `token_expiry` cookie, returns ms timestamp or null
- [x] T005 Update `src/lib/auth.ts` — in `setAuthCookies()` add a non-httpOnly `token_expiry` cookie: value = `String(Date.now() + 15 * 60 * 1000)`, `httpOnly: false`, `sameSite: 'strict'`, `maxAge: 15 * 60`; in `clearAuthCookies()` add `cookieStore.delete('token_expiry')`
- [x] T006 Update `src/hooks/use-auth.ts` — remove the `fetchApi` function body and inline refresh logic; add `export { fetchApi } from '@/lib/auth-client'`; keep `AuthContext`, `AuthContextValue interface`, `useAuth` hook unchanged

**Checkpoint**: `fetchApi` works as before, now with refresh lock. Existing pages unaffected.

---

## Phase 3: User Story 1 — QueryClient Provider + Proactive Refresh Timer (P1) 🎯

**Goal**: Wrap the app with `QueryClientProvider` and start the proactive token refresh timer so users are never logged out during an active session.

**Independent Test**: Open the app, stay idle for 15+ minutes — should remain logged in. Open devtools network tab: a `POST /api/auth/refresh` request should fire ~12 minutes after sign-in without any user action.

### Implementation

- [x] T007 [US1] Update `src/app/providers.tsx` — add `isServer`-based `QueryClient` singleton (`makeQueryClient`, `getQueryClient` using module-level `browserQueryClient`); default options: `staleTime: 60_000`, `gcTime: 5 * 60_000`, `retry: 1`; wrap the return with `<QueryClientProvider client={queryClient}>` around existing providers; add `<ReactQueryDevtools initialIsOpen={false} />` inside the provider
- [x] T008 [US1] Add proactive refresh timer to `AuthProvider` inside `src/app/providers.tsx` — `useEffect` depending on `[user]`; implement `scheduleRefresh()`: reads `getTokenExpiry()`, computes `delay = (expiry - Date.now()) * 0.8`, sets `setTimeout`; on tab hidden (`document.visibilityState === 'hidden'`) defer via `visibilitychange` event; on successful refresh calls `scheduleRefresh()` again; cleanup with `clearTimeout`

**Checkpoint**: `ReactQueryDevtools` panel appears bottom-right. No regressions in auth flow.

---

## Phase 4: User Story 2 — Query Factories (P1)

**Goal**: Establish typed, co-located query key factories and `queryOptions` for every data domain so pages can be migrated consistently.

**Independent Test**: Import `deckListOptions` in a scratch component, call `useQuery(deckListOptions)` — it fetches and returns deck data.

### Implementation

- [x] T009 [P] [US2] Create `src/lib/queries/decks.ts` — export `deckKeys` factory (`all`, `lists()`, `detail(id)`); export `deckListOptions` = `queryOptions({ queryKey: deckKeys.lists(), queryFn: () => fetchApi<Deck[]>('/api/decks') })`; export `deckDetailOptions(id)` = `queryOptions({ queryKey: deckKeys.detail(id), queryFn: () => fetchApi<Deck>('/api/decks/'+id), enabled: !!id })`
- [x] T010 [P] [US2] Create `src/lib/queries/cards.ts` — export `cardKeys` factory (`all`, `list(deckId)`, `detail(id)`); export `cardListOptions(deckId)` querying `/api/cards?deckId=${deckId}`
- [x] T011 [P] [US2] Create `src/lib/queries/reviews.ts` — export `reviewKeys` factory (`all`, `session(deckId)`, `dailyLimits`); export `reviewSessionOptions(deckId)` querying `/api/reviews/session/${deckId}`; export `dailyLimitsOptions` querying `/api/reviews/daily-limits`
- [x] T012 [P] [US2] Create `src/lib/queries/statistics.ts` — export `statisticsKeys` factory (`all`); export `statisticsOptions` querying `/api/statistics`
- [x] T013 [P] [US2] Create `src/lib/queries/user.ts` — export `userKeys` factory (`all`, `me`); export `currentUserOptions` querying `/api/users/me`

**Checkpoint**: All query factory files compile without errors (`pnpm tsc --noEmit`).

---

## Phase 5: User Story 3 — Migrate Decks Page (P1) 🎯

**Goal**: Replace manual `useEffect`+`useState` fetching with `useQuery`; replace all three mutations (create, update, delete) with `useMutation` + full optimistic update pattern.

**Independent Test**: Navigate to `/decks`. Create a deck — list updates instantly before API returns. Delete a deck — it disappears instantly. Rename a deck — updates inline instantly. All rollback correctly if the network tab shows a forced error.

### Implementation

- [x] T014 [US3] Update `src/app/(protected)/decks/page.tsx` — remove `decks`, `loading`, `error` `useState` + `load` function + `useEffect(load)`; add `const { data: decks = [], isPending, isError, error } = useQuery(deckListOptions)` and `const queryClient = useQueryClient()`
- [x] T015 [US3] Add `createDeck` mutation to `src/app/(protected)/decks/page.tsx` — `mutationFn`: `POST /api/decks`; `onMutate`: cancel queries, snapshot `deckKeys.lists()`, prepend optimistic deck `{ id: 'temp-'+Date.now(), name, cardCount:0, dueCount:0, newCount:0 }`, return context; `onError`: restore snapshot; `onSettled`: `invalidateQueries({ queryKey: deckKeys.lists() })`
- [x] T016 [US3] Add `updateDeck` mutation to `src/app/(protected)/decks/page.tsx` — `mutationFn`: `PATCH /api/decks/${id}`; `onMutate`: snapshot + optimistically map deck name in list; `onError`: restore; `onSettled`: invalidate list
- [x] T017 [US3] Add `deleteDeck` mutation to `src/app/(protected)/decks/page.tsx` — `mutationFn`: `DELETE /api/decks/${id}`; `onMutate`: snapshot + optimistically filter deck from list; `onError`: restore; `onSettled`: invalidate list
- [x] T018 [US3] Update JSX in `src/app/(protected)/decks/page.tsx` — replace `if (loading)` with `if (isPending)`; replace `if (error)` with `if (isError)`; replace `fetchApi` mutation calls with `createDeck.mutate(name)`, `updateDeck.mutate({id, name})`, `deleteDeck.mutate(id)`; remove `setDecks` calls from JSX handlers

**Checkpoint**: Decks page works end-to-end with optimistic updates. No loading flash on mutations.

---

## Phase 6: User Story 4 — Migrate Deck Detail Page (P2)

**Goal**: Replace ad-hoc fetching in `/decks/[id]` with `useQuery`; add optimistic mutations for card create/update/delete.

**Independent Test**: Navigate to a deck detail page. Add a card — appears instantly. Edit a card — updates inline instantly. Delete a card — disappears instantly.

### Implementation

- [x] T019 [US4] Update `src/app/(protected)/decks/[id]/page.tsx` — replace `useEffect` fetch with `useQuery(deckDetailOptions(id))` and `useQuery(cardListOptions(id))`; replace card mutations with `useMutation` + `onMutate`/`onError`/`onSettled` on `cardKeys.list(id)`

**Checkpoint**: Deck detail page mutations feel instant with correct rollback on error.

---

## Phase 7: User Story 5 — Migrate Review Page (P2)

**Goal**: Replace review session fetching with `useQuery`; invalidate deck due-counts after each card is reviewed.

**Independent Test**: Start a review session. Submit a card rating — next card loads immediately. Finish the session — navigate to decks page and due count should be updated.

### Implementation

- [x] T020 [US5] Update `src/app/(protected)/review/[deckId]/page.tsx` — replace `useEffect` fetch with `useQuery(reviewSessionOptions(deckId))`; replace submit with `useMutation`: `mutationFn` posts to `/api/reviews/submit`; `onSettled`: `invalidateQueries` on `reviewKeys.session(deckId)`, `reviewKeys.dailyLimits`, and `deckKeys.all` (so due counts refresh)

**Checkpoint**: Review session submits cards and due counts update on the decks list.

---

## Phase 8: User Story 6 — Migrate Statistics + Profile Pages (P3)

**Goal**: Replace remaining two pages' data fetching.

**Independent Test**: Statistics page loads data. Profile page updates display name — reflects change instantly.

### Implementation

- [x] T021 [P] [US6] Update `src/app/(protected)/statistics/page.tsx` — replace `useEffect` fetch with `useQuery(statisticsOptions)`; replace `loading`/`error` state with `isPending`/`isError`
- [x] T022 [P] [US6] Update `src/app/(protected)/settings/profile/page.tsx` — replace `useEffect` fetch with `useQuery(currentUserOptions)`; replace update with `useMutation`: `onSettled` calls `updateUser(data)` from `useAuth()` and `invalidateQueries({ queryKey: userKeys.me })`

**Checkpoint**: All protected pages use TanStack Query.

---

## Phase 9: User Story 7 — Middleware Inline Refresh (P3)

**Goal**: Prevent hard page navigations from redirecting to sign-in when the access token is near expiry.

**Independent Test**: Set token lifetime to 1 minute in `.env.local`, sign in, wait 55 seconds, then hard-navigate to `/decks` — should land on decks, not sign-in.

### Implementation

- [x] T023 [US7] Update `middleware.ts` — in the catch block for access token verification failure on protected page routes, before the `redirect('/sign-in')`: read `refresh_token` cookie; if present, `fetch('/api/auth/refresh', { method: 'POST', headers: { Cookie: 'refresh_token=...' } })`; if `refreshRes.ok`, build `NextResponse.next()` and forward all `Set-Cookie` headers from the refresh response; otherwise fall through to redirect

**Checkpoint**: Hard navigation near expiry succeeds without redirect.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and validation

- [x] T024 [P] Remove now-unused `useState`/`useEffect` imports from migrated page files in `src/app/(protected)/`
- [x] T025 [P] Remove direct `fetchApi` imports from page files — pages should use query factories; ensure all `fetchApi` usage goes through `src/lib/auth-client.ts`
- [x] T026 Run `pnpm tsc --noEmit` and fix any TypeScript errors
- [x] T027 Run `pnpm test && pnpm run lint` and fix any failures
- [x] T028 Validate quickstart checklist from `specs/007-tanstack-query-auth-migration/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundation)**: Depends on Phase 1
- **Phase 3 (QueryClient + Refresh Timer)**: Depends on Phase 2
- **Phase 4 (Query Factories)**: Depends on Phase 1 only — can run in parallel with Phase 3
- **Phase 5 (Decks Page)**: Depends on Phase 3 + Phase 4
- **Phase 6 (Deck Detail)**: Depends on Phase 4 (cards query factory)
- **Phase 7 (Review Page)**: Depends on Phase 4 (review/deck query factories)
- **Phase 8 (Stats + Profile)**: Depends on Phase 4 — can run in parallel with Phases 5–7
- **Phase 9 (Middleware)**: Depends on Phase 2 only — can run in parallel with Phases 5–8
- **Phase 10 (Polish)**: Depends on all prior phases

### Parallel Opportunities

```
Phase 1 (T001, T002) — parallel
     ↓
Phase 2 (T003–T006) — sequential (each depends on previous)
     ↓
Phase 3 (T007, T008) ──────────── Phase 4 (T009–T013, all [P])
     ↓                                       ↓
Phase 5 (T014–T018) ← depends on both 3+4
Phase 6 (T019) ← depends on Phase 4
Phase 7 (T020) ← depends on Phase 4
Phase 8 (T021, T022 [P]) ← depends on Phase 4
Phase 9 (T023) ← depends on Phase 2 only
     ↓
Phase 10 (T024–T028)
```

---

## Implementation Strategy

### MVP (Fix the logout bug first)

1. Phase 1: Setup
2. Phase 2: Foundation (auth-client.ts with refresh lock + token_expiry cookie) ← **fixes logouts**
3. Phase 3: QueryClient + proactive refresh timer ← **prevents future logouts**
4. **STOP and VALIDATE**: Stay logged in for 15+ minutes

### Full Migration (after MVP validated)

5. Phase 4: Query factories
6. Phases 5–8: Migrate pages (can parallelize)
7. Phase 9: Middleware refresh
8. Phase 10: Polish

---

## Notes

- [P] tasks = different files, no inter-dependencies — safe to run concurrently
- Story labels map: US1=QueryClient, US2=Factories, US3=Decks, US4=DeckDetail, US5=Review, US6=Stats/Profile, US7=Middleware
- The logout fix (Phase 2) is independent of TanStack Query — it can ship alone
- Each page migration is independently testable — no need to migrate all pages at once
- Commit after each phase checkpoint
