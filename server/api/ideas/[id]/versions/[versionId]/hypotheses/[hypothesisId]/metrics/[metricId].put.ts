import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  MetricRouteParamsSchema,
  MetricResponseSchema,
  UpdateMetricBodySchema,
  type MetricResponseDto
} from '@infrastructure/validation/metric-schemas'
import { updateMetric } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'

/**
 * Updates one metric owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<MetricResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.hypotheses.metrics.update',
    maxRequests: 60,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, MetricRouteParamsSchema.parse)
  const body = await readValidatedBody(event, UpdateMetricBodySchema.parse)

  const metric = await updateMetric({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId,
    hypothesisId: params.hypothesisId,
    metricId: params.metricId,
    name: body.name,
    description: body.description,
    dataType: body.dataType,
    unit: body.unit
  })

  return MetricResponseSchema.parse({
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
  })
})
