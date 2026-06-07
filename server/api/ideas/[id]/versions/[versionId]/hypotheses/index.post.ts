import { setResponseStatus } from 'h3'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  CreateHypothesisBodySchema,
  HypothesisVersionRouteParamsSchema,
  type HypothesisResponseDto
} from '@infrastructure/validation/hypothesis-schemas'
import { createHypothesis } from '@infrastructure/composition'
import { toHypothesisResponseDto } from '@infrastructure/mappers/hypothesis-mapper'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'

/**
 * Creates one hypothesis in a specific idea version owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<HypothesisResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.hypotheses.create',
    maxRequests: 30,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, HypothesisVersionRouteParamsSchema.parse)
  const body = await readValidatedBody(event, CreateHypothesisBodySchema.parse)

  const hypothesis = await createHypothesis({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId,
    statement: body.statement,
    dimension: body.dimension,
    priority: body.priority,
    canvasSectionTypes: body.canvasSectionTypes
  })

  setResponseStatus(event, 201)
  return toHypothesisResponseDto(hypothesis)
})
