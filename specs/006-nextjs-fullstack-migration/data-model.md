# Data Model: Migrate to Next.js Fullstack App

**Date**: 2026-03-31

## Overview

No schema changes. The existing Prisma schema is moved from `backend/prisma/` to root `prisma/` and used as-is.

## Entities

### User
- `id` (UUID, PK) — auto-generated
- `email` (VARCHAR 255, unique) — login identifier
- `passwordHash` (TEXT) — bcrypt hash
- `displayName` (VARCHAR 100, nullable) — profile display name
- `createdAt`, `updatedAt` (TIMESTAMPTZ)
- **Relations**: has many Decks, has many Sessions

### Session
- `id` (UUID, PK)
- `userId` (UUID, FK → User)
- `refreshToken` (TEXT, unique) — JWT refresh token
- `deviceInfo` (TEXT, nullable) — user agent string
- `ipAddress` (VARCHAR 45, nullable)
- `lastActiveAt`, `createdAt`, `expiresAt` (TIMESTAMPTZ)
- **Relations**: belongs to User

### Deck
- `id` (UUID, PK)
- `userId` (UUID, FK → User)
- `name` (VARCHAR 255)
- `createdAt`, `updatedAt` (TIMESTAMPTZ)
- `deletedAt` (TIMESTAMPTZ, nullable) — soft delete
- **Relations**: belongs to User, has many Cards

### Card
- `id` (UUID, PK)
- `deckId` (UUID, FK → Deck)
- `front`, `back` (TEXT)
- `type` (VARCHAR 10) — basic, reverse, cloze
- `tags` (TEXT[], GIN indexed)
- `sourceCardId` (UUID, nullable, FK → Card) — reverse card link
- `createdAt`, `updatedAt` (TIMESTAMPTZ)
- `deletedAt` (TIMESTAMPTZ, nullable) — soft delete
- **Relations**: belongs to Deck, has one CardState, has many ReviewLogs, self-referencing (reverse cards)

### CardState
- `cardId` (UUID, PK, FK → Card) — 1:1 with Card
- `phase` (VARCHAR 12, default "new") — new/learning/review/relearning
- `interval` (INT, default 0) — days until next review
- `easeFactor` (REAL, default 2.5) — SM-2 ease factor (floor 1.3)
- `repetitions` (INT, default 0)
- `learningStep` (INT, default 0) — current position in learning steps
- `dueDate` (TIMESTAMPTZ)
- `updatedAt` (TIMESTAMPTZ)

### ReviewLog
- `id` (UUID, PK)
- `cardId` (UUID, FK → Card)
- `rating` (SMALLINT) — 0 (Again), 2 (Hard), 3 (Good), 5 (Easy)
- `intervalBefore`, `intervalAfter` (INT)
- `easeBefore`, `easeAfter` (REAL)
- `timeTakenMs` (INT, nullable)
- `reviewedAt` (TIMESTAMPTZ)

### DailyLimit
- `id` (UUID, PK)
- `userId` (UUID, unique) — one per user
- `maxNewCards` (INT, default 20)
- `maxReviews` (INT, default 200)
- `updatedAt` (TIMESTAMPTZ)

### DailyCounter
- `id` (UUID, PK)
- `userId` (UUID)
- `date` (DATE, default CURRENT_DATE)
- `newCount`, `reviewCount` (INT, default 0)
- **Unique constraint**: (userId, date)

## State Transitions

```
Card Phase Lifecycle:
  new → learning → review ↔ relearning
                     ↑         |
                     └─────────┘

  - New card first reviewed → enters "learning" phase
  - Learning card completes all steps → graduates to "review"
  - Review card rated Again → enters "relearning"
  - Relearning card completes steps → returns to "review"
```

## Migration Notes

- No database migration needed — schema is unchanged
- Prisma schema file physically moves from `backend/prisma/` to `prisma/`
- `DATABASE_URL` env var remains the same
- All existing migrations in `backend/prisma/migrations/` move to `prisma/migrations/`
