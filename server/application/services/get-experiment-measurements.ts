import type { MeasurementRepository } from '@application/interfaces/measurement-repository'
import type { Measurement } from '@application/models/measurement'
import type { Logger } from '@interfaces/logger'
import { ExperimentNotFoundError } from '@application/errors/experiment-errors'

export type GetExperimentMeasurementsInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
  hypothesisId: string
  experimentId: string
}

/**
 * Builds the use case that lists all measurements for one specific experiment.
 */
export const createGetExperimentMeasurements = (measurementRepository: MeasurementRepository, logger: Logger) => {
  return async (input: GetExperimentMeasurementsInput): Promise<Measurement[]> => {
    const measurements = await measurementRepository.listByExperimentForUser({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      experimentId: input.experimentId
    })

    if (measurements === null) {
      throw new ExperimentNotFoundError()
    }

    logger.debug('Measurements listed', {
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      experimentId: input.experimentId,
      items: measurements.length
    })

    return measurements
  }
}
