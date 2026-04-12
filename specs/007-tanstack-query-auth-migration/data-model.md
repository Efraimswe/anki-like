# Data Model: TanStack Query Migration

No new database entities are introduced by this feature. The changes are purely in client-side state management and auth session handling.

## Query Key Taxonomy

```
['decks']                          → all deck queries (invalidation root)
['decks', 'list']                  → deck list
['decks', 'detail', deckId]        → single deck
['cards', 'list', deckId]          → cards for a deck
['reviews', 'session', deckId]     → active review session
['statistics']                     → statistics data
['daily-limits']                   → daily limits
['user', 'me']                     → current user profile
```

## New Client-Side Constructs

### Query Factories (src/lib/queries/)

```ts
// One file per domain:
src/lib/queries/decks.ts       → deckKeys, deckListOptions, deckDetailOptions
src/lib/queries/cards.ts       → cardKeys, cardListOptions
src/lib/queries/reviews.ts     → reviewKeys, reviewSessionOptions
src/lib/queries/statistics.ts  → statisticsKeys, statisticsOptions
src/lib/queries/user.ts        → userKeys, currentUserOptions
```

### Auth Client Module (src/lib/auth-client.ts)

Extracted from `use-auth.ts` to be shareable between `fetchApi` and `AuthProvider`:

```ts
// Module-level state
let refreshPromise: Promise<boolean> | null     // refresh lock
function getTokenExpiry(): number | null        // reads token_expiry cookie
export function attemptRefresh(): Promise<boolean>
export async function fetchApi<T>(url, options?): Promise<T>
```

### Cookie: token_expiry

- **Type**: Non-httpOnly, `SameSite=Strict`
- **Value**: Unix timestamp in milliseconds (e.g., `1744483200000`)
- **Lifetime**: Same as access token (15 minutes)
- **Purpose**: Enables client-side proactive refresh scheduling
- **Set by**: `setAuthCookies()` in `src/lib/auth.ts`
- **Cleared by**: `clearAuthCookies()` in `src/lib/auth.ts`
