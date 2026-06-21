import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  SubscriptionCheckoutUrlResponseSchema,
  type SubscriptionCheckoutUrlResponseDto
} from '@infrastructure/validation/subscription-schemas'

/**
 * Returns a checkout URL with server-side referenceId binding for the authenticated user.
 */
export default defineProtectedHandler(async (event, userId): Promise<SubscriptionCheckoutUrlResponseDto> => {
  await enforceRateLimit(event, {
    name: 'subscription.checkout_url',
    maxRequests: 20,
    windowSeconds: 60,
    scope: 'user'
  })

  const runtimeConfig = useRuntimeConfig(event)
  const baseCheckoutUrl = runtimeConfig.public.payrexxProPageUrl

  if (!baseCheckoutUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Payrexx checkout URL is not configured'
    })
  }

  let checkoutUrl: URL

  try {
    checkoutUrl = new URL(baseCheckoutUrl)
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Payrexx checkout URL is invalid'
    })
  }

  checkoutUrl.searchParams.set('referenceId', userId)

  return SubscriptionCheckoutUrlResponseSchema.parse({
    checkoutUrl: checkoutUrl.toString()
  })
})
