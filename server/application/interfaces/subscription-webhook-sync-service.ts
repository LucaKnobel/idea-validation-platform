import type { Subscription, SubscriptionStatus } from '@application/models/subscription'

export type SubscriptionUpsertByCheckoutInput = {
  userId: string
  checkoutId: string
  status: SubscriptionStatus
  providerCustomerId: string | null
  providerSubscriptionId: string | null
  currentPeriodEnd: Date | null
}

export type SubscriptionUpsertByProviderInput = {
  status: SubscriptionStatus
  providerCustomerId: string | null
  providerSubscriptionId: string | null
  currentPeriodEnd: Date | null
}

export interface SubscriptionWebhookSyncService {
  upsertByCheckout(input: SubscriptionUpsertByCheckoutInput): Promise<Subscription>
  upsertByProvider(input: SubscriptionUpsertByProviderInput): Promise<Subscription | null>
}
