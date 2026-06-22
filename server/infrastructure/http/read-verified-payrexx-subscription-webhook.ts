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
 * Loads the webhook signing secret. Missing config is a server misconfiguration.
 */
const requireWebhookSigningKey = (event: H3Event): string => {
  const runtimeConfig = useRuntimeConfig(event)
  const signingKey = runtimeConfig.payrexxWebhookSecret

  if (!signingKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Payrexx webhook secret is not configured'
    })
  }

  return signingKey
}

/**
 * Reads the raw webhook body used for signature verification.
 */
const requireRawWebhookBody = async (event: H3Event): Promise<string> => {
  const rawBody = await readRawBody(event, false)

  if (!rawBody) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing webhook body'
    })
  }

  return typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8')
}

/**
 * Rejects requests that are not signed by Payrexx.
 */
const verifyWebhookSignature = (
  event: H3Event,
  rawBody: string,
  signingKey: string
): void => {
  const signature = getRequestHeader(event, 'x-webhook-signature')

  if (!signature || !verifyPayrexxWebhookSignature(rawBody, signature, signingKey)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid Payrexx webhook signature'
    })
  }
}

/**
 * Identifies housekeeping webhooks that carry no subscription payload.
 */
const isNullSubscriptionWebhook = (payload: unknown): boolean => {
  const transactionPayload = payload as TransactionPayload

  return transactionPayload.transaction?.subscription === null
}

/**
 * Verifies webhook signature, validates payload. Returns null if subscription is null (idempotent).
 * Throws 401 if signature invalid, 400 if invalid payload, 500 if config missing.
 */
export const readVerifiedPayrexxSubscriptionWebhook = async (
  event: H3Event,
  logger: Logger
): Promise<PayrexxSubscriptionWebhook | null> => {
  const signingKey = requireWebhookSigningKey(event)
  const rawBody = await requireRawWebhookBody(event)

  verifyWebhookSignature(event, rawBody, signingKey)

  const payload = await readBody(event)

  if (isNullSubscriptionWebhook(payload)) {
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
