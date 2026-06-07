import { createExperiment } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { toExperimentResponseDto } from '@infrastructure/mappers/experiment-mapper'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  CreateExperimentBodySchema,
  ExperimentCollectionRouteParamsSchema,
  type ExperimentResponseDto
} from '@infrastructure/validation/experiment-schemas'

/**
 * Creates one experiment for a specific hypothesis owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<ExperimentResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.hypotheses.experiments.create',
    maxRequests: 30,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, ExperimentCollectionRouteParamsSchema.parse)
  const body = await readValidatedBody(event, CreateExperimentBodySchema.parse)

  const experiment = await createExperiment({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId,
    hypothesisId: params.hypothesisId,
    title: body.title,
    description: body.description,
    status: body.status
  })

  setResponseStatus(event, 201)

  return toExperimentResponseDto(experiment)
})
