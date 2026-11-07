-- DropForeignKey
ALTER TABLE "subscription" DROP CONSTRAINT "subscription_userId_fkey";

-- DropForeignKey
ALTER TABLE "subscriptionCheckout" DROP CONSTRAINT "subscriptionCheckout_userId_fkey";

-- DropTable
DROP TABLE "subscription";

-- DropTable
DROP TABLE "subscriptionCheckout";

-- DropEnum
DROP TYPE "SubscriptionPlan";

-- DropEnum
DROP TYPE "SubscriptionStatus";

