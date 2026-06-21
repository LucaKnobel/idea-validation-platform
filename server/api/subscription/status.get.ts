import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  SubscriptionStatusResponseSchema,
  type SubscriptionStatusResponseDto
} from '@infrastructure/validation/subscription-schemas'
import { subscriptionService } from '@infrastructure/composition'

/**
 * Returns the authenticated user's current subscription status.
 */
export default defineProtectedHandler(async (event, userId): Promise<SubscriptionStatusResponseDto> => {
  await enforceRateLimit(event, {
    name: 'subscription.status',
    maxRequests: 30,
    windowSeconds: 60,
    scope: 'user'
  })

  const subscription = await subscriptionService.getByUserId(userId)
  const isPro = await subscriptionService.isPro(userId)

  return SubscriptionStatusResponseSchema.parse({
    plan: subscription?.plan ?? null,
    status: subscription?.status ?? null,
    currentPeriodEnd: subscription?.currentPeriodEnd ? subscription.currentPeriodEnd.toISOString() : null,
    isPro
  })
})
