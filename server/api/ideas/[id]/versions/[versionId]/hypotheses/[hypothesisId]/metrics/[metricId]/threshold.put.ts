import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  MetricRouteParamsSchema,
  MetricThresholdResponseSchema,
  UpsertMetricThresholdBodySchema,
  type MetricThresholdResponseDto
} from '@infrastructure/validation/metric-schemas'
import { upsertMetricThreshold } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'

/**
 * Creates or updates one threshold for a metric owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<MetricThresholdResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.hypotheses.metrics.threshold.upsert',
    maxRequests: 60,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, MetricRouteParamsSchema.parse)
  const body = await readValidatedBody(event, UpsertMetricThresholdBodySchema.parse)

  const threshold = await upsertMetricThreshold({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId,
    hypothesisId: params.hypothesisId,
    metricId: params.metricId,
    operator: body.operator,
    referenceValue: body.referenceValue
  })

  return MetricThresholdResponseSchema.parse({
    id: threshold.id,
    metricId: threshold.metricId,
    operator: threshold.operator,
    referenceValue: threshold.referenceValue,
    createdAt: threshold.createdAt.toISOString(),
    updatedAt: threshold.updatedAt.toISOString()
  })
})
