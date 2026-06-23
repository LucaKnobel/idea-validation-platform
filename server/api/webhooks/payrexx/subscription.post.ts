import { definePublicHandler } from '@infrastructure/handlers/public-handler'
import { readVerifiedPayrexxSubscriptionWebhook } from '@infrastructure/http/read-verified-payrexx-subscription-webhook'
import {
  mapPayrexxWebhookToUpsertInput
} from '@infrastructure/mappers/payrexx-subscription-webhook-mapper'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import { resolveSubscriptionWebhookUserId, subscriptionWebhookSyncService } from '@infrastructure/composition'
import { logger } from '@infrastructure/logging/logger'
import { SubscriptionWebhookActiveCheckoutReferenceMissingError } from '@application/errors/subscription-errors'

/**
 * Receives Payrexx subscription webhooks.
 *
 * Handles two distinct flows:
 * 1. Active subscription (status='active'): First webhook after payment → consume checkout
 * 2. Changed/cancelled subscription (status!='active'): Follow-up state change → resolve by provider ID
 *
 * Returns 200 OK for all valid webhooks (idempotent).
 * Throws on invalid signature, missing checkout reference (for active), or downstream errors.
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

  const providerSubscriptionId = String(webhook.id)
  let userId: string | null = null

  try {
    userId = await resolveSubscriptionWebhookUserId({
      webhookStatus: webhook.status,
      checkoutReferenceId: webhook.invoice.referenceId,
      providerSubscriptionId
    })
  } catch (error) {
    if (error instanceof SubscriptionWebhookActiveCheckoutReferenceMissingError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing checkout reference in active subscription webhook'
      })
    }

    throw error
  }

  if (!userId) {
    return { ok: true }
  }

  // Map webhook to internal upsert input with resolved user ID
  const upsertInput = mapPayrexxWebhookToUpsertInput(webhook, userId)

  // Sync subscription state
  await subscriptionWebhookSyncService.upsert(upsertInput)

  return { ok: true }
})
