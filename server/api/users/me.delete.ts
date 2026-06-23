import { deleteAccount } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'

/**
 * Permanently deletes the authenticated user account.
 */
export default defineProtectedHandler(async (event, userId): Promise<void> => {
  await enforceRateLimit(event, {
    name: 'account.delete',
    maxRequests: 3,
    windowSeconds: 60,
    scope: 'user'
  })

  await deleteAccount({ userId })

  setResponseStatus(event, 204)
})
