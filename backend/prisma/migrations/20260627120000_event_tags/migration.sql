-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
