-- Destructive migration: wipe all existing data and add auth tables

-- Truncate all existing tables (order matters for FK constraints)
TRUNCATE TABLE "review_logs" CASCADE;
TRUNCATE TABLE "card_states" CASCADE;
TRUNCATE TABLE "daily_counters" CASCADE;
TRUNCATE TABLE "daily_limits" CASCADE;
TRUNCATE TABLE "cards" CASCADE;
TRUNCATE TABLE "decks" CASCADE;

-- Create users table
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" VARCHAR(100),
    "theme" VARCHAR(10) NOT NULL DEFAULT 'light',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Create sessions table
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "device_info" TEXT,
    "ip_address" VARCHAR(45),
    "last_active_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "expires_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sessions_refresh_token_key" ON "sessions"("refresh_token");
CREATE INDEX "idx_sessions_user_id" ON "sessions"("user_id");

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add user_id to decks
ALTER TABLE "decks" ADD COLUMN "user_id" UUID;

-- Since we truncated, we can set NOT NULL directly
ALTER TABLE "decks" ALTER COLUMN "user_id" SET NOT NULL;

CREATE INDEX "idx_decks_user_id" ON "decks"("user_id");

ALTER TABLE "decks" ADD CONSTRAINT "decks_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add user_id to daily_limits
ALTER TABLE "daily_limits" ADD COLUMN "user_id" UUID;
ALTER TABLE "daily_limits" ALTER COLUMN "user_id" SET NOT NULL;
CREATE UNIQUE INDEX "idx_daily_limits_user_id" ON "daily_limits"("user_id");

-- Add user_id + date unique constraint to daily_counters
-- First drop the old PK (date-only) and add new columns
ALTER TABLE "daily_counters" DROP CONSTRAINT "daily_counters_pkey";
ALTER TABLE "daily_counters" ADD COLUMN "id" UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE "daily_counters" ADD COLUMN "user_id" UUID;
ALTER TABLE "daily_counters" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "daily_counters" ADD CONSTRAINT "daily_counters_pkey" PRIMARY KEY ("id");
CREATE UNIQUE INDEX "idx_daily_counters_user_date" ON "daily_counters"("user_id", "date");
