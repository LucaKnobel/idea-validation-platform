import type { Subscription } from '@application/models/subscription'

/**
 * Provisioning service for subscription lifecycle initialization.
 *
 * Handles creation of subscriptions (e.g., free subscriptions on email verification).
 */
export interface SubscriptionProvisioningService {
  /**
   * Creates a free subscription for a user if one doesn't exist.
   * Idempotent: returns existing subscription if already created.
   */
  createFreeSubscription(userId: string): Promise<Subscription>
}
