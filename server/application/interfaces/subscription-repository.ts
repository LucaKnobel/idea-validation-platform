import type { Subscription } from '@application/models/subscription'

export interface SubscriptionRepository {
  /**
   * Looks up a subscription by user ID.
   */
  findByUserId(userId: string): Promise<Subscription | null>

  /**
   * Persists a new subscription.
   */
  create(subscription: Subscription): Promise<Subscription>

  /**
   * Persists changes to an existing subscription.
   */
  update(subscription: Subscription): Promise<Subscription>
}
