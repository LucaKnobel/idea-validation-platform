import type { SubscriptionCheckout } from '@application/models/subscription-checkout'
import type { SubscriptionCheckoutRepository } from '@application/interfaces/subscription-checkout-repository'
import type { SubscriptionCheckoutService } from '@application/interfaces/subscription-checkout-service'
import type { Logger } from '@interfaces/logger'
import {
  SubscriptionCheckoutNotFoundError,
  SubscriptionCheckoutAlreadyConsumedError
} from '@application/errors/subscription-errors'

/**
 * Manages checkout lifecycle: creates before payment, consumes after provider confirms.
 * Decouples user action from provider callback, prevents double-charging via idempotency.
 */
export const buildSubscriptionCheckoutService = (
  checkoutRepository: SubscriptionCheckoutRepository,
  logger: Logger
): SubscriptionCheckoutService => {
  /**
   * Creates checkout record. ID sent to Payrexx as referenceId, webhook links back to user.
   */
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

  /**
   * Marks checkout as paid, returns userId. Throws if not found or already consumed.
   */
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
