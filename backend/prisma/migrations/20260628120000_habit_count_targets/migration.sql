-- Multi-count habits: per-day count + optional daily minimum/maximum targets,
-- plus a "featured" flag for the hero habit. All additive and backward-compatible
-- (existing entries default to count = 1, so done-at-1 behaviour is unchanged).
ALTER TABLE "Habit" ADD COLUMN "dailyMin" INTEGER;
ALTER TABLE "Habit" ADD COLUMN "dailyMax" INTEGER;
ALTER TABLE "Habit" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "HabitEntry" ADD COLUMN "count" INTEGER NOT NULL DEFAULT 1;
