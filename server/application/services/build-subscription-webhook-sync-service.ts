import type { Logger } from '@interfaces/logger'
import type { SubscriptionRepository } from '@application/interfaces/subscription-repository'
import type { Subscription, SubscriptionStatus } from '@application/models/subscription'
import type {
  SubscriptionUpsertInput,
  SubscriptionWebhookSyncService
} from '@application/interfaces/subscription-webhook-sync-service'

const derivePlanFromStatus = (status: SubscriptionStatus): Subscription['plan'] => {
  return status === 'CANCELLED' ? 'FREE' : 'PRO'
}

/**
 * Builds the service that upserts provider subscription updates into local storage.
 *
 * Assumes userId is already resolved and known before calling.
 */
export const buildSubscriptionWebhookSyncService = (
  subscriptionRepository: SubscriptionRepository,
  logger: Logger
): SubscriptionWebhookSyncService => {
  const upsert = async (input: SubscriptionUpsertInput): Promise<Subscription> => {
    const nextSubscription: Subscription = {
      userId: input.userId,
      plan: derivePlanFromStatus(input.status),
      status: input.status,
      providerCustomerId: input.providerCustomerId,
      providerSubscriptionId: input.providerSubscriptionId,
      currentPeriodEnd: input.currentPeriodEnd
    }

    const existing = await subscriptionRepository.findByUserId(input.userId)

    const persisted = existing
      ? await subscriptionRepository.update(nextSubscription)
      : await subscriptionRepository.create(nextSubscription)

    logger.info('Subscription updated from webhook', {
      source: 'subscription-webhook-sync-service',
      event: 'subscription.webhook.applied',
      userId: input.userId,
      providerSubscriptionId: input.providerSubscriptionId,
      status: input.status
    })

    return persisted
  }

  return {
    upsert
  }
}
