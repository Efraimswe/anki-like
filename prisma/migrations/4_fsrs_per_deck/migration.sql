ALTER TABLE "card_states"
ADD COLUMN IF NOT EXISTS "stability" REAL NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "difficulty" REAL NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "scheduled_days" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "reps" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "lapses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "last_review" TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS "deck_fsrs_configs" (
    "deck_id" UUID NOT NULL,
    "desired_retention" REAL NOT NULL DEFAULT 0.9,
    "maximum_interval" INTEGER NOT NULL DEFAULT 36500,
    "weights" REAL[] NOT NULL DEFAULT ARRAY[]::REAL[],
    "learning_steps" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "relearning_steps" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "is_optimized" BOOLEAN NOT NULL DEFAULT false,
    "last_optimized_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deck_fsrs_configs_pkey" PRIMARY KEY ("deck_id")
);

ALTER TABLE "deck_fsrs_configs"
ADD CONSTRAINT "deck_fsrs_configs_deck_id_fkey"
FOREIGN KEY ("deck_id") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "deck_fsrs_configs" ("deck_id")
SELECT "id" FROM "decks"
ON CONFLICT ("deck_id") DO NOTHING;
