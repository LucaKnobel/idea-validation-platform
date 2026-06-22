import type { SubscriptionCheckout } from '@application/models/subscription-checkout'

export interface SubscriptionCheckoutService {
  createCheckout(userId: string): Promise<SubscriptionCheckout>
  consumeCheckout(id: string): Promise<SubscriptionCheckout>
}
