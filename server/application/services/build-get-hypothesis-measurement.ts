import type { MeasurementRepository } from '@application/interfaces/measurement-repository'
import type { Measurement } from '@application/models/measurement'
import type { Logger } from '@interfaces/logger'
import { MeasurementNotFoundError } from '@application/errors/measurement-errors'

export type GetHypothesisMeasurementInput = {
  userId: string
  hypothesisId: string
}

/**
 * Builds the use case that loads the measurement singleton for one owned hypothesis.
 */
export const buildGetHypothesisMeasurement = (measurementRepository: MeasurementRepository, logger: Logger) => {
  return async (input: GetHypothesisMeasurementInput): Promise<Measurement> => {
    const measurement = await measurementRepository.getByHypothesis({
      userId: input.userId,
      hypothesisId: input.hypothesisId
    })

    if (measurement === null) {
      throw new MeasurementNotFoundError()
    }

    logger.debug('Measurement loaded', {
      userId: input.userId,
      hypothesisId: input.hypothesisId,
      measurementId: measurement.id
    })

    return measurement
  }
}
