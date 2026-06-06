import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  CreateMetricBodySchema,
  MetricCollectionRouteParamsSchema,
  type MetricResponseDto
} from '@infrastructure/validation/metric-schemas'
import { toMetricResponseDto } from '@infrastructure/mappers/metric-mapper'
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
    unit: body.unit,
    threshold: body.threshold
  })

  setResponseStatus(event, 201)

  return toMetricResponseDto(metric)
})
