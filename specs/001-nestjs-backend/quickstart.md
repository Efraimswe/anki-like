# Quickstart: Spaced Repetition Backend

## Prerequisites

- Node.js 20+
- PostgreSQL (Neon serverless or local)

## Setup

```bash
# Clone and install
git clone <repo-url> && cd anki-like
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Run migrations
npm run migrate

# Start development server
npm run start:dev
```

## Verify

```bash
# Create a deck
curl -X POST http://localhost:3000/api/v1/decks \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Deck"}'

# Add a card
curl -X POST http://localhost:3000/api/v1/decks/<deck-id>/cards \
  -H "Content-Type: application/json" \
  -d '{"front": "Hello", "back": "World", "type": "basic"}'

# Get due cards
curl http://localhost:3000/api/v1/decks/<deck-id>/reviews/due

# Submit a review
curl -X POST http://localhost:3000/api/v1/reviews \
  -H "Content-Type: application/json" \
  -d '{"cardId": "<card-id>", "rating": "good"}'

# Check statistics
curl http://localhost:3000/api/v1/statistics
```

## Run Tests

```bash
npm run test          # Unit tests
npm run test:e2e      # Integration tests
```
