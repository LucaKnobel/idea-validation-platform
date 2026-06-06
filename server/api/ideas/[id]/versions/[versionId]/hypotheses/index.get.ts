import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  HypothesisVersionRouteParamsSchema,
  type HypothesesListResponseDto
} from '@infrastructure/validation/hypothesis-schemas'
import { getIdeaVersionHypotheses } from '@infrastructure/composition'
import { toHypothesesListResponseDto } from '@infrastructure/mappers/hypothesis-mapper'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'

/**
 * Returns all hypotheses for a specific idea version owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<HypothesesListResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.hypotheses.list',
    maxRequests: 120,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, HypothesisVersionRouteParamsSchema.parse)

  const hypotheses = await getIdeaVersionHypotheses({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId
  })

  return toHypothesesListResponseDto(hypotheses)
})
