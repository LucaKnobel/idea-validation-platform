import { createMeasurement } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { toMeasurementResponseDto } from '@infrastructure/mappers/measurement-mapper'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  CreateMeasurementBodySchema,
  MeasurementCollectionRouteParamsSchema,
  type MeasurementResponseDto
} from '@infrastructure/validation/measurement-schemas'

/**
 * Creates one measurement for a specific experiment owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<MeasurementResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.hypotheses.experiments.measurements.create',
    maxRequests: 30,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, MeasurementCollectionRouteParamsSchema.parse)
  const body = await readValidatedBody(event, CreateMeasurementBodySchema.parse)

  const measurement = await createMeasurement({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId,
    hypothesisId: params.hypothesisId,
    experimentId: params.experimentId,
    metricId: body.metricId,
    value: body.value,
    note: body.note
  })

  setResponseStatus(event, 201)

  return toMeasurementResponseDto(measurement)
})
