import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  MetricCollectionRouteParamsSchema,
  type MetricsListResponseDto
} from '@infrastructure/validation/metric-schemas'
import { toMetricsListResponseDto } from '@infrastructure/mappers/metric-mapper'
import { getHypothesisMetrics } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'

/**
 * Returns all metrics for a specific hypothesis owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<MetricsListResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.hypotheses.metrics.list',
    maxRequests: 120,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, MetricCollectionRouteParamsSchema.parse)

  const metrics = await getHypothesisMetrics({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId,
    hypothesisId: params.hypothesisId
  })

  return toMetricsListResponseDto(metrics)
})
