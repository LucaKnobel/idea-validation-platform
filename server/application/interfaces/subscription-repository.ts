import type { Subscription } from '@application/models/subscription'

export interface SubscriptionRepository {
  findByUserId(userId: string): Promise<Subscription | null>

  create(subscription: Subscription): Promise<Subscription>

  update(subscription: Subscription): Promise<Subscription>
}
