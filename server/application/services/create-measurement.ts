import type { MeasurementRepository } from '@application/interfaces/measurement-repository'
import type { Measurement } from '@application/models/measurement'
import type { Logger } from '@interfaces/logger'
import { ExperimentNotFoundError } from '@application/errors/experiment-errors'

export type CreateMeasurementInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
  hypothesisId: string
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
    const measurement = await measurementRepository.createForExperiment({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      experimentId: input.experimentId,
      metricId: input.metricId,
      value: input.value,
      note: input.note?.trim() || null
    })

    if (measurement === null) {
      throw new ExperimentNotFoundError()
    }

    logger.debug('Measurement created', {
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      experimentId: input.experimentId,
      measurementId: measurement.id,
      metricId: input.metricId
    })

    return measurement
  }
}
