import { prisma } from '@infrastructure/db/prisma'
import type { Subscription as PrismaSubscription } from '@generated/prisma/client'
import type { SubscriptionRepository } from '@application/interfaces/subscription-repository'
import type { Subscription } from '@application/models/subscription'

/**
 * Maps a Prisma subscription row to the application subscription model.
 */
const toDomainSubscription = (row: PrismaSubscription): Subscription => ({
  userId: row.userId,
  plan: row.plan,
  status: row.status,
  providerReference: row.providerReference,
  currentPeriodEnd: row.currentPeriodEnd
})

export const subscriptionRepository: SubscriptionRepository = {
  /**
   * Returns a user's subscription or null when no subscription exists yet.
   */
  async findByUserId(userId: string): Promise<Subscription | null> {
    const row = await prisma.subscription.findUnique({
      where: { userId }
    })

    return row ? toDomainSubscription(row) : null
  },

  /**
   * Creates and returns a persisted subscription.
   */
  async create(subscription: Subscription): Promise<Subscription> {
    const row = await prisma.subscription.create({
      data: {
        userId: subscription.userId,
        plan: subscription.plan,
        status: subscription.status,
        providerReference: subscription.providerReference,
        currentPeriodEnd: subscription.currentPeriodEnd
      }
    })

    return toDomainSubscription(row)
  },

  /**
   * Updates and returns an existing subscription identified by userId.
   */
  async update(subscription: Subscription): Promise<Subscription> {
    const row = await prisma.subscription.update({
      where: { userId: subscription.userId },
      data: {
        plan: subscription.plan,
        status: subscription.status,
        providerReference: subscription.providerReference,
        currentPeriodEnd: subscription.currentPeriodEnd
      }
    })

    return toDomainSubscription(row)
  }
}
