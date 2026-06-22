import type { Subscription, SubscriptionStatus } from '@application/models/subscription'

/**
 * Input for upserting subscription state from webhook events.
 * userId must be resolved server-side from checkout before calling this.
 */
export type SubscriptionUpsertInput = {
  userId: string
  status: SubscriptionStatus
  providerCustomerId: string | null
  providerSubscriptionId: string | null
  currentPeriodEnd: Date | null
}

export interface SubscriptionWebhookSyncService {
  upsert(input: SubscriptionUpsertInput): Promise<Subscription>
}
