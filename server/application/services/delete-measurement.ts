import type { MeasurementRepository } from '@application/interfaces/measurement-repository'
import type { Logger } from '@interfaces/logger'
import { MeasurementNotFoundError } from '@application/errors/measurement-errors'

export type DeleteMeasurementInput = {
  userId: string
  measurementId: string
}

/**
 * Builds the use case that deletes one measurement owned by the current user.
 */
export const createDeleteMeasurement = (measurementRepository: MeasurementRepository, logger: Logger) => {
  return async (input: DeleteMeasurementInput): Promise<void> => {
    const deleted = await measurementRepository.deleteByIdForUser({
      userId: input.userId,
      measurementId: input.measurementId
    })

    if (!deleted) {
      throw new MeasurementNotFoundError()
    }

    logger.debug('Measurement deleted', {
      userId: input.userId,
      measurementId: input.measurementId
    })
  }
}
