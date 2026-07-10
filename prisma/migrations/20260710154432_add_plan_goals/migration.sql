-- CreateTable
CREATE TABLE "plan_goals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "skill" VARCHAR(20) NOT NULL,
    "level" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_medium_goals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "big_goal_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_medium_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_plan_goals_user_id" ON "plan_goals"("user_id");

-- CreateIndex  (partial unique: только одна АКТИВНАЯ большая цель на skill+level у юзера)
CREATE UNIQUE INDEX "idx_plan_goals_user_skill_level_active" ON "plan_goals"("user_id", "skill", "level") WHERE "completed" = false;

-- CreateIndex
CREATE INDEX "idx_plan_medium_goals_big_goal_id" ON "plan_medium_goals"("big_goal_id");

-- AddForeignKey
ALTER TABLE "plan_goals" ADD CONSTRAINT "plan_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_medium_goals" ADD CONSTRAINT "plan_medium_goals_big_goal_id_fkey" FOREIGN KEY ("big_goal_id") REFERENCES "plan_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
