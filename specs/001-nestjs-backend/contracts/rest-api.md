# REST API Contracts

Base URL: `/api/v1`

All responses use JSON. Errors return `{ "statusCode": number, "message": string }`.

---

## Decks

### POST /decks
Create a new deck.

**Request body**:
```json
{ "name": "Spanish Vocab" }
```

**Response** `201`:
```json
{
  "id": "uuid",
  "name": "Spanish Vocab",
  "createdAt": "2026-03-19T00:00:00Z"
}
```

### GET /decks
List all decks (excludes soft-deleted).

**Response** `200`:
```json
[
  { "id": "uuid", "name": "Spanish Vocab", "cardCount": 42, "dueCount": 5, "createdAt": "..." }
]
```

### GET /decks/:id
Get a single deck with summary stats.

**Response** `200`:
```json
{
  "id": "uuid",
  "name": "Spanish Vocab",
  "cardCount": 42,
  "dueCount": 5,
  "newCount": 10,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### PATCH /decks/:id
Update deck name.

**Request body**:
```json
{ "name": "Updated Name" }
```

**Response** `200`: Updated deck object.

### DELETE /decks/:id
Soft-delete a deck and all its cards.

**Response** `204`: No content.

---

## Cards

### POST /decks/:deckId/cards
Create a card in a deck. For type "reverse", two cards are auto-generated.

**Request body**:
```json
{
  "front": "Hola",
  "back": "Hello",
  "type": "basic",
  "tags": ["greetings"]
}
```

**Response** `201`: Created card(s).
- For "basic" and "cloze": single card object
- For "reverse": array of two card objects

```json
{
  "id": "uuid",
  "deckId": "uuid",
  "front": "Hola",
  "back": "Hello",
  "type": "basic",
  "tags": ["greetings"],
  "createdAt": "..."
}
```

### GET /decks/:deckId/cards
List cards in a deck. Supports query params:
- `?tag=greetings` — filter by tag
- `?page=1&limit=50` — pagination (default limit 50)

**Response** `200`: Array of card objects with pagination metadata.

### GET /cards?tag=greetings
Query cards by tag across all decks.

**Response** `200`: Array of card objects.

### GET /cards/:id
Get a single card with its current review state.

**Response** `200`:
```json
{
  "id": "uuid",
  "deckId": "uuid",
  "front": "Hola",
  "back": "Hello",
  "type": "basic",
  "tags": ["greetings"],
  "state": {
    "phase": "review",
    "interval": 6,
    "easeFactor": 2.5,
    "repetitions": 2,
    "dueDate": "2026-03-25T00:00:00Z"
  },
  "createdAt": "...",
  "updatedAt": "..."
}
```

### PATCH /cards/:id
Update card content (front, back, tags). Does not affect review state.

**Request body**:
```json
{ "front": "Updated front", "tags": ["updated-tag"] }
```

**Response** `200`: Updated card object.

### DELETE /cards/:id
Soft-delete a card.

**Response** `204`: No content.

---

## Reviews

### GET /decks/:deckId/reviews/due
Get due cards for a deck, respecting daily limits.

**Query params**:
- `?limit=20` — max cards to return (default: remaining daily allowance)

**Response** `200`:
```json
{
  "cards": [
    {
      "id": "uuid",
      "front": "Hola",
      "back": "Hello",
      "type": "basic",
      "phase": "review",
      "dueDate": "2026-03-19T00:00:00Z"
    }
  ],
  "remainingNew": 15,
  "remainingReviews": 180,
  "nextDueDate": "2026-03-20T00:00:00Z"
}
```

If no cards are due, `cards` is empty and `nextDueDate` indicates when the next card becomes due.

### POST /reviews
Submit a review for a card.

**Request body**:
```json
{
  "cardId": "uuid",
  "rating": "good",
  "timeTakenMs": 5000
}
```

Rating values: `"again"`, `"hard"`, `"good"`, `"easy"`

**Response** `200`:
```json
{
  "cardId": "uuid",
  "previousState": {
    "phase": "learning",
    "interval": 1,
    "easeFactor": 2.5,
    "repetitions": 0
  },
  "newState": {
    "phase": "review",
    "interval": 6,
    "easeFactor": 2.6,
    "repetitions": 2,
    "dueDate": "2026-03-25T00:00:00Z"
  }
}
```

**Error** `429` if daily limit reached.

---

## Daily Limits

### GET /settings/daily-limits
Get current daily limit configuration and today's counters.

**Response** `200`:
```json
{
  "maxNewCards": 20,
  "maxReviews": 200,
  "todayNewCount": 5,
  "todayReviewCount": 42
}
```

### PATCH /settings/daily-limits
Update daily limits.

**Request body**:
```json
{ "maxNewCards": 10, "maxReviews": 150 }
```

**Response** `200`: Updated limits object.

---

## Statistics

### GET /statistics
Get study statistics. Supports optional date range.

**Query params**:
- `?from=2026-03-01&to=2026-03-19` — optional date range (defaults to all-time)

**Response** `200`:
```json
{
  "retentionRate": 85.5,
  "totalReviews": 1250,
  "accuracyPercent": 78.2,
  "totalTimeMinutes": 420,
  "dailyBreakdown": [
    { "date": "2026-03-19", "reviews": 45, "timeMinutes": 15, "accuracy": 82.0 }
  ]
}
```
