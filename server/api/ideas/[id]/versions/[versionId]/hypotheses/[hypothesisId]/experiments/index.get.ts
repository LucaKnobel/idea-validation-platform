import { getHypothesisExperiments } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { toExperimentsListResponseDto } from '@infrastructure/mappers/experiment-mapper'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  ExperimentCollectionRouteParamsSchema,
  type ExperimentsListResponseDto
} from '@infrastructure/validation/experiment-schemas'

/**
 * Returns all experiments for a specific hypothesis owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<ExperimentsListResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.hypotheses.experiments.list',
    maxRequests: 120,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, ExperimentCollectionRouteParamsSchema.parse)

  const experiments = await getHypothesisExperiments({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId,
    hypothesisId: params.hypothesisId
  })

  return toExperimentsListResponseDto(experiments)
})
