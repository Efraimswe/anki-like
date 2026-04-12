# API Route Contracts

**Date**: 2026-03-31

All routes mirror existing NestJS endpoints. Base path: `/api`

## Auth (`/api/auth`)

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| POST | `/auth/sign-up` | `{ email, password, displayName? }` | `{ user, accessToken }` + refresh cookie | No |
| POST | `/auth/sign-in` | `{ email, password }` | `{ user, accessToken }` + refresh cookie | No |
| POST | `/auth/refresh` | (refresh cookie) | `{ accessToken }` + new refresh cookie | No |
| POST | `/auth/sign-out` | (refresh cookie) | `204` | No |

## Decks (`/api/decks`)

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| GET | `/decks` | — | `Deck[]` (with card counts, due counts) | Yes |
| POST | `/decks` | `{ name }` | `Deck` | Yes |
| GET | `/decks/:id` | — | `Deck` (with cards) | Yes |
| PATCH | `/decks/:id` | `{ name? }` | `Deck` | Yes |
| DELETE | `/decks/:id` | — | `204` (soft delete) | Yes |

## Cards (`/api/cards`)

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| POST | `/cards` | `{ deckId, front, back, type, tags? }` | `Card` | Yes |
| PATCH | `/cards/:id` | `{ front?, back?, tags? }` | `Card` | Yes |
| DELETE | `/cards/:id` | — | `204` (soft delete) | Yes |

## Reviews (`/api/reviews`)

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| GET | `/reviews/session/:deckId` | — | `{ cards: Card[], newRemaining, reviewRemaining }` | Yes |
| POST | `/reviews/submit` | `{ cardId, rating, timeTakenMs? }` | `{ card: Card, nextDue }` | Yes |
| GET | `/reviews/daily-limits` | — | `DailyLimit` | Yes |
| PUT | `/reviews/daily-limits` | `{ maxNewCards?, maxReviews? }` | `DailyLimit` | Yes |

## Sessions (`/api/sessions`)

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| GET | `/sessions` | — | `Session[]` | Yes |
| DELETE | `/sessions/:id` | — | `204` | Yes |

## Users (`/api/users`)

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| GET | `/users/me` | — | `User` (without passwordHash) | Yes |
| PATCH | `/users/me` | `{ displayName?, password? }` | `User` | Yes |

## Statistics (`/api/statistics`)

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| GET | `/statistics` | `?period=week\|month\|all` | `{ reviewsPerDay, accuracy, retention, streaks }` | Yes |

## Error Format

All errors return:
```json
{
  "statusCode": 400,
  "message": "Human-readable error",
  "error": "Bad Request"
}
```

## Authentication

- Access token: `Authorization: Bearer <token>` header
- Refresh token: HTTP-only cookie `refresh_token`
- Middleware checks JWT on all `/api/*` routes except `/api/auth/*`
