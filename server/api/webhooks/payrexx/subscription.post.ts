import { PayrexxSubscriptionWebhookSchema } from '@infrastructure/validation/payrexx-subscription-webhook'
import { definePublicHandler } from '@infrastructure/handlers/public-handler'
import { verifyPayrexxWebhookSignature } from '@infrastructure/http/payrexx-webhook-signature'
import { mapPayrexxWebhookToSyncSubscriptionInput } from '@infrastructure/mappers/payrexx-subscription-webhook-mapper'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import { syncPayrexxSubscriptionWebhook, subscriptionCheckoutService } from '@infrastructure/composition'
import { SubscriptionCheckoutAlreadyConsumedError, SubscriptionCheckoutNotFoundError } from '@application/errors/subscription-errors'
import { logger } from '@infrastructure/logging/logger'

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
  const webhook = PayrexxSubscriptionWebhookSchema.parse(parsedBody)
  const checkoutId = webhook.invoice.referenceId

  let checkout
  try {
    checkout = await subscriptionCheckoutService.consumeCheckout(checkoutId)
  } catch (error) {
    if (error instanceof SubscriptionCheckoutAlreadyConsumedError) {
      logger.warn('Duplicate subscription webhook ignored', {
        source: 'payrexx-subscription-webhook',
        event: 'payrexx.subscription_webhook.duplicate',
        checkoutId
      })
      return { ok: true }
    }

    if (error instanceof SubscriptionCheckoutNotFoundError) {
      logger.warn('Unknown checkout id in webhook', {
        source: 'payrexx-subscription-webhook',
        event: 'payrexx.subscription_webhook.unknown_checkout',
        checkoutId
      })
      throw createError({ statusCode: 400, statusMessage: 'Unknown checkout reference' })
    }

    throw error
  }

  const syncInput = mapPayrexxWebhookToSyncSubscriptionInput(webhook, checkout.userId, checkoutId)

  return syncPayrexxSubscriptionWebhook(syncInput)
})
