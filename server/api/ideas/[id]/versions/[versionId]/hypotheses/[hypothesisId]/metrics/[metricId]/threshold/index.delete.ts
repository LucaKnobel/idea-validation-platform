import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import { MetricRouteParamsSchema } from '@infrastructure/validation/metric-schemas'
import { deleteMetricThreshold } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'

/**
 * Deletes one threshold for a metric owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<void> => {
  await enforceRateLimit(event, {
    name: 'ideas.hypotheses.metrics.threshold.delete',
    maxRequests: 30,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, MetricRouteParamsSchema.parse)

  await deleteMetricThreshold({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId,
    hypothesisId: params.hypothesisId,
    metricId: params.metricId
  })

  setResponseStatus(event, 204)
})
