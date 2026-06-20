/*
  Warnings:

  - You are about to drop the column `providerReference` on the `subscription` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubscriptionStatus" ADD VALUE 'IN_NOTICE';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'OVERDUE';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "subscription" DROP COLUMN "providerReference",
ADD COLUMN     "providerCustomerId" TEXT,
ADD COLUMN     "providerSubscriptionId" TEXT;
