import type { Logger } from '@interfaces/logger'
import type { SubscriptionRepository } from '@application/interfaces/subscription-repository'
import type { Subscription, SubscriptionStatus } from '@application/models/subscription'

/**
 * Provider-neutral input used by the subscription sync use case.
 * External webhook payloads must be mapped to this shape first.
 */
export type SyncSubscriptionInput = {
  userId: string
  status: SubscriptionStatus
  providerCustomerId: string | null
  providerSubscriptionId: string | null
  currentPeriodEnd: Date | null
}

/**
 * Synchronizes external subscription state into the local subscription record.
 */
export const buildSyncPayrexxSubscriptionWebhook = (
  subscriptionRepository: SubscriptionRepository,
  logger: Logger
) => {
  return async (
    input: SyncSubscriptionInput
  ): Promise<Subscription> => {
    const nextSubscription: Subscription = {
      userId: input.userId,
      plan: 'PRO',
      status: input.status,
      providerCustomerId: input.providerCustomerId,
      providerSubscriptionId: input.providerSubscriptionId,
      currentPeriodEnd: input.currentPeriodEnd
    }

    const existing = await subscriptionRepository.findByUserId(input.userId)

    const persisted = existing
      ? await subscriptionRepository.update(nextSubscription)
      : await subscriptionRepository.create(nextSubscription)

    logger.info('Payrexx subscription webhook processed', {
      source: 'payrexx-subscription-webhook',
      event: 'payrexx.subscription_webhook.processed',
      userId: input.userId,
      providerSubscriptionId: input.providerSubscriptionId,
      status: input.status
    })

    return persisted
  }
}
