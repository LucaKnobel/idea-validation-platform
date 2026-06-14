import { upsertMeasurement } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { toMeasurementResponseDto } from '@infrastructure/mappers/measurement-mapper'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  UpsertMeasurementBodySchema,
  type MeasurementResponseDto
} from '@infrastructure/validation/measurement-schemas'
import { HypothesisIdRouteParamsSchema } from '@infrastructure/validation/route-params-schemas'

/**
 * Creates or updates the measurement singleton for a specific hypothesis owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<MeasurementResponseDto> => {
  await enforceRateLimit(event, {
    name: 'hypotheses.measurement.put',
    maxRequests: 60,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, HypothesisIdRouteParamsSchema.parse)
  const body = await readValidatedBody(event, UpsertMeasurementBodySchema.parse)

  const measurement = await upsertMeasurement({
    userId,
    hypothesisId: params.hypothesisId,
    value: body.value,
    note: body.note
  })

  setResponseStatus(event, 200)

  return toMeasurementResponseDto(measurement)
})
