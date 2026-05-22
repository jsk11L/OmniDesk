-- =============================================================
-- v2 schema alignment
--
-- The init migration (20260513033242_init) captured the v1.0 schema.
-- During v2.0 development the schema.prisma evolved (Habits module,
-- Wishlist/SavingsGoal extensions, CalendarSettings, new flags on
-- TodoItem / TodoBoard, gridConfig / viewConfig on List, description
-- on Note, removal of ListItem.imageUrl) but no migration was
-- generated. INSERTs against those models failed because the Prisma
-- client referenced columns that did not exist in the database.
--
-- This migration brings the database up to the current schema.prisma.
-- It is idempotent (IF NOT EXISTS / IF EXISTS) so it is safe to run
-- whether the DB is still at v1 or was patched piecemeal via db push.
-- =============================================================

-- ── New enums ─────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "CalendarSize" AS ENUM ('COMPACT', 'NORMAL', 'COMFORTABLE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CalendarBorderStyle" AS ENUM ('SQUARE', 'ROUNDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "HabitEntryStatus" AS ENUM ('DONE', 'MISSED', 'RECOVERED', 'REST');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "WishlistPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── List: gridConfig / viewConfig ────────────────────────────
ALTER TABLE "List" ADD COLUMN IF NOT EXISTS "gridConfig" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "List" ADD COLUMN IF NOT EXISTS "viewConfig" JSONB NOT NULL DEFAULT '{}';

-- ── ListItem: drop legacy imageUrl ───────────────────────────
ALTER TABLE "ListItem" DROP COLUMN IF EXISTS "imageUrl";

-- ── Note: description (max 280) ──────────────────────────────
ALTER TABLE "Note" ADD COLUMN IF NOT EXISTS "description" VARCHAR(280);

-- ── TodoBoard: isSystem ──────────────────────────────────────
ALTER TABLE "TodoBoard" ADD COLUMN IF NOT EXISTS "isSystem" BOOLEAN NOT NULL DEFAULT false;

-- ── TodoItem: hasDueDate / hasPriority ───────────────────────
ALTER TABLE "TodoItem" ADD COLUMN IF NOT EXISTS "hasDueDate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TodoItem" ADD COLUMN IF NOT EXISTS "hasPriority" BOOLEAN NOT NULL DEFAULT false;

-- ── CalendarSettings ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "CalendarSettings" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "size"        "CalendarSize" NOT NULL DEFAULT 'NORMAL',
  "borderStyle" "CalendarBorderStyle" NOT NULL DEFAULT 'ROUNDED',
  "firstDay"    INTEGER NOT NULL DEFAULT 1,
  "defaultView" TEXT NOT NULL DEFAULT 'dayGridMonth',
  "updatedAt"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CalendarSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CalendarSettings_userId_key" ON "CalendarSettings"("userId");

DO $$ BEGIN
  ALTER TABLE "CalendarSettings"
    ADD CONSTRAINT "CalendarSettings_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Habit ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Habit" (
  "id"            TEXT NOT NULL,
  "userId"        TEXT NOT NULL,
  "name"          TEXT NOT NULL,
  "description"   TEXT,
  "icon"          TEXT,
  "color"         TEXT NOT NULL DEFAULT '#6366f1',
  "activeDays"    INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5,6,0]::INTEGER[],
  "weeklyGoal"    INTEGER,
  "currentStreak" INTEGER NOT NULL DEFAULT 0,
  "longestStreak" INTEGER NOT NULL DEFAULT 0,
  "perfectWeeks"  INTEGER NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Habit_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "Habit"
    ADD CONSTRAINT "Habit_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "HabitEntry" (
  "id"        TEXT NOT NULL,
  "habitId"   TEXT NOT NULL,
  "date"      DATE NOT NULL,
  "status"    "HabitEntryStatus" NOT NULL,
  "notes"     TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "HabitEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "HabitEntry_habitId_date_key" ON "HabitEntry"("habitId", "date");

DO $$ BEGIN
  ALTER TABLE "HabitEntry"
    ADD CONSTRAINT "HabitEntry_habitId_fkey"
    FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── WishlistItem ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "WishlistItem" (
  "id"             TEXT NOT NULL,
  "boardId"        TEXT NOT NULL,
  "title"          TEXT NOT NULL,
  "description"    TEXT,
  "imageUrl"       TEXT,
  "estimatedPrice" DOUBLE PRECISION,
  "currency"       TEXT NOT NULL DEFAULT 'USD',
  "url"            TEXT,
  "category"       TEXT,
  "priority"       "WishlistPriority" NOT NULL DEFAULT 'MEDIUM',
  "isArchived"     BOOLEAN NOT NULL DEFAULT false,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "WishlistItem"
    ADD CONSTRAINT "WishlistItem_boardId_fkey"
    FOREIGN KEY ("boardId") REFERENCES "FinanceBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── PlannedPurchase ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PlannedPurchase" (
  "id"          TEXT NOT NULL,
  "boardId"     TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "amount"      DOUBLE PRECISION NOT NULL,
  "currency"    TEXT NOT NULL DEFAULT 'USD',
  "targetDate"  TIMESTAMP(3) NOT NULL,
  "categoryId"  TEXT,
  "isPurchased" BOOLEAN NOT NULL DEFAULT false,
  "purchasedAt" TIMESTAMP(3),
  "notes"       TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PlannedPurchase_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "PlannedPurchase"
    ADD CONSTRAINT "PlannedPurchase_boardId_fkey"
    FOREIGN KEY ("boardId") REFERENCES "FinanceBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PlannedPurchase"
    ADD CONSTRAINT "PlannedPurchase_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "FinanceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── SavingsGoal ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "SavingsGoal" (
  "id"            TEXT NOT NULL,
  "boardId"       TEXT NOT NULL,
  "name"          TEXT NOT NULL,
  "targetAmount"  DOUBLE PRECISION NOT NULL,
  "currentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currency"      TEXT NOT NULL DEFAULT 'USD',
  "targetDate"    TIMESTAMP(3),
  "icon"          TEXT,
  "color"         TEXT NOT NULL DEFAULT '#22c55e',
  "isCompleted"   BOOLEAN NOT NULL DEFAULT false,
  "completedAt"   TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SavingsGoal_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "SavingsGoal"
    ADD CONSTRAINT "SavingsGoal_boardId_fkey"
    FOREIGN KEY ("boardId") REFERENCES "FinanceBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── SavingsContribution ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "SavingsContribution" (
  "id"     TEXT NOT NULL,
  "goalId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "date"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes"  TEXT,

  CONSTRAINT "SavingsContribution_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "SavingsContribution"
    ADD CONSTRAINT "SavingsContribution_goalId_fkey"
    FOREIGN KEY ("goalId") REFERENCES "SavingsGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
