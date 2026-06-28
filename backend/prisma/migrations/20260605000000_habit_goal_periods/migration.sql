-- CreateEnum
CREATE TYPE "GoalPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "Habit" ADD COLUMN     "goalPeriod" "GoalPeriod",
ADD COLUMN     "goalTarget" INTEGER;

-- Backfill: an existing weekly goal becomes a WEEKLY goal of that target.
UPDATE "Habit" SET "goalPeriod" = 'WEEKLY', "goalTarget" = "weeklyGoal" WHERE "weeklyGoal" IS NOT NULL;
