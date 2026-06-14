import { upsertMetric } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { toMetricResponseDto } from '@infrastructure/mappers/metric-mapper'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  UpsertMetricBodySchema,
  type MetricResponseDto
} from '@infrastructure/validation/metric-schemas'
import { HypothesisIdRouteParamsSchema } from '@infrastructure/validation/route-params-schemas'

/**
 * Creates or updates the metric singleton for a specific hypothesis owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<MetricResponseDto> => {
  await enforceRateLimit(event, {
    name: 'hypotheses.metric.put',
    maxRequests: 60,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, HypothesisIdRouteParamsSchema.parse)
  const body = await readValidatedBody(event, UpsertMetricBodySchema.parse)

  const metric = await upsertMetric({
    userId,
    hypothesisId: params.hypothesisId,
    name: body.name,
    description: body.description,
    unit: body.unit,
    threshold: body.threshold
  })

  setResponseStatus(event, 200)

  return toMetricResponseDto(metric)
})
