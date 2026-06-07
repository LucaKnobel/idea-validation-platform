import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  MetricRouteParamsSchema,
  UpdateMetricBodySchema,
  type MetricResponseDto
} from '@infrastructure/validation/metric-schemas'
import { toMetricResponseDto } from '@infrastructure/mappers/metric-mapper'
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
    unit: body.unit,
    threshold: body.threshold
  })

  return toMetricResponseDto(metric)
})
