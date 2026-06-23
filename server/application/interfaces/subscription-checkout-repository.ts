import type { SubscriptionCheckout } from '@application/models/subscription-checkout'

export interface SubscriptionCheckoutRepository {
  create(userId: string): Promise<SubscriptionCheckout>
  findById(id: string): Promise<SubscriptionCheckout | null>
  consume(id: string): Promise<SubscriptionCheckout>
}
