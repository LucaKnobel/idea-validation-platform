import type { SubscriptionCheckout } from '@application/models/subscription-checkout'

export interface SubscriptionCheckoutService {
  consumeCheckout(id: string): Promise<SubscriptionCheckout>
}
