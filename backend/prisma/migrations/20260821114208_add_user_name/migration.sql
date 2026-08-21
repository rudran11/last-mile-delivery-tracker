-- DropIndex
DROP INDEX "AgentProfile_currentLocation_idx";

-- DropIndex
DROP INDEX "Order_dropLocation_idx";

-- DropIndex
DROP INDEX "Order_pickupLocation_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Unknown User';
