-- CreateEnum
CREATE TYPE "NotificationEvent" AS ENUM ('ORDER_CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RESCHEDULED', 'ADMIN_STATUS_OVERRIDE');

-- 1. Safely add idempotencyKey with a default (the id itself) to existing rows
ALTER TABLE "Notification" ADD COLUMN "idempotencyKey" TEXT;
UPDATE "Notification" SET "idempotencyKey" = "id";
ALTER TABLE "Notification" ALTER COLUMN "idempotencyKey" SET NOT NULL;

-- 2. Add new column with new enum type, initially nullable
ALTER TABLE "Notification" ADD COLUMN "newEvent" "NotificationEvent";

-- 3. Migrate data from old enum to new enum
UPDATE "Notification" 
SET "newEvent" = CASE 
    WHEN "event"::text = 'PENDING' THEN 'ORDER_CREATED'::"NotificationEvent"
    ELSE "event"::text::"NotificationEvent"
END;

-- 4. Make the new column NOT NULL, drop old column, rename new column
ALTER TABLE "Notification" ALTER COLUMN "newEvent" SET NOT NULL;
ALTER TABLE "Notification" DROP COLUMN "event";
ALTER TABLE "Notification" RENAME COLUMN "newEvent" TO "event";

-- CreateIndex
CREATE UNIQUE INDEX "Notification_idempotencyKey_key" ON "Notification"("idempotencyKey");
