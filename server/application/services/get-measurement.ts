import type { MeasurementRepository } from '@application/interfaces/measurement-repository'
import type { Measurement } from '@application/models/measurement'
import type { Logger } from '@interfaces/logger'
import { MeasurementNotFoundError } from '@application/errors/measurement-errors'

export type GetMeasurementInput = {
  userId: string
  measurementId: string
}

/**
 * Builds the use case that returns one owned measurement.
 */
export const createGetMeasurement = (measurementRepository: MeasurementRepository, logger: Logger) => {
  return async (input: GetMeasurementInput): Promise<Measurement> => {
    const measurement = await measurementRepository.getByIdForUser({
      userId: input.userId,
      measurementId: input.measurementId
    })

    if (measurement === null) {
      throw new MeasurementNotFoundError()
    }

    logger.debug('Measurement loaded', {
      userId: input.userId,
      measurementId: input.measurementId
    })

    return measurement
  }
}
