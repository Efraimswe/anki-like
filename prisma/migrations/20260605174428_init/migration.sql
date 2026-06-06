-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(100),
    "target_language" VARCHAR(10) NOT NULL DEFAULT 'ru',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "daily_review_limit" INTEGER NOT NULL DEFAULT 20,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "deck_id" UUID NOT NULL,
    "word" TEXT NOT NULL,
    "translate" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_states" (
    "card_id" UUID NOT NULL,
    "phase" VARCHAR(12) NOT NULL DEFAULT 'new',
    "interval" INTEGER NOT NULL DEFAULT 0,
    "ease_factor" REAL NOT NULL DEFAULT 2.5,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "learning_step" INTEGER NOT NULL DEFAULT 0,
    "stability" REAL NOT NULL DEFAULT 0,
    "difficulty" REAL NOT NULL DEFAULT 0,
    "scheduled_days" INTEGER NOT NULL DEFAULT 0,
    "reps" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "due_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_review" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_states_pkey" PRIMARY KEY ("card_id")
);

-- CreateTable
CREATE TABLE "review_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "card_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "interval_before" INTEGER NOT NULL,
    "interval_after" INTEGER NOT NULL,
    "ease_before" REAL NOT NULL,
    "ease_after" REAL NOT NULL,
    "time_taken_ms" INTEGER,
    "reviewed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deck_daily_counters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "deck_id" UUID NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "review_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "deck_daily_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_decks_user_id" ON "decks"("user_id");

-- CreateIndex
CREATE INDEX "idx_cards_deck_id" ON "cards"("deck_id");

-- CreateIndex
CREATE INDEX "idx_card_states_due_date" ON "card_states"("due_date");

-- CreateIndex
CREATE INDEX "idx_review_logs_card_id" ON "review_logs"("card_id");

-- CreateIndex
CREATE INDEX "idx_review_logs_reviewed_at" ON "review_logs"("reviewed_at");

-- CreateIndex
CREATE UNIQUE INDEX "idx_deck_daily_counters_deck_date" ON "deck_daily_counters"("deck_id", "date");

-- AddForeignKey
ALTER TABLE "decks" ADD CONSTRAINT "decks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "decks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_states" ADD CONSTRAINT "card_states_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deck_daily_counters" ADD CONSTRAINT "deck_daily_counters_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
