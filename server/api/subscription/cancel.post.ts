import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  CancelSubscriptionResponseSchema,
  type CancelSubscriptionResponseDto
} from '@infrastructure/validation/subscription-schemas'
import { cancelSubscription } from '@infrastructure/composition'

/**
 * Cancels the authenticated user's PRO subscription.
 */
export default defineProtectedHandler(async (event, userId): Promise<CancelSubscriptionResponseDto> => {
  await enforceRateLimit(event, {
    name: 'subscription.cancel',
    maxRequests: 5,
    windowSeconds: 60,
    scope: 'user'
  })

  const updated = await cancelSubscription({ userId })

  return CancelSubscriptionResponseSchema.parse({
    status: updated.status,
    currentPeriodEnd: updated.currentPeriodEnd ? updated.currentPeriodEnd.toISOString() : null
  })
})
