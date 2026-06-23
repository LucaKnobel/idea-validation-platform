import type { SubscriptionProvisioningService } from '@application/interfaces/subscription-provisioning-service'
import type { SubscriptionRepository } from '@application/interfaces/subscription-repository'
import type { SubscriptionAccessService } from '@application/interfaces/subscription-access-service'
import type { Subscription } from '@application/models/subscription'
import type { Logger } from '@interfaces/logger'

/**
 * Builds the provisioning service for subscriptions.
 *
 * Handles creation of subscriptions (e.g., free subscriptions on email verification).
 */
export const buildSubscriptionProvisioningService = (
  subscriptionRepository: SubscriptionRepository,
  subscriptionAccessService: SubscriptionAccessService,
  logger: Logger
): SubscriptionProvisioningService => {
  const createFreeSubscription = async (
    userId: string
  ): Promise<Subscription> => {
    const existing = await subscriptionAccessService.getByUserId(userId)

    if (existing) {
      logger.debug('Free subscription already exists (idempotent)', {
        source: 'subscription-provisioning-service',
        event: 'subscription.free_already_exists',
        userId
      })
      return existing
    }

    const created = await subscriptionRepository.create({
      userId,
      plan: 'FREE',
      status: 'ACTIVE',
      providerCustomerId: null,
      providerSubscriptionId: null,
      currentPeriodEnd: null
    })

    logger.info('Free subscription created', {
      source: 'subscription-provisioning-service',
      event: 'subscription.free_created',
      userId
    })

    return created
  }

  return {
    createFreeSubscription
  }
}
