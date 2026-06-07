import { setResponseStatus } from 'h3'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import { HypothesisRouteParamsSchema } from '@infrastructure/validation/hypothesis-schemas'
import { deleteHypothesis } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'

/**
 * Deletes one hypothesis for a specific idea version owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<void> => {
  await enforceRateLimit(event, {
    name: 'ideas.hypotheses.delete',
    maxRequests: 30,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, HypothesisRouteParamsSchema.parse)

  await deleteHypothesis({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId,
    hypothesisId: params.hypothesisId
  })

  setResponseStatus(event, 204)
})
