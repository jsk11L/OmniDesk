-- Performance indices (Block 8) for the hottest list queries.
-- CreateIndex
CREATE INDEX "Note_userId_updatedAt_idx" ON "Note"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_userId_startDate_idx" ON "CalendarEvent"("userId", "startDate");

-- CreateIndex
CREATE INDEX "Transaction_boardId_date_idx" ON "Transaction"("boardId", "date");
