import { setResponseStatus } from 'h3'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import { IdeaRouteParamsSchema } from '@infrastructure/validation/idea-schemas'
import { deleteIdea } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'

/**
 * Deletes one idea owned by the authenticated user.
 */
export default defineProtectedHandler(async (event, userId): Promise<void> => {
  await enforceRateLimit(event, {
    name: 'ideas.delete',
    maxRequests: 10,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, IdeaRouteParamsSchema.parse)

  await deleteIdea({
    userId,
    ideaId: params.id
  })

  setResponseStatus(event, 204)
})
