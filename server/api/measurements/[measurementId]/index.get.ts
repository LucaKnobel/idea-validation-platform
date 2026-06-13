import { getMeasurement } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { toMeasurementResponseDto } from '@infrastructure/mappers/measurement-mapper'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  MeasurementRouteParamsSchema,
  type MeasurementResponseDto
} from '@infrastructure/validation/measurement-schemas'

/**
 * Returns one measurement owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<MeasurementResponseDto> => {
  await enforceRateLimit(event, {
    name: 'measurement.get',
    maxRequests: 120,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, MeasurementRouteParamsSchema.parse)

  const measurement = await getMeasurement({
    userId,
    measurementId: params.id
  })

  return toMeasurementResponseDto(measurement)
})
