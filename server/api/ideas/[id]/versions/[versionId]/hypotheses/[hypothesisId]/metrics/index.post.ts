import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  CreateMetricBodySchema,
  MetricCollectionRouteParamsSchema,
  MetricResponseSchema,
  type MetricResponseDto
} from '@infrastructure/validation/metric-schemas'
import { createMetric } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'

/**
 * Creates one metric for a specific hypothesis owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<MetricResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.hypotheses.metrics.create',
    maxRequests: 30,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, MetricCollectionRouteParamsSchema.parse)
  const body = await readValidatedBody(event, CreateMetricBodySchema.parse)

  const metric = await createMetric({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId,
    hypothesisId: params.hypothesisId,
    name: body.name,
    description: body.description,
    dataType: body.dataType,
    unit: body.unit
  })

  setResponseStatus(event, 201)

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
