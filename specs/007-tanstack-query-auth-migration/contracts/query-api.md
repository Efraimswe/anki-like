# Query API Contracts

## Standard Query Options Shape

Every `queryOptions` export follows this contract:

```ts
queryOptions({
  queryKey: [...keyFactory...],   // typed const tuple
  queryFn: () => fetchApi<T>(...), // uses shared fetchApi
  staleTime?: number,             // ms before data is considered stale
  enabled?: boolean,              // conditional fetching
})
```

## Mutation Contract

Every `useMutation` that modifies a list follows:

```ts
useMutation({
  mutationFn: (input) => fetchApi<T>(...),
  onMutate: async (input) => {
    await queryClient.cancelQueries({ queryKey })
    const previous = queryClient.getQueryData(queryKey)
    queryClient.setQueryData(queryKey, optimisticTransform(input))
    return { previous }
  },
  onError: (_err, _input, context) => {
    queryClient.setQueryData(queryKey, context?.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey })
  },
})
```

## Auth Refresh Contract

`attemptRefresh(): Promise<boolean>`
- Returns `true` if refresh succeeded (new cookies set)
- Returns `false` if refresh failed (refresh token invalid/expired)
- Calling multiple times concurrently returns the **same promise** (lock)
- After resolve, `refreshPromise` is reset to `null`

`getTokenExpiry(): number | null`
- Reads `token_expiry` cookie
- Returns Unix timestamp in ms, or `null` if not set
- Used by `AuthProvider` to schedule proactive refresh

## Proactive Refresh Timer Contract

Fires at `(expiry - now) * 0.8` ms from now (80% of remaining lifetime).

On tab hidden (`document.visibilityState === 'hidden'`): defers refresh until tab becomes visible again via `visibilitychange` event.

Re-schedules itself after each successful refresh.
