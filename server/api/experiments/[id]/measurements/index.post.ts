import { createMeasurement } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { toMeasurementResponseDto } from '@infrastructure/mappers/measurement-mapper'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  CreateMeasurementBodySchema,
  MeasurementRouteParamsSchema,
  type MeasurementResponseDto
} from '@infrastructure/validation/measurement-schemas'

/**
 * Creates one measurement for one experiment owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<MeasurementResponseDto> => {
  await enforceRateLimit(event, {
    name: 'experiments.measurements.create',
    maxRequests: 30,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, MeasurementRouteParamsSchema.parse)
  const body = await readValidatedBody(event, CreateMeasurementBodySchema.parse)

  const measurement = await createMeasurement({
    userId,
    experimentId: params.id,
    metricId: body.metricId,
    value: body.value,
    note: body.note
  })

  setResponseStatus(event, 201)

  return toMeasurementResponseDto(measurement)
})
