import { PayrexxSubscriptionWebhookSchema } from '@infrastructure/validation/payrexx-subscription-webhook'
import { definePublicHandler } from '@infrastructure/handlers/public-handler'
import { verifyPayrexxWebhookSignature } from '@infrastructure/http/payrexx-webhook-signature'
import { mapPayrexxWebhookToSyncSubscriptionInput } from '@infrastructure/mappers/payrexx-subscription-webhook-mapper'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import { syncPayrexxSubscriptionWebhook } from '@infrastructure/composition'

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

  const rawBody = await readRawBody(event)

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
  const syncInput = mapPayrexxWebhookToSyncSubscriptionInput(webhook)

  return syncPayrexxSubscriptionWebhook(syncInput)
})
