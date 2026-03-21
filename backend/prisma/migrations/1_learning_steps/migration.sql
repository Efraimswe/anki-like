-- Drop any check constraint on interval (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_states_interval_check' AND conrelid = 'card_states'::regclass) THEN
    ALTER TABLE "card_states" DROP CONSTRAINT "card_states_interval_check";
  END IF;
END $$;

-- Add learning_step column to card_states
ALTER TABLE "card_states" ADD COLUMN IF NOT EXISTS "learning_step" INTEGER NOT NULL DEFAULT 0;

-- Migrate intervals from days to minutes (multiply by 1440)
UPDATE "card_states" SET "interval" = "interval" * 1440 WHERE "interval" > 0 AND "interval" <= 365;

-- Also migrate review_logs interval values
UPDATE "review_logs" SET "interval_before" = "interval_before" * 1440 WHERE "interval_before" > 0 AND "interval_before" <= 365;
UPDATE "review_logs" SET "interval_after" = "interval_after" * 1440 WHERE "interval_after" > 0 AND "interval_after" <= 365;
