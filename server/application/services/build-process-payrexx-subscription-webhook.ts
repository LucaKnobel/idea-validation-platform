import type { Logger } from '@interfaces/logger'
import type { Subscription } from '@application/models/subscription'
import type { SubscriptionCheckout } from '@application/models/subscription-checkout'
import type {
  SyncSubscriptionByProviderInput,
  SyncSubscriptionInput
} from '@application/services/build-subscription-webhook-sync-service'
import {
  SubscriptionCheckoutAlreadyConsumedError,
  SubscriptionCheckoutNotFoundError
} from '@application/errors/subscription-errors'

type SubscriptionCheckoutService = {
  consumeCheckout(id: string): Promise<SubscriptionCheckout>
}

type SubscriptionWebhookSyncService = {
  syncSubscriptionState(input: SyncSubscriptionInput): Promise<Subscription>
  syncSubscriptionStateByProvider(input: SyncSubscriptionByProviderInput): Promise<Subscription | null>
}

export type ProcessPayrexxSubscriptionWebhookInput = {
  checkoutId: string
  providerSyncInput: SyncSubscriptionByProviderInput
}

/**
 * Builds the webhook orchestration use case for Payrexx subscription events.
 *
 * Flow:
 * 1. Try to consume the checkout reference and sync by user ID.
 * 2. If checkout is unknown/already consumed, fallback to provider identifiers.
 */
export const buildProcessPayrexxSubscriptionWebhook = (
  subscriptionCheckoutService: SubscriptionCheckoutService,
  subscriptionWebhookSyncService: SubscriptionWebhookSyncService,
  logger: Logger
) => {
  return async (
    input: ProcessPayrexxSubscriptionWebhookInput
  ): Promise<Subscription | null> => {
    try {
      const checkout = await subscriptionCheckoutService.consumeCheckout(input.checkoutId)

      return subscriptionWebhookSyncService.syncSubscriptionState({
        userId: checkout.userId,
        checkoutId: input.checkoutId,
        status: input.providerSyncInput.status,
        providerCustomerId: input.providerSyncInput.providerCustomerId,
        providerSubscriptionId: input.providerSyncInput.providerSubscriptionId,
        currentPeriodEnd: input.providerSyncInput.currentPeriodEnd
      })
    } catch (error) {
      if (error instanceof SubscriptionCheckoutAlreadyConsumedError) {
        logger.info('Subscription webhook received for an already consumed checkout', {
          source: 'process-payrexx-subscription-webhook',
          event: 'subscription.webhook.consumed_checkout_fallback',
          checkoutId: input.checkoutId
        })

        return subscriptionWebhookSyncService.syncSubscriptionStateByProvider(input.providerSyncInput)
      }

      if (error instanceof SubscriptionCheckoutNotFoundError) {
        logger.warn('Unknown checkout id in webhook; trying provider identifier fallback', {
          source: 'process-payrexx-subscription-webhook',
          event: 'subscription.webhook.unknown_checkout_fallback',
          checkoutId: input.checkoutId
        })

        return subscriptionWebhookSyncService.syncSubscriptionStateByProvider(input.providerSyncInput)
      }

      throw error
    }
  }
}
