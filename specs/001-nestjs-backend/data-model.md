# Data Model: Spaced Repetition Backend

## Entity Relationship

```
Deck 1──* Card 1──1 CardState
                Card 1──* ReviewLog
```

## Tables

### decks

| Column     | Type         | Constraints                  |
|------------|--------------|------------------------------|
| id         | UUID         | PK, DEFAULT gen_random_uuid() |
| name       | VARCHAR(255) | NOT NULL                     |
| created_at | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()      |
| updated_at | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()      |
| deleted_at | TIMESTAMPTZ  | NULL (soft-delete)           |

### cards

| Column         | Type         | Constraints                  |
|----------------|--------------|------------------------------|
| id             | UUID         | PK, DEFAULT gen_random_uuid() |
| deck_id        | UUID         | FK → decks(id), NOT NULL     |
| front          | TEXT         | NOT NULL                     |
| back           | TEXT         | NOT NULL                     |
| type           | VARCHAR(10)  | NOT NULL, CHECK IN ('basic', 'reverse', 'cloze') |
| tags           | TEXT[]       | DEFAULT '{}'                 |
| source_card_id | UUID         | FK → cards(id), NULL (set for reverse-generated cards) |
| created_at     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()      |
| updated_at     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()      |
| deleted_at     | TIMESTAMPTZ  | NULL (soft-delete)           |

**Indexes**: `idx_cards_deck_id` on (deck_id) WHERE deleted_at IS NULL; `idx_cards_tags` GIN on (tags)

**Notes**:
- Reverse card creation produces two rows with type='basic', linked via `source_card_id`
- Cloze content uses `{{answer}}` syntax in the `front` field; `back` stores the full revealed text

### card_states

| Column      | Type         | Constraints                  |
|-------------|--------------|------------------------------|
| card_id     | UUID         | PK, FK → cards(id)          |
| phase       | VARCHAR(12)  | NOT NULL, DEFAULT 'new', CHECK IN ('new', 'learning', 'review', 'relearning') |
| interval    | INTEGER      | NOT NULL, DEFAULT 0 (days)   |
| ease_factor | REAL         | NOT NULL, DEFAULT 2.5        |
| repetitions | INTEGER      | NOT NULL, DEFAULT 0          |
| due_date    | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()      |
| updated_at  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()      |

**Indexes**: `idx_card_states_due_date` on (due_date) — used for due card queries

**Constraints**: `CHECK (ease_factor >= 1.3)`, `CHECK (interval >= 0)`, `CHECK (interval <= 365)`

### review_logs

| Column     | Type        | Constraints                  |
|------------|-------------|------------------------------|
| id         | UUID        | PK, DEFAULT gen_random_uuid() |
| card_id    | UUID        | FK → cards(id), NOT NULL     |
| rating     | SMALLINT    | NOT NULL, CHECK IN (0, 2, 3, 5) |
| interval_before | INTEGER | NOT NULL                   |
| interval_after  | INTEGER | NOT NULL                   |
| ease_before     | REAL    | NOT NULL                   |
| ease_after      | REAL    | NOT NULL                   |
| time_taken_ms   | INTEGER | NULL                       |
| reviewed_at     | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()  |

**Indexes**: `idx_review_logs_card_id` on (card_id); `idx_review_logs_reviewed_at` on (reviewed_at)

### daily_limits

| Column          | Type        | Constraints                  |
|-----------------|-------------|------------------------------|
| id              | UUID        | PK, DEFAULT gen_random_uuid() |
| max_new_cards   | INTEGER     | NOT NULL, DEFAULT 20         |
| max_reviews     | INTEGER     | NOT NULL, DEFAULT 200        |
| updated_at      | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()      |

### daily_counters

| Column       | Type    | Constraints                       |
|--------------|---------|-----------------------------------|
| date         | DATE    | PK, DEFAULT CURRENT_DATE         |
| new_count    | INTEGER | NOT NULL, DEFAULT 0              |
| review_count | INTEGER | NOT NULL, DEFAULT 0              |

**Notes**: One row per calendar day (UTC). Queried/upserted on each review to enforce limits.

## State Machine: Card Lifecycle

```
         first review
  [new] ──────────────→ [learning]
                            │
                      Good/Easy │ Again → stay, interval=1
                            ▼
                        [review]
                       ╱        ╲
              Good/Hard/Easy    Again
               stay in review    │
                                 ▼
                          [relearning]
                            │
                      Good/Easy │ Again → stay, interval=1
                            ▼
                        [review]
```

## Migration Strategy

SQL migration files numbered sequentially:
- `001_create_decks.sql`
- `002_create_cards.sql`
- `003_create_card_states.sql`
- `004_create_review_logs.sql`
- `005_create_daily_limits.sql`
- `006_create_daily_counters.sql`

Tracked via `schema_migrations` table with `(version, applied_at)`.
