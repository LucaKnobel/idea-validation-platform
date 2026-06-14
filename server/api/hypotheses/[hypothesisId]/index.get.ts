import { getHypothesis } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { toHypothesisResponseDto } from '@infrastructure/mappers/hypothesis-mapper'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import type { HypothesisResponseDto } from '@infrastructure/validation/hypothesis-schemas'
import { HypothesisIdRouteParamsSchema } from '@infrastructure/validation/route-params-schemas'

/**
 * Returns one hypothesis owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<HypothesisResponseDto> => {
  await enforceRateLimit(event, {
    name: 'hypotheses.get',
    maxRequests: 120,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, HypothesisIdRouteParamsSchema.parse)

  const hypothesis = await getHypothesis({
    userId,
    hypothesisId: params.hypothesisId
  })

  setResponseStatus(event, 200)

  return toHypothesisResponseDto(hypothesis)
})
