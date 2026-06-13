import type { MeasurementRepository } from '@application/interfaces/measurement-repository'
import type { Measurement } from '@application/models/measurement'
import type { Logger } from '@interfaces/logger'
import { ExperimentNotFoundError } from '@application/errors/experiment-errors'
import { MeasurementMetricAlreadyExistsError } from '@application/errors/measurement-errors'
import { UniqueConstraintViolationError } from '@application/errors/persistence-errors'

export type CreateMeasurementInput = {
  userId: string
  experimentId: string
  metricId: string
  value: number
  note: string | null
}

/**
 * Builds the use case that creates one measurement in a specific experiment.
 */
export const createCreateMeasurement = (measurementRepository: MeasurementRepository, logger: Logger) => {
  return async (input: CreateMeasurementInput): Promise<Measurement> => {
    let measurement: Measurement | null

    try {
      measurement = await measurementRepository.createForExperiment({
        userId: input.userId,
        experimentId: input.experimentId,
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
      throw new ExperimentNotFoundError()
    }

    logger.debug('Measurement created', {
      userId: input.userId,
      experimentId: input.experimentId,
      measurementId: measurement.id,
      metricId: input.metricId
    })

    return measurement
  }
}
