# Quickstart: TanStack Query Migration

## Install dependencies

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

## Verify setup

After implementation, open the app and check:
1. React Query devtools panel appears (bottom-right button)
2. Queries appear in devtools when navigating to decks/review pages
3. Create a deck → list updates instantly (optimistic)
4. Delete a deck → it disappears instantly (optimistic)
5. Stay on the app for 15+ minutes → should NOT be logged out

## Key files changed

| File | Change |
|---|---|
| `src/app/providers.tsx` | Add `QueryClientProvider`, auth proactive refresh timer |
| `src/lib/auth-client.ts` | New: `fetchApi`, `attemptRefresh`, `getTokenExpiry` (extracted from use-auth.ts) |
| `src/lib/auth.ts` | Add `token_expiry` non-httpOnly cookie |
| `src/hooks/use-auth.ts` | Re-export from auth-client.ts; keep `AuthContext`, `useAuth` |
| `src/lib/queries/decks.ts` | New: key factory + queryOptions |
| `src/lib/queries/cards.ts` | New: key factory + queryOptions |
| `src/lib/queries/reviews.ts` | New: key factory + queryOptions |
| `src/lib/queries/statistics.ts` | New: key factory + queryOptions |
| `src/lib/queries/user.ts` | New: key factory + queryOptions |
| `src/app/(protected)/decks/page.tsx` | Replace useState/useEffect with useQuery/useMutation |
| `src/app/(protected)/decks/[id]/page.tsx` | Replace useState/useEffect with useQuery/useMutation |
| `src/app/(protected)/review/[deckId]/page.tsx` | Replace useState/useEffect with useQuery/useMutation |
| `src/app/(protected)/statistics/page.tsx` | Replace useState/useEffect with useQuery |
| `src/app/(protected)/settings/profile/page.tsx` | Replace useState/useEffect with useQuery/useMutation |
| `middleware.ts` | Add inline refresh attempt before redirect on page routes |
