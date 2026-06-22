import type { H3Event } from 'h3'
import type { Logger } from '@interfaces/logger'
import type { PayrexxSubscriptionWebhook } from '@infrastructure/validation/payrexx-subscription-webhook'
import { PayrexxSubscriptionWebhookSchema } from '@infrastructure/validation/payrexx-subscription-webhook'
import { verifyPayrexxWebhookSignature } from '@infrastructure/http/payrexx-webhook-signature'

type TransactionPayload = {
  transaction?: {
    subscription?: unknown
  }
}

/**
 * Reads, verifies, and validates a Payrexx subscription webhook request.
 *
 * Returns null when the webhook explicitly reports a null subscription payload.
 */
export const readVerifiedPayrexxSubscriptionWebhook = async (
  event: H3Event,
  logger: Logger
): Promise<PayrexxSubscriptionWebhook | null> => {
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

  const payload = await readBody(event)
  const transactionPayload = payload as TransactionPayload

  if (transactionPayload.transaction?.subscription === null) {
    logger.info('Webhook ignored because transaction subscription is null', {
      source: 'payrexx-subscription-webhook',
      event: 'payrexx.subscription_webhook.ignored_null_subscription'
    })
    return null
  }

  const parsedWebhook = PayrexxSubscriptionWebhookSchema.safeParse(payload)

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

  return parsedWebhook.data
}
