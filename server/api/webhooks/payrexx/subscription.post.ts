import { PayrexxSubscriptionWebhookSchema } from '@infrastructure/validation/payrexx-subscription-webhook'
import { definePublicHandler } from '@infrastructure/handlers/public-handler'
import { verifyPayrexxWebhookSignature } from '@infrastructure/http/payrexx-webhook-signature'
import {
  mapPayrexxWebhookToProviderSyncInput,
  mapPayrexxWebhookToSyncSubscriptionInput
} from '@infrastructure/mappers/payrexx-subscription-webhook-mapper'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import { subscriptionWebhookSyncService, subscriptionCheckoutService } from '@infrastructure/composition'
import { SubscriptionCheckoutAlreadyConsumedError, SubscriptionCheckoutNotFoundError } from '@application/errors/subscription-errors'
import { logger } from '@infrastructure/logging/logger'

type TransactionPayload = {
  transaction?: {
    subscription?: unknown
  }
}

export default definePublicHandler(async (event) => {
  await enforceRateLimit(event, {
    name: 'payrexx.subscription_webhook',
    maxRequests: 30,
    windowSeconds: 60,
    scope: 'ip'
  })

  const runtimeConfig = useRuntimeConfig(event)
  const signingKey = runtimeConfig.payrexxWebhookSecret

  if (!signingKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Payrexx webhook secret is not configured'
    })
  }

  const rawBody = await readRawBody(event, false)

  if (!rawBody) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing webhook body'
    })
  }

  const signature = getRequestHeader(event, 'x-webhook-signature')

  if (!signature || !verifyPayrexxWebhookSignature(rawBody, signature, signingKey)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid Payrexx webhook signature'
    })
  }

  const parsedBody = await readBody(event)
  const transactionPayload = parsedBody as TransactionPayload

  if (transactionPayload.transaction?.subscription === null) {
    logger.info('Webhook ignored because transaction subscription is null', {
      source: 'payrexx-subscription-webhook',
      event: 'payrexx.subscription_webhook.ignored_null_subscription'
    })
    return { ok: true }
  }

  const parsedWebhook = PayrexxSubscriptionWebhookSchema.safeParse(parsedBody)

  if (!parsedWebhook.success) {
    logger.warn('Invalid Payrexx subscription webhook payload', {
      source: 'payrexx-subscription-webhook',
      event: 'payrexx.subscription_webhook.invalid_payload',
      issues: parsedWebhook.error.issues
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid Payrexx subscription webhook payload'
    })
  }

  const webhook = parsedWebhook.data
  const checkoutId = webhook.invoice.referenceId
  const providerSyncInput = mapPayrexxWebhookToProviderSyncInput(webhook)

  let checkout
  try {
    checkout = await subscriptionCheckoutService.consumeCheckout(checkoutId)
  } catch (error) {
    if (error instanceof SubscriptionCheckoutAlreadyConsumedError) {
      logger.info('Subscription webhook received for an already consumed checkout', {
        source: 'payrexx-subscription-webhook',
        event: 'payrexx.subscription_webhook.consumed_checkout_fallback',
        checkoutId
      })

      const synced = await subscriptionWebhookSyncService.syncSubscriptionStateByProvider(providerSyncInput)
      return synced ?? { ok: true }
    }

    if (error instanceof SubscriptionCheckoutNotFoundError) {
      logger.warn('Unknown checkout id in webhook; trying provider identifier fallback', {
        source: 'payrexx-subscription-webhook',
        event: 'payrexx.subscription_webhook.unknown_checkout_fallback',
        checkoutId
      })

      const synced = await subscriptionWebhookSyncService.syncSubscriptionStateByProvider(providerSyncInput)
      return synced ?? { ok: true }
    }

    throw error
  }

  const syncInput = mapPayrexxWebhookToSyncSubscriptionInput(webhook, checkout.userId, checkoutId)

  return subscriptionWebhookSyncService.syncSubscriptionState(syncInput)
})
