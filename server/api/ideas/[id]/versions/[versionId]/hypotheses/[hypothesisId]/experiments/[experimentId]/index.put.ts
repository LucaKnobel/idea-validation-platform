import { updateExperiment } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { toExperimentResponseDto } from '@infrastructure/mappers/experiment-mapper'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import { HypothesisIdRouteParamsSchema } from '@infrastructure/validation/route-params-schemas'
import {
  UpdateExperimentBodySchema,
  type ExperimentResponseDto
} from '@infrastructure/validation/experiment-schemas'

/**
 * Updates one experiment owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<ExperimentResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.hypotheses.experiments.update',
    maxRequests: 60,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, HypothesisIdRouteParamsSchema.parse)
  const body = await readValidatedBody(event, UpdateExperimentBodySchema.parse)

  const experiment = await updateExperiment({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId,
    hypothesisId: params.hypothesisId,
    experimentId: params.experimentId,
    title: body.title,
    description: body.description,
    status: body.status
  })

  return toExperimentResponseDto(experiment)
})
