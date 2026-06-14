import type { MeasurementRepository } from '@application/interfaces/measurement-repository'
import type { Logger } from '@interfaces/logger'
import { MeasurementNotFoundError } from '@application/errors/measurement-errors'

export type DeleteMeasurementInput = {
  userId: string
  hypothesisId: string
}

/**
 * Builds the use case that deletes the measurement singleton for one owned hypothesis.
 */
export const buildDeleteMeasurement = (measurementRepository: MeasurementRepository, logger: Logger) => {
  return async (input: DeleteMeasurementInput): Promise<void> => {
    const deleted = await measurementRepository.deleteByHypothesis({
      userId: input.userId,
      hypothesisId: input.hypothesisId
    })

    if (!deleted) {
      throw new MeasurementNotFoundError()
    }

    logger.debug('Measurement deleted', {
      userId: input.userId,
      hypothesisId: input.hypothesisId
    })
  }
}
