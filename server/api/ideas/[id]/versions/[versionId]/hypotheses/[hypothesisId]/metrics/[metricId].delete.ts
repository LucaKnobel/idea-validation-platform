import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import { MetricRouteParamsSchema } from '@infrastructure/validation/metric-schemas'
import { deleteMetric } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'

/**
 * Deletes one metric owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<void> => {
  await enforceRateLimit(event, {
    name: 'ideas.hypotheses.metrics.delete',
    maxRequests: 30,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, MetricRouteParamsSchema.parse)

  await deleteMetric({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId,
    hypothesisId: params.hypothesisId,
    metricId: params.metricId
  })

  setResponseStatus(event, 204)
})
