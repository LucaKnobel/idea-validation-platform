import { getExperimentMeasurements } from '@infrastructure/composition'
import { defineProtectedHandler } from '@infrastructure/handlers/protected-handler'
import { toMeasurementsListResponseDto } from '@infrastructure/mappers/measurement-mapper'
import { enforceRateLimit } from '@infrastructure/rate-limit/enforce-rate-limit'
import {
  MeasurementCollectionRouteParamsSchema,
  type MeasurementsListResponseDto
} from '@infrastructure/validation/measurement-schemas'

/**
 * Returns all measurements for a specific experiment owned by the current user.
 */
export default defineProtectedHandler(async (event, userId): Promise<MeasurementsListResponseDto> => {
  await enforceRateLimit(event, {
    name: 'ideas.hypotheses.experiments.measurements.list',
    maxRequests: 120,
    windowSeconds: 60,
    scope: 'user'
  })

  const params = await getValidatedRouterParams(event, MeasurementCollectionRouteParamsSchema.parse)

  const measurements = await getExperimentMeasurements({
    userId,
    ideaId: params.id,
    ideaVersionId: params.versionId,
    hypothesisId: params.hypothesisId,
    experimentId: params.experimentId
  })

  return toMeasurementsListResponseDto(measurements)
})
