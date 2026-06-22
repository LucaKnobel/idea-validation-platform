import type { Logger } from '@interfaces/logger'
import type { Subscription } from '@application/models/subscription'
import type { SubscriptionCheckoutService } from '@application/interfaces/subscription-checkout-service'
import type { SubscriptionWebhookSyncService, SubscriptionUpsertByProviderInput } from '@application/interfaces/subscription-webhook-sync-service'
import {
  SubscriptionCheckoutAlreadyConsumedError,
  SubscriptionCheckoutNotFoundError
} from '@application/errors/subscription-errors'

export type ProcessSubscriptionWebhookInput = {
  checkoutId: string
  providerUpdate: SubscriptionUpsertByProviderInput
}

/**
 * Builds the webhook orchestration use case for subscription provider events.
 *
 * Flow:
 * 1. Try to consume the checkout reference and upsert by user ID.
 * 2. If checkout is unknown/already consumed, fallback to provider identifiers.
 */
export const buildProcessSubscriptionWebhook = (
  subscriptionCheckoutService: SubscriptionCheckoutService,
  subscriptionWebhookSyncService: SubscriptionWebhookSyncService,
  logger: Logger
) => {
  return async (
    input: ProcessSubscriptionWebhookInput
  ): Promise<Subscription | null> => {
    try {
      const checkout = await subscriptionCheckoutService.consumeCheckout(input.checkoutId)

      return subscriptionWebhookSyncService.upsertByCheckout({
        userId: checkout.userId,
        checkoutId: input.checkoutId,
        status: input.providerUpdate.status,
        providerCustomerId: input.providerUpdate.providerCustomerId,
        providerSubscriptionId: input.providerUpdate.providerSubscriptionId,
        currentPeriodEnd: input.providerUpdate.currentPeriodEnd
      })
    } catch (error) {
      if (error instanceof SubscriptionCheckoutAlreadyConsumedError) {
        logger.info('Subscription webhook received for an already consumed checkout', {
          source: 'process-subscription-webhook',
          event: 'subscription.webhook.consumed_checkout_fallback',
          checkoutId: input.checkoutId
        })

        return subscriptionWebhookSyncService.upsertByProvider(input.providerUpdate)
      }

      if (error instanceof SubscriptionCheckoutNotFoundError) {
        logger.warn('Unknown checkout id in webhook; trying provider identifier fallback', {
          source: 'process-subscription-webhook',
          event: 'subscription.webhook.unknown_checkout_fallback',
          checkoutId: input.checkoutId
        })

        return subscriptionWebhookSyncService.upsertByProvider(input.providerUpdate)
      }

      throw error
    }
  }
}
