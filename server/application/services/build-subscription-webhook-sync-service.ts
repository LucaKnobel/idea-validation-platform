import type { Logger } from '@interfaces/logger'
import type { SubscriptionRepository } from '@application/interfaces/subscription-repository'
import type { Subscription, SubscriptionStatus } from '@application/models/subscription'
import type {
  SubscriptionUpsertByCheckoutInput,
  SubscriptionUpsertByProviderInput
} from '@application/interfaces/subscription-webhook-sync-service'

const derivePlanFromStatus = (status: SubscriptionStatus): Subscription['plan'] => {
  return status === 'CANCELLED' ? 'FREE' : 'PRO'
}

/**
 * Builds the service that upserts provider subscription updates into local storage.
 */
export const buildSubscriptionWebhookSyncService = (
  subscriptionRepository: SubscriptionRepository,
  logger: Logger
) => {
  const toSubscriptionRecord = (
    userId: string,
    update: Pick<SubscriptionUpsertByCheckoutInput, 'status' | 'providerCustomerId' | 'providerSubscriptionId' | 'currentPeriodEnd'>
  ): Subscription => {
    return {
      userId,
      plan: derivePlanFromStatus(update.status),
      status: update.status,
      providerCustomerId: update.providerCustomerId,
      providerSubscriptionId: update.providerSubscriptionId,
      currentPeriodEnd: update.currentPeriodEnd
    }
  }

  const findByProviderKeys = async (
    input: SubscriptionUpsertByProviderInput
  ): Promise<Subscription | null> => {
    if (input.providerSubscriptionId && subscriptionRepository.findByProviderSubscriptionId) {
      const match = await subscriptionRepository.findByProviderSubscriptionId(input.providerSubscriptionId)
      if (match) {
        return match
      }
    }

    if (input.providerCustomerId && subscriptionRepository.findByProviderCustomerId) {
      const match = await subscriptionRepository.findByProviderCustomerId(input.providerCustomerId)
      if (match) {
        return match
      }
    }

    return null
  }

  const upsertByCheckout = async (
    input: SubscriptionUpsertByCheckoutInput
  ): Promise<Subscription> => {
    const nextSubscription = toSubscriptionRecord(input.userId, input)
    const existing = await subscriptionRepository.findByUserId(input.userId)

    const persisted = existing
      ? await subscriptionRepository.update(nextSubscription)
      : await subscriptionRepository.create(nextSubscription)

    logger.info('Subscription update applied via checkout', {
      source: 'subscription-webhook-sync-service',
      event: 'subscription.update.applied_checkout',
      userId: input.userId,
      providerSubscriptionId: input.providerSubscriptionId,
      status: input.status
    })

    return persisted
  }

  const upsertByProvider = async (
    input: SubscriptionUpsertByProviderInput
  ): Promise<Subscription | null> => {
    const existing = await findByProviderKeys(input)

    if (!existing) {
      logger.warn('Subscription update could not be matched to an existing user', {
        source: 'subscription-webhook-sync-service',
        event: 'subscription.update.unmatched',
        providerSubscriptionId: input.providerSubscriptionId,
        providerCustomerId: input.providerCustomerId,
        status: input.status
      })
      return null
    }

    const nextSubscription = toSubscriptionRecord(existing.userId, input)
    const persisted = await subscriptionRepository.update(nextSubscription)

    logger.info('Subscription update applied via provider identifiers', {
      source: 'subscription-webhook-sync-service',
      event: 'subscription.update.applied_provider',
      userId: existing.userId,
      providerSubscriptionId: input.providerSubscriptionId,
      status: input.status
    })

    return persisted
  }

  return {
    upsertByCheckout,
    upsertByProvider
  }
}
