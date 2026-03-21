# API Contract: Review Endpoints (Modified)

## GET /api/v1/reviews/due/:deckId (modified response)

Each due card now includes `intervalHints` — projected intervals for each rating.

```json
{
  "cards": [
    {
      "id": "uuid",
      "front": "Hello",
      "back": "World",
      "type": "basic",
      "phase": "learning",
      "dueDate": "2026-03-20T10:05:00Z",
      "intervalHints": {
        "again": "1m",
        "hard": "6m",
        "good": "10m",
        "easy": "4d"
      }
    }
  ]
}
```

## POST /api/v1/reviews (unchanged request, modified response)

Request body unchanged:
```json
{
  "cardId": "uuid",
  "rating": "again",
  "timeTakenMs": 5000
}
```

Response now includes interval hints for the next card (if any) and the scheduled interval in human-readable format:
```json
{
  "cardId": "uuid",
  "previousState": { "phase": "review", "interval": 43200, "easeFactor": 2.5, "repetitions": 3 },
  "newState": { "phase": "relearning", "interval": 1, "easeFactor": 2.04, "repetitions": 0, "dueDate": "2026-03-20T10:01:00Z" },
  "intervalDisplay": "1m"
}
```

## Interval Display Format

| Range | Format | Examples |
|-------|--------|---------|
| < 60 min | `{n}m` | "1m", "10m", "30m" |
| 1-23 hours | `{n}h` | "1h", "6h" |
| 1-30 days | `{n}d` | "1d", "4d", "15d" |
| 1-12 months | `{n}mo` | "1mo", "3mo" |
| 1+ years | `{n}y` | "1y" |
