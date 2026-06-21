import { randomUUID } from 'node:crypto'
import { prisma } from '@infrastructure/db/prisma'
import type { SubscriptionCheckout as PrismaSubscriptionCheckout } from '@generated/prisma/client'
import type { SubscriptionCheckoutRepository } from '@application/interfaces/subscription-checkout-repository'
import type { SubscriptionCheckout } from '@application/models/subscription-checkout'

const toDomain = (row: PrismaSubscriptionCheckout): SubscriptionCheckout => ({
  id: row.id,
  userId: row.userId,
  consumedAt: row.consumedAt,
  createdAt: row.createdAt
})

export const subscriptionCheckoutRepository: SubscriptionCheckoutRepository = {
  async create(userId: string): Promise<SubscriptionCheckout> {
    const row = await prisma.subscriptionCheckout.create({
      data: {
        id: randomUUID(),
        userId
      }
    })

    return toDomain(row)
  },

  async findById(id: string): Promise<SubscriptionCheckout | null> {
    const row = await prisma.subscriptionCheckout.findUnique({
      where: { id }
    })

    return row ? toDomain(row) : null
  },

  async consume(id: string): Promise<SubscriptionCheckout> {
    const row = await prisma.subscriptionCheckout.update({
      where: { id },
      data: { consumedAt: new Date() }
    })

    return toDomain(row)
  }
}
