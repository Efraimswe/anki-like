# Data Model: JWT Auth, Settings & Navigation

## New Entities

### User

| Field        | Type      | Constraints                          |
|--------------|-----------|--------------------------------------|
| id           | UUID      | PK, auto-generated                   |
| email        | String    | Unique, NOT NULL, max 255            |
| passwordHash | String    | NOT NULL                             |
| displayName  | String    | Nullable, max 100                    |
| theme        | String    | NOT NULL, default 'light', enum: light/dark |
| createdAt    | Timestamp | NOT NULL, default now                |
| updatedAt    | Timestamp | NOT NULL, auto-update                |

### Session

| Field        | Type      | Constraints                          |
|--------------|-----------|--------------------------------------|
| id           | UUID      | PK, auto-generated                   |
| userId       | UUID      | FK → User.id, NOT NULL               |
| refreshToken | String    | Unique, NOT NULL (hashed)            |
| deviceInfo   | String    | Nullable (parsed User-Agent)         |
| ipAddress    | String    | Nullable                             |
| lastActiveAt | Timestamp | NOT NULL, default now                |
| createdAt    | Timestamp | NOT NULL, default now                |
| expiresAt    | Timestamp | NOT NULL (7 days from creation)      |

## Modified Entities

### Deck (add userId)

| Field  | Type | Constraints              |
|--------|------|--------------------------|
| userId | UUID | FK → User.id, NOT NULL   |

All existing queries on Deck MUST include `userId` filter.

### Card, CardState, ReviewLog, DailyCounter

Cards inherit user scoping through their Deck relationship (`card.deck.userId`). No direct `userId` column needed on these tables — queries join through Deck.

## Relationships

```
User 1──N Deck
User 1──N Session
Deck 1──N Card       (existing)
Card 1──1 CardState  (existing)
Card 1──N ReviewLog  (existing)
```

## State Transitions

### Session Lifecycle

```
Created (sign-in/sign-up)
  → Active (token refresh updates lastActiveAt)
  → Revoked (user manually revokes from settings)
  → Expired (expiresAt reached, cleanup job or lazy check)
```

## Migration Notes

- Migration MUST truncate all existing data (decks, cards, card_states, review_logs, daily_counters)
- Add `User` and `Session` tables
- Add `user_id` NOT NULL column to `Deck` with FK to `User`
- Existing indexes on Deck should be updated to include `user_id`
