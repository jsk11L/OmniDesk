-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "plainText" TEXT;

-- AlterTable
ALTER TABLE "TodoColumn" ADD COLUMN     "isCompletionColumn" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "timezone" TEXT;
