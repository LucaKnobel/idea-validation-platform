import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  HypothesisRouteParamsSchema,
  type HypothesisResponseDto
} from '@infrastructure/validation/hypothesis-schemas'
import { getHypothesis } from '@infrastructure/composition'
import { toHypothesisResponseDto } from '@infrastructure/mappers/hypothesis-mapper'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'

/**
 * Returns one hypothesis in a specific idea version owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<HypothesisResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.hypotheses.get',
    maxRequests: 120,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, HypothesisRouteParamsSchema.parse)

  const hypothesis = await getHypothesis({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId,
    hypothesisId: params.hypothesisId
  })

  return toHypothesisResponseDto(hypothesis)
})
