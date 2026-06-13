import type { MeasurementRepository } from '@application/interfaces/measurement-repository'
import type { Measurement } from '@application/models/measurement'
import type { Logger } from '@interfaces/logger'
import { MeasurementMetricAlreadyExistsError, MeasurementNotFoundError } from '@application/errors/measurement-errors'
import { UniqueConstraintViolationError } from '@application/errors/persistence-errors'

export type UpdateMeasurementInput = {
  userId: string
  measurementId: string
  metricId: string
  value: number
  note: string | null
}

/**
 * Builds the use case that updates one measurement owned by the current user.
 */
export const createUpdateMeasurement = (measurementRepository: MeasurementRepository, logger: Logger) => {
  return async (input: UpdateMeasurementInput): Promise<Measurement> => {
    let measurement: Measurement | null

    try {
      measurement = await measurementRepository.updateByIdForUser({
        userId: input.userId,
        measurementId: input.measurementId,
        metricId: input.metricId,
        value: input.value,
        note: input.note?.trim() || null
      })
    } catch (error) {
      if (error instanceof UniqueConstraintViolationError) {
        throw new MeasurementMetricAlreadyExistsError()
      }

      throw error
    }

    if (measurement === null) {
      throw new MeasurementNotFoundError()
    }

    logger.debug('Measurement updated', {
      userId: input.userId,
      measurementId: input.measurementId,
      metricId: input.metricId
    })

    return measurement
  }
}
