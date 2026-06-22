import { definePublicHandler } from '@infrastructure/handlers/public-handler'
import { readVerifiedPayrexxSubscriptionWebhook } from '@infrastructure/http/read-verified-payrexx-subscription-webhook'
import {
  mapPayrexxWebhookToProviderSyncInput
} from '@infrastructure/mappers/payrexx-subscription-webhook-mapper'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import { processPayrexxSubscriptionWebhook } from '@infrastructure/composition'
import { logger } from '@infrastructure/logging/logger'

/**
 * Handles Payrexx subscription webhooks.
 *
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
  const providerSyncInput = mapPayrexxWebhookToProviderSyncInput(webhook)

  const synced = await processPayrexxSubscriptionWebhook({
    checkoutId,
    providerSyncInput
  })

  return synced ?? { ok: true }
})
