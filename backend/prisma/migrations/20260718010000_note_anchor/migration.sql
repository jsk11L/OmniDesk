-- AlterTable
ALTER TABLE "Note" ADD COLUMN "anchorType" TEXT;
ALTER TABLE "Note" ADD COLUMN "anchorId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Note_anchorType_anchorId_key" ON "Note"("anchorType", "anchorId");
