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
 * Builds the cancel subscription use case.
 *
 * Responsibilities:
 * - Validate whether cancellation is allowed.
 * - Trigger provider-side cancellation.
 * - Transition local status to immediate cancellation state.
 */
export const buildCancelSubscription = (
  subscriptionRepository: SubscriptionRepository,
  subscriptionCancellationGateway: SubscriptionCancellationGateway,
  logger: Logger
) => {
  return async (input: CancelSubscriptionInput): Promise<Subscription> => {
    const existing = await subscriptionRepository.findByUserId(input.userId)

    if (!existing) {
      throw new SubscriptionNotFoundError()
    }

    if (existing.plan !== 'PRO') {
      throw new SubscriptionCancellationUnavailableError()
    }

    if (existing.status === 'CANCELLED') {
      return existing
    }

    if (!existing.providerSubscriptionId) {
      throw new SubscriptionProviderSubscriptionIdMissingError()
    }

    await subscriptionCancellationGateway.cancelSubscription(existing.providerSubscriptionId)

    const updated = await subscriptionRepository.update({
      ...existing,
      plan: 'FREE',
      status: 'CANCELLED',
      currentPeriodEnd: new Date()
    })

    logger.info('Subscription cancellation requested', {
      source: 'subscription-cancel-service',
      event: 'subscription.cancel.requested',
      userId: input.userId,
      providerSubscriptionId: existing.providerSubscriptionId
    })

    return updated
  }
}
