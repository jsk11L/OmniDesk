-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dndStart" TEXT,
ADD COLUMN     "dndEnd" TEXT,
ADD COLUMN     "quietDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- AlterTable
ALTER TABLE "PushSubscription" ADD COLUMN     "userAgent" TEXT,
ADD COLUMN     "deviceLabel" TEXT,
ADD COLUMN     "platform" TEXT,
ADD COLUMN     "lastUsedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ListItemNotification" (
    "id" TEXT NOT NULL,
    "listItemId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,

    CONSTRAINT "ListItemNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TodoItemNotification" (
    "id" TEXT NOT NULL,
    "todoItemId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "minutesBefore" INTEGER,

    CONSTRAINT "TodoItemNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HabitNotification" (
    "id" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "timeOfDay" TEXT,

    CONSTRAINT "HabitNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItemNotification" (
    "id" TEXT NOT NULL,
    "wishlistItemId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,

    CONSTRAINT "WishlistItemNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedPurchaseNotification" (
    "id" TEXT NOT NULL,
    "plannedPurchaseId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "daysBefore" INTEGER,

    CONSTRAINT "PlannedPurchaseNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingsGoalNotification" (
    "id" TEXT NOT NULL,
    "savingsGoalId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,

    CONSTRAINT "SavingsGoalNotification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ListItemNotification" ADD CONSTRAINT "ListItemNotification_listItemId_fkey" FOREIGN KEY ("listItemId") REFERENCES "ListItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListItemNotification" ADD CONSTRAINT "ListItemNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "NotificationConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TodoItemNotification" ADD CONSTRAINT "TodoItemNotification_todoItemId_fkey" FOREIGN KEY ("todoItemId") REFERENCES "TodoItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TodoItemNotification" ADD CONSTRAINT "TodoItemNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "NotificationConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitNotification" ADD CONSTRAINT "HabitNotification_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HabitNotification" ADD CONSTRAINT "HabitNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "NotificationConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItemNotification" ADD CONSTRAINT "WishlistItemNotification_wishlistItemId_fkey" FOREIGN KEY ("wishlistItemId") REFERENCES "WishlistItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WishlistItemNotification" ADD CONSTRAINT "WishlistItemNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "NotificationConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedPurchaseNotification" ADD CONSTRAINT "PlannedPurchaseNotification_plannedPurchaseId_fkey" FOREIGN KEY ("plannedPurchaseId") REFERENCES "PlannedPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlannedPurchaseNotification" ADD CONSTRAINT "PlannedPurchaseNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "NotificationConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsGoalNotification" ADD CONSTRAINT "SavingsGoalNotification_savingsGoalId_fkey" FOREIGN KEY ("savingsGoalId") REFERENCES "SavingsGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavingsGoalNotification" ADD CONSTRAINT "SavingsGoalNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "NotificationConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
