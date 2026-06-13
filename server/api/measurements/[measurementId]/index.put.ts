import { updateMeasurement } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { toMeasurementResponseDto } from '@infrastructure/mappers/measurement-mapper'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  MeasurementRouteParamsSchema,
  UpdateMeasurementBodySchema,
  type MeasurementResponseDto
} from '@infrastructure/validation/measurement-schemas'

/**
 * Updates one measurement owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<MeasurementResponseDto> => {
  await enforceRateLimit(event, {
    name: 'measurements.update',
    maxRequests: 60,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, MeasurementRouteParamsSchema.parse)
  const body = await readValidatedBody(event, UpdateMeasurementBodySchema.parse)

  const measurement = await updateMeasurement({
    userId,
    measurementId: params.measurementId,
    metricId: body.metricId,
    value: body.value,
    note: body.note
  })

  return toMeasurementResponseDto(measurement)
})
