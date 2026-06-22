import type { SubscriptionCheckout } from '@application/models/subscription-checkout'
import type { SubscriptionCheckoutRepository } from '@application/interfaces/subscription-checkout-repository'
import type { SubscriptionCheckoutService } from '@application/interfaces/subscription-checkout-service'
import type { Logger } from '@interfaces/logger'
import {
  SubscriptionCheckoutNotFoundError,
  SubscriptionCheckoutAlreadyConsumedError
} from '@application/errors/subscription-errors'

export const buildSubscriptionCheckoutService = (
  checkoutRepository: SubscriptionCheckoutRepository,
  logger: Logger
): SubscriptionCheckoutService => {
  const createCheckout = async (userId: string): Promise<SubscriptionCheckout> => {
    const checkout = await checkoutRepository.create(userId)

    logger.info('Subscription checkout created', {
      source: 'subscription-checkout-service',
      event: 'subscription.checkout.created',
      checkoutId: checkout.id,
      userId
    })

    return checkout
  }

  const consumeCheckout = async (id: string): Promise<SubscriptionCheckout> => {
    const checkout = await checkoutRepository.findById(id)

    if (!checkout) {
      throw new SubscriptionCheckoutNotFoundError()
    }

    if (checkout.consumedAt !== null) {
      logger.warn('Subscription checkout already consumed', {
        source: 'subscription-checkout-service',
        event: 'subscription.checkout.duplicate',
        checkoutId: id
      })

      throw new SubscriptionCheckoutAlreadyConsumedError()
    }

    const consumed = await checkoutRepository.consume(id)

    logger.info('Subscription checkout consumed', {
      source: 'subscription-checkout-service',
      event: 'subscription.checkout.consumed',
      checkoutId: id,
      userId: consumed.userId
    })

    return consumed
  }

  return { createCheckout, consumeCheckout }
}
