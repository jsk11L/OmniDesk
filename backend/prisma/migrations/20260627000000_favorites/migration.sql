-- CreateEnum
CREATE TYPE "FavoriteKind" AS ENUM ('LIST', 'NOTE');

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "FavoriteKind" NOT NULL,
    "entityId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Favorite_userId_position_idx" ON "Favorite"("userId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_kind_entityId_key" ON "Favorite"("userId", "kind", "entityId");

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
