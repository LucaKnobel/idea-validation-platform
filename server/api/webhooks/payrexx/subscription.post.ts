import { definePublicHandler } from '@infrastructure/handlers/public-handler'
import { readVerifiedPayrexxSubscriptionWebhook } from '@infrastructure/http/read-verified-payrexx-subscription-webhook'
import {
  mapPayrexxWebhookToUpsertInput
} from '@infrastructure/mappers/payrexx-subscription-webhook-mapper'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import { subscriptionCheckoutService, subscriptionWebhookSyncService } from '@infrastructure/composition'
import { logger } from '@infrastructure/logging/logger'

/**
 * Receives Payrexx subscription webhooks.
 *
 * Pipeline: Verify signature → Validate payload → Resolve user from checkout → Sync subscription state.
 *
 * Returns 200 OK if webhook processed or null subscription (idempotent).
 * Throws on invalid signature, missing checkout, or downstream errors.
 */
export default definePublicHandler(async (event) => {
  await enforceRateLimit(event, {
    name: 'payrexx.subscription_webhook',
    maxRequests: 30,
    windowSeconds: 60,
    scope: 'ip'
  })

  const webhook = await readVerifiedPayrexxSubscriptionWebhook(event, logger)

  if (!webhook) {
    return { ok: true }
  }

  const checkoutId = webhook.invoice.referenceId

  if (!checkoutId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing checkout reference in Payrexx webhook'
    })
  }

  // Consume checkout to resolve user ID
  const checkout = await subscriptionCheckoutService.consumeCheckout(checkoutId)

  // Map webhook to internal upsert input with resolved user ID
  const upsertInput = mapPayrexxWebhookToUpsertInput(webhook, checkout.userId)

  // Sync subscription state
  await subscriptionWebhookSyncService.upsert(upsertInput)

  return { ok: true }
})
