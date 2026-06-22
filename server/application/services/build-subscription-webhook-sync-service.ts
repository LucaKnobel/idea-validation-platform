import type { Logger } from '@interfaces/logger'
import type { SubscriptionRepository } from '@application/interfaces/subscription-repository'
import type { Subscription, SubscriptionStatus } from '@application/models/subscription'

/**
 * Provider-neutral input used by the webhook sync use case.
 * External payloads must be validated and mapped before calling this service.
 */
export type SyncSubscriptionInput = {
  userId: string
  checkoutId: string
  status: SubscriptionStatus
  providerCustomerId: string | null
  providerSubscriptionId: string | null
  currentPeriodEnd: Date | null
}

export type SyncSubscriptionByProviderInput = {
  status: SubscriptionStatus
  providerCustomerId: string | null
  providerSubscriptionId: string | null
  currentPeriodEnd: Date | null
}

const derivePlanFromStatus = (status: SubscriptionStatus): Subscription['plan'] => {
  return status === 'CANCELLED' ? 'FREE' : 'PRO'
}

/**
 * Builds the subscription webhook sync service.
 *
 * Responsibility:
 * - Persist provider-originated subscription state changes.
 */
export const buildSubscriptionWebhookSyncService = (
  subscriptionRepository: SubscriptionRepository,
  logger: Logger
) => {
  const buildNextSubscription = (
    userId: string,
    input: Pick<SyncSubscriptionInput, 'status' | 'providerCustomerId' | 'providerSubscriptionId' | 'currentPeriodEnd'>
  ): Subscription => {
    return {
      userId,
      plan: derivePlanFromStatus(input.status),
      status: input.status,
      providerCustomerId: input.providerCustomerId,
      providerSubscriptionId: input.providerSubscriptionId,
      currentPeriodEnd: input.currentPeriodEnd
    }
  }

  const resolveByProvider = async (
    input: SyncSubscriptionByProviderInput
  ): Promise<Subscription | null> => {
    if (
      input.providerSubscriptionId
      && subscriptionRepository.findByProviderSubscriptionId
    ) {
      const match = await subscriptionRepository.findByProviderSubscriptionId(input.providerSubscriptionId)
      if (match) {
        return match
      }
    }

    if (
      input.providerCustomerId
      && subscriptionRepository.findByProviderCustomerId
    ) {
      const match = await subscriptionRepository.findByProviderCustomerId(input.providerCustomerId)
      if (match) {
        return match
      }
    }

    return null
  }

  const syncSubscriptionState = async (
    input: SyncSubscriptionInput
  ): Promise<Subscription> => {
    const nextSubscription = buildNextSubscription(input.userId, input)

    const existing = await subscriptionRepository.findByUserId(input.userId)

    const persisted = existing
      ? await subscriptionRepository.update(nextSubscription)
      : await subscriptionRepository.create(nextSubscription)

    logger.info('Payrexx subscription webhook processed', {
      source: 'subscription-webhook-sync-service',
      event: 'subscription.webhook_synced',
      userId: input.userId,
      providerSubscriptionId: input.providerSubscriptionId,
      status: input.status
    })

    return persisted
  }

  const syncSubscriptionStateByProvider = async (
    input: SyncSubscriptionByProviderInput
  ): Promise<Subscription | null> => {
    const existing = await resolveByProvider(input)

    if (!existing) {
      logger.warn('Payrexx webhook could not be matched to an existing subscription', {
        source: 'subscription-webhook-sync-service',
        event: 'subscription.webhook_unmatched',
        providerSubscriptionId: input.providerSubscriptionId,
        providerCustomerId: input.providerCustomerId,
        status: input.status
      })
      return null
    }

    const nextSubscription = buildNextSubscription(existing.userId, input)
    const persisted = await subscriptionRepository.update(nextSubscription)

    logger.info('Payrexx subscription webhook processed via provider match', {
      source: 'subscription-webhook-sync-service',
      event: 'subscription.webhook_synced_provider_match',
      userId: existing.userId,
      providerSubscriptionId: input.providerSubscriptionId,
      status: input.status
    })

    return persisted
  }

  return {
    syncSubscriptionState,
    syncSubscriptionStateByProvider
  }
}
