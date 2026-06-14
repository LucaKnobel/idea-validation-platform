import { updateHypothesis } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { toHypothesisResponseDto } from '@infrastructure/mappers/hypothesis-mapper'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  UpsertHypothesisBodySchema,
  type HypothesisResponseDto
} from '@infrastructure/validation/hypothesis-schemas'
import { HypothesisIdRouteParamsSchema } from '@infrastructure/validation/route-params-schemas'

/**
 * Updates one hypothesis owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<HypothesisResponseDto> => {
  await enforceRateLimit(event, {
    name: 'hypotheses.put',
    maxRequests: 60,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, HypothesisIdRouteParamsSchema.parse)
  const body = await readValidatedBody(event, UpsertHypothesisBodySchema.parse)

  const hypothesis = await updateHypothesis({
    userId,
    hypothesisId: params.hypothesisId,
    statement: body.statement,
    dimension: body.dimension,
    priority: body.priority,
    evidenceType: body.evidenceType,
    canvasElementTypes: body.canvasElementTypes
  })

  setResponseStatus(event, 200)

  return toHypothesisResponseDto(hypothesis)
})
