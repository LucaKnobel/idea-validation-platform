import { setResponseStatus } from 'h3'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import { createHypothesis } from '@infrastructure/composition'
import { toHypothesisResponseDto } from '@infrastructure/mappers/hypothesis-mapper'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import {
  UpsertHypothesisBodySchema,
  type HypothesisResponseDto
} from '@infrastructure/validation/hypothesis-schemas'
import { IdeaVersionRouteParamsSchema } from '@infrastructure/validation/route-params-schemas'

/**
 * Creates one hypothesis for one owned idea version.
 */
export default defineProtectedHandler(async (event, userId): Promise<HypothesisResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.hypotheses.create',
    maxRequests: 30,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, IdeaVersionRouteParamsSchema.parse)
  const body = await readValidatedBody(event, UpsertHypothesisBodySchema.parse)

  const hypothesis = await createHypothesis({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId,
    statement: body.statement,
    dimension: body.dimension,
    priority: body.priority,
    evidenceType: body.evidenceType,
    canvasElementTypes: body.canvasElementTypes
  })

  setResponseStatus(event, 201)
  return toHypothesisResponseDto(hypothesis)
})
