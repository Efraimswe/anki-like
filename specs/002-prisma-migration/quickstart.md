# Quickstart: Prisma Migration Validation

## Prerequisites

- Node.js 20+
- Existing `.env` with `DATABASE_URL` pointing to Neon PostgreSQL
- Existing database with tables from feature 001

## Setup

```bash
npm install
npx prisma generate
```

## Validation Steps

### 1. Verify Prisma Schema Matches Database

```bash
npx prisma db pull --print
# Should output schema matching prisma/schema.prisma
```

### 2. Run Existing Tests

```bash
npm run test:unit
# All 20 SM-2 unit tests should pass
```

### 3. Start Application

```bash
npm run start:dev
```

### 4. Smoke Test All Endpoints (identical to feature 001)

```bash
# Create deck
curl -s -X POST http://localhost:3000/api/v1/decks \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Deck","description":"Prisma migration test"}' | jq .

# Create card
DECK_ID=<id-from-above>
curl -s -X POST http://localhost:3000/api/v1/cards \
  -H "Content-Type: application/json" \
  -d "{\"deckId\":\"$DECK_ID\",\"front\":\"Hello\",\"back\":\"World\",\"type\":\"basic\"}" | jq .

# Get due cards
curl -s http://localhost:3000/api/v1/decks/$DECK_ID/reviews/due | jq .

# Submit review
CARD_ID=<id-from-card>
curl -s -X POST http://localhost:3000/api/v1/reviews \
  -H "Content-Type: application/json" \
  -d "{\"cardId\":\"$CARD_ID\",\"rating\":\"good\"}" | jq .

# Check statistics
curl -s http://localhost:3000/api/v1/statistics | jq .

# Daily limits
curl -s http://localhost:3000/api/v1/settings/daily-limits | jq .
```

### 5. Launch Prisma Studio

```bash
npm run studio
# Opens browser at http://localhost:5555 — verify all tables visible with data
```

### 6. Verify No Raw SQL Remains

```bash
grep -r "this\.db\.query\|this\.db\.getClient\|client\.query" src/ --include="*.ts"
# Should return NO matches
```
