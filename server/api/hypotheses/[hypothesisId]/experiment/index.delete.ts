import { deleteExperiment } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import { HypothesisIdRouteParamsSchema } from '@infrastructure/validation/route-params-schemas'

/**
 * Deletes the experiment singleton for a specific hypothesis owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<void> => {
  await enforceRateLimit(event, {
    name: 'hypotheses.experiment.delete',
    maxRequests: 30,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, HypothesisIdRouteParamsSchema.parse)

  await deleteExperiment({
    userId,
    hypothesisId: params.hypothesisId
  })

  setResponseStatus(event, 204)
})
