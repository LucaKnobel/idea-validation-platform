import type { Logger } from '@interfaces/logger'
import type { SubscriptionRepository } from '@application/interfaces/subscription-repository'
import type { SubscriptionCancellationGateway } from '@application/interfaces/subscription-cancellation-gateway'
import type { Subscription } from '@application/models/subscription'
import {
  SubscriptionCancellationUnavailableError,
  SubscriptionNotFoundError,
  SubscriptionProviderSubscriptionIdMissingError
} from '@application/errors/subscription-errors'

export type CancelSubscriptionInput = {
  userId: string
}

/**
 * Cancels the user's PRO subscription in Payrexx and updates local state.
 */
export const buildCancelSubscription = (
  subscriptionRepository: SubscriptionRepository,
  subscriptionCancellationGateway: SubscriptionCancellationGateway,
  logger: Logger
) => {
  return async (
    input: CancelSubscriptionInput
  ): Promise<Subscription> => {
    const existing = await subscriptionRepository.findByUserId(input.userId)

    if (!existing) {
      throw new SubscriptionNotFoundError()
    }

    if (existing.plan !== 'PRO') {
      throw new SubscriptionCancellationUnavailableError()
    }

    if (existing.status === 'CANCELLED' || existing.status === 'IN_NOTICE') {
      return existing
    }

    if (!existing.providerSubscriptionId) {
      throw new SubscriptionProviderSubscriptionIdMissingError()
    }

    await subscriptionCancellationGateway.cancelSubscription(existing.providerSubscriptionId)

    const updated = await subscriptionRepository.update({
      ...existing,
      status: 'IN_NOTICE'
    })

    logger.info('Subscription cancellation requested', {
      source: 'cancel-subscription',
      event: 'subscription.cancel.requested',
      userId: input.userId,
      providerSubscriptionId: existing.providerSubscriptionId
    })

    return updated
  }
}
