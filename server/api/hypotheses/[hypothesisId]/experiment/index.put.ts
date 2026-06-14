import { upsertExperiment } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { toExperimentResponseDto } from '@infrastructure/mappers/experiment-mapper'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import { HypothesisIdRouteParamsSchema } from '@infrastructure/validation/route-params-schemas'
import {
  UpsertExperimentBodySchema,
  type ExperimentResponseDto
} from '@infrastructure/validation/experiment-schemas'

/**
 * Creates or updates the experiment singleton for a specific hypothesis owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<ExperimentResponseDto> => {
  await enforceRateLimit(event, {
    name: 'hypotheses.experiment.put',
    maxRequests: 60,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, HypothesisIdRouteParamsSchema.parse)
  const body = await readValidatedBody(event, UpsertExperimentBodySchema.parse)

  const experiment = await upsertExperiment({
    userId,
    hypothesisId: params.hypothesisId,
    title: body.title,
    description: body.description,
    status: body.status
  })

  setResponseStatus(event, 200)

  return toExperimentResponseDto(experiment)
})
