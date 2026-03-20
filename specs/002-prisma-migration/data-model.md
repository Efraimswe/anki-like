# Data Model: Prisma Schema

The Prisma schema maps 1:1 to the existing PostgreSQL tables. Model names use PascalCase with `@@map()` to preserve snake_case table names.

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum CardType {
  basic
  reverse
  cloze
}

enum Phase {
  new
  learning
  review
  relearning
}

model Deck {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String    @db.VarChar(255)
  description String?   @db.Text
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @default(now()) @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  cards Card[]

  @@map("decks")
}

model Card {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  deckId       String    @map("deck_id") @db.Uuid
  front        String    @db.Text
  back         String    @db.Text
  type         CardType  @default(basic)
  tags         String[]  @default([])
  sourceCardId String?   @map("source_card_id") @db.Uuid
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @default(now()) @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  deck       Deck       @relation(fields: [deckId], references: [id])
  sourceCard Card?      @relation("ReverseCards", fields: [sourceCardId], references: [id])
  reverseOf  Card[]     @relation("ReverseCards")
  cardState  CardState?
  reviewLogs ReviewLog[]

  @@index([deckId], map: "idx_cards_deck_id")
  @@index([tags], type: Gin, map: "idx_cards_tags")
  @@map("cards")
}

model CardState {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  cardId      String   @unique @map("card_id") @db.Uuid
  interval    Int      @default(0)
  easeFactor  Decimal  @default(2.5) @map("ease_factor") @db.Decimal(4, 2)
  repetitions Int      @default(0)
  dueDate     DateTime @default(now()) @map("due_date")
  phase       Phase    @default(new)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @default(now()) @updatedAt @map("updated_at")

  card Card @relation(fields: [cardId], references: [id])

  @@map("card_states")
}

model ReviewLog {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  cardId         String   @map("card_id") @db.Uuid
  rating         Int
  intervalBefore Int      @map("interval_before")
  intervalAfter  Int      @map("interval_after")
  easeBefore     Decimal  @map("ease_before") @db.Decimal(4, 2)
  easeAfter      Decimal  @map("ease_after") @db.Decimal(4, 2)
  timeTakenMs    Int?     @map("time_taken_ms")
  createdAt      DateTime @default(now()) @map("created_at")

  card Card @relation(fields: [cardId], references: [id])

  @@index([cardId], map: "idx_review_logs_card_id")
  @@index([createdAt], map: "idx_review_logs_created_at")
  @@map("review_logs")
}

model DailyLimit {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  maxNew     Int      @default(20) @map("max_new")
  maxReviews Int      @default(200) @map("max_reviews")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @default(now()) @updatedAt @map("updated_at")

  @@map("daily_limits")
}

model DailyCounter {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  date        DateTime @unique @db.Date
  newCount    Int      @default(0) @map("new_count")
  reviewCount Int      @default(0) @map("review_count")

  @@map("daily_counters")
}
```

## Key Mapping Notes

| SQL Table | Prisma Model | Notes |
|-----------|-------------|-------|
| decks | Deck | Soft-delete via deletedAt |
| cards | Card | GIN index on tags, self-relation for reverse cards |
| card_states | CardState | 1:1 with Card, CHECK constraints remain at DB level |
| review_logs | ReviewLog | Append-only log |
| daily_limits | DailyLimit | Single row (singleton pattern) |
| daily_counters | DailyCounter | Unique on date, UPSERT pattern |

## DB-Level Constraints (not expressible in Prisma schema)

These remain enforced at the PostgreSQL level:
- `card_states.ease_factor >= 1.3`
- `card_states.interval >= 0 AND interval <= 365`
- `review_logs.rating >= 0 AND rating <= 5`
