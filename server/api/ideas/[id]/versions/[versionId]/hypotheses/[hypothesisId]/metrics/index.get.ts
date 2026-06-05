import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  MetricResponseSchema,
  MetricsListResponseSchema,
  MetricCollectionRouteParamsSchema,
  type MetricsListResponseDto
} from '@infrastructure/validation/metric-schemas'
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

  return MetricsListResponseSchema.parse({
    items: metrics.map(metric => MetricResponseSchema.parse({
      id: metric.id,
      hypothesisId: metric.hypothesisId,
      name: metric.name,
      description: metric.description,
      dataType: metric.dataType,
      unit: metric.unit,
      threshold: metric.threshold
        ? {
            id: metric.threshold.id,
            metricId: metric.threshold.metricId,
            operator: metric.threshold.operator,
            referenceValue: metric.threshold.referenceValue,
            createdAt: metric.threshold.createdAt.toISOString(),
            updatedAt: metric.threshold.updatedAt.toISOString()
          }
        : null,
      createdAt: metric.createdAt.toISOString(),
      updatedAt: metric.updatedAt.toISOString()
    }))
  })
})
