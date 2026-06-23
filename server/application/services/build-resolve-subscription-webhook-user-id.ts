import type { Logger } from '@interfaces/logger'
import type { SubscriptionCheckoutService } from '@application/interfaces/subscription-checkout-service'
import type { SubscriptionRepository } from '@application/interfaces/subscription-repository'
import {
  SubscriptionWebhookActiveCheckoutReferenceMissingError,
  SubscriptionCheckoutNotFoundError,
  SubscriptionCheckoutAlreadyConsumedError
} from '@application/errors/subscription-errors'

type ResolveSubscriptionWebhookUserIdInput = {
  webhookStatus: 'active' | 'overdue' | 'failed' | 'cancelled' | 'in_notice'
  checkoutReferenceId: string | null | undefined
  providerSubscriptionId: string
}

const SOURCE = 'payrexx-subscription-webhook'

/**
 * Try to resolve user by consuming a checkout (primary path for active webhooks).
 *
 * Returns userId if successful.
 * Returns null if checkout not found or already consumed (will trigger fallback).
 * Throws for unexpected errors.
 */
const tryConsumeCheckout = async (
  checkoutId: string,
  subscriptionCheckoutService: SubscriptionCheckoutService,
  logger: Logger
): Promise<string | null> => {
  try {
    const checkout = await subscriptionCheckoutService.consumeCheckout(checkoutId)
    return checkout.userId
  } catch (error) {
    if (error instanceof SubscriptionCheckoutNotFoundError) {
      logger.debug('Checkout not found, will use provider subscription lookup', {
        source: SOURCE,
        event: 'webhook.checkout_not_found',
        checkoutId
      })
      return null
    }

    if (error instanceof SubscriptionCheckoutAlreadyConsumedError) {
      logger.debug('Checkout already consumed (duplicate webhook), will use provider subscription lookup', {
        source: SOURCE,
        event: 'webhook.checkout_duplicate',
        checkoutId
      })
      return null
    }

    // Unexpected error, propagate
    throw error
  }
}

/**
 * Fallback: resolve user by looking up provider subscription.
 *
 * Returns userId if found, null if not.
 */
const lookupByProviderSubscriptionId = async (
  providerSubscriptionId: string,
  subscriptionRepository: SubscriptionRepository,
  logger: Logger
): Promise<string | null> => {
  const subscription = await subscriptionRepository.findByProviderSubscriptionId(
    providerSubscriptionId
  )

  if (!subscription) {
    logger.warn('Could not resolve user from provider subscription', {
      source: SOURCE,
      event: 'webhook.provider_subscription_not_found',
      providerSubscriptionId
    })
    return null
  }

  return subscription.userId
}

/**
 * Resolve user from active webhook.
 *
 * Primary: consume checkout (links to user who initiated purchase).
 * Fallback: lookup by provider subscription (if checkout missing or duplicate).
 *
 * Returns userId or null if unresolvable.
 * Throws SubscriptionWebhookActiveCheckoutReferenceMissingError if active but no checkout reference.
 */
const resolveActiveWebhookUser = async (
  input: ResolveSubscriptionWebhookUserIdInput,
  subscriptionCheckoutService: SubscriptionCheckoutService,
  subscriptionRepository: SubscriptionRepository,
  logger: Logger
): Promise<string | null> => {
  if (!input.checkoutReferenceId) {
    throw new SubscriptionWebhookActiveCheckoutReferenceMissingError()
  }

  // Primary path: consume checkout
  const checkoutUserId = await tryConsumeCheckout(
    input.checkoutReferenceId,
    subscriptionCheckoutService,
    logger
  )

  if (checkoutUserId) {
    logger.info('Resolved user from active webhook (checkout consumed)', {
      source: SOURCE,
      event: 'webhook.active_resolved_by_checkout',
      checkoutId: input.checkoutReferenceId,
      providerSubscriptionId: input.providerSubscriptionId,
      userId: checkoutUserId
    })
    return checkoutUserId
  }

  // Fallback: lookup by provider subscription
  const providerUserId = await lookupByProviderSubscriptionId(
    input.providerSubscriptionId,
    subscriptionRepository,
    logger
  )

  if (providerUserId) {
    logger.info('Resolved user from active webhook (provider subscription lookup)', {
      source: SOURCE,
      event: 'webhook.active_resolved_by_provider',
      checkoutId: input.checkoutReferenceId,
      providerSubscriptionId: input.providerSubscriptionId,
      userId: providerUserId
    })
  }

  return providerUserId
}

/**
 * Resolve user from non-active webhook (status change: overdue, failed, cancelled, in_notice).
 *
 * Lookup by provider subscription (these webhooks don't include checkout reference).
 *
 * Returns userId or null if unresolvable.
 */
const resolveNonActiveWebhookUser = async (
  input: ResolveSubscriptionWebhookUserIdInput,
  subscriptionRepository: SubscriptionRepository,
  logger: Logger
): Promise<string | null> => {
  const userId = await lookupByProviderSubscriptionId(
    input.providerSubscriptionId,
    subscriptionRepository,
    logger
  )

  if (userId) {
    logger.info('Resolved user from non-active webhook', {
      source: SOURCE,
      event: 'webhook.non_active_resolved',
      webhookStatus: input.webhookStatus,
      providerSubscriptionId: input.providerSubscriptionId,
      userId
    })
  }

  return userId
}

/**
 * Resolves user id for Payrexx subscription webhooks across purchase and follow-up status flows.
 *
 * Two distinct flows:
 * - Active (purchase): checkout + fallback to provider subscription
 * - Non-active (state change): provider subscription only
 */
export const buildResolveSubscriptionWebhookUserId = (
  subscriptionCheckoutService: SubscriptionCheckoutService,
  subscriptionRepository: SubscriptionRepository,
  logger: Logger
) => {
  return async (input: ResolveSubscriptionWebhookUserIdInput): Promise<string | null> => {
    if (input.webhookStatus === 'active') {
      return resolveActiveWebhookUser(
        input,
        subscriptionCheckoutService,
        subscriptionRepository,
        logger
      )
    }

    return resolveNonActiveWebhookUser(input, subscriptionRepository, logger)
  }
}
