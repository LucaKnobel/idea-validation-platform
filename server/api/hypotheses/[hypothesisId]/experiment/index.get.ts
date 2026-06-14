import { getHypothesisExperiment } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { toExperimentResponseDto } from '@infrastructure/mappers/experiment-mapper'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import type { ExperimentResponseDto } from '@infrastructure/validation/experiment-schemas'
import { HypothesisIdRouteParamsSchema } from '@infrastructure/validation/route-params-schemas'

/**
 * Returns the experiment singleton for a specific hypothesis owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<ExperimentResponseDto> => {
  await enforceRateLimit(event, {
    name: 'hypotheses.experiment.get',
    maxRequests: 120,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, HypothesisIdRouteParamsSchema.parse)

  const experiment = await getHypothesisExperiment({
    userId,
    hypothesisId: params.hypothesisId
  })

  setResponseStatus(event, 200)

  return toExperimentResponseDto(experiment)
})
