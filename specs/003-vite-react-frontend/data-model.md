# Data Model: Vite React Frontend

The frontend has no local data model or storage. It consumes the backend REST API and uses TypeScript interfaces to type API responses.

## TypeScript Interfaces (Frontend)

These mirror the backend API response shapes:

### Deck
- `id`: string (UUID)
- `name`: string
- `cardCount`: number
- `dueCount`: number
- `newCount`: number
- `createdAt`: string (ISO date)
- `updatedAt`: string (ISO date)

### Card
- `id`: string (UUID)
- `deckId`: string (UUID)
- `front`: string
- `back`: string
- `type`: "basic" | "reverse" | "cloze"
- `tags`: string[]
- `createdAt`: string (ISO date)
- `updatedAt`: string (ISO date)

### ReviewDueResponse
- `cards`: DueCard[] (id, front, back, type, phase, dueDate)
- `remainingNew`: number
- `remainingReviews`: number
- `nextDueDate`: string | null

### ReviewResult
- `cardId`: string (UUID)
- `previousState`: CardState
- `newState`: CardState

### Statistics
- `retentionRate`: number
- `totalReviews`: number
- `accuracyPercent`: number
- `totalTimeMinutes`: number
- `dailyBreakdown`: DailyStat[]

### DailyLimits
- `maxNewCards`: number
- `maxReviews`: number
- `todayNewCount`: number
- `todayReviewCount`: number

## Notes

- No local persistence — all data fetched from backend on demand
- No caching layer in v1 — simple fetch on mount/action
- Types are derived from the REST API contracts in `specs/001-nestjs-backend/contracts/rest-api.md`
