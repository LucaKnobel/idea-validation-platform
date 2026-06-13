import { deleteMeasurement } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import { MeasurementRouteParamsSchema } from '@infrastructure/validation/measurement-schemas'

/**
 * Deletes one measurement owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<void> => {
  await enforceRateLimit(event, {
    name: 'measurements.delete',
    maxRequests: 30,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, MeasurementRouteParamsSchema.parse)

  await deleteMeasurement({
    userId,
    measurementId: params.measurementId
  })

  setResponseStatus(event, 204)
})
