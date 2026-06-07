import { deleteExperiment } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import { ExperimentRouteParamsSchema } from '@infrastructure/validation/experiment-schemas'

/**
 * Deletes one experiment owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<void> => {
  await enforceRateLimit(event, {
    name: 'ideas.hypotheses.experiments.delete',
    maxRequests: 30,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, ExperimentRouteParamsSchema.parse)

  await deleteExperiment({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId,
    hypothesisId: params.hypothesisId,
    experimentId: params.experimentId
  })

  setResponseStatus(event, 204)
})
