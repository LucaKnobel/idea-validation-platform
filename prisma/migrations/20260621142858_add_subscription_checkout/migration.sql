-- CreateTable
CREATE TABLE "subscriptionCheckout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptionCheckout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subscriptionCheckout_userId_idx" ON "subscriptionCheckout"("userId");

-- AddForeignKey
ALTER TABLE "subscriptionCheckout" ADD CONSTRAINT "subscriptionCheckout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
