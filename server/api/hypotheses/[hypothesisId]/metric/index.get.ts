import { getHypothesisMetric } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { toMetricResponseDto } from '@infrastructure/mappers/metric-mapper'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import type { MetricResponseDto } from '@infrastructure/validation/metric-schemas'
import { HypothesisIdRouteParamsSchema } from '@infrastructure/validation/route-params-schemas'

/**
 * Returns the metric singleton for a specific hypothesis owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<MetricResponseDto> => {
  await enforceRateLimit(event, {
    name: 'hypotheses.metric.get',
    maxRequests: 120,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, HypothesisIdRouteParamsSchema.parse)

  const metric = await getHypothesisMetric({
    userId,
    hypothesisId: params.hypothesisId
  })

  setResponseStatus(event, 200)

  return toMetricResponseDto(metric)
})
