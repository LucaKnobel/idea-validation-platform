import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import { getIdeaVersionHypotheses } from '@infrastructure/composition'
import { toHypothesesListResponseDto } from '@infrastructure/mappers/hypothesis-mapper'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { IdeaVersionRouteParamsSchema } from '@infrastructure/validation/route-params-schemas'
import type { HypothesesListResponseDto } from '@infrastructure/validation/hypothesis-schemas'

/**
 * Returns all hypotheses for one owned idea version.
 */
export default defineProtectedHandler(async (event, userId): Promise<HypothesesListResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.hypotheses.list',
    maxRequests: 120,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, IdeaVersionRouteParamsSchema.parse)

  const hypotheses = await getIdeaVersionHypotheses({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId
  })

  return toHypothesesListResponseDto(hypotheses)
})
