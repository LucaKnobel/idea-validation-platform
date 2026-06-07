import type { MeasurementRepository } from '@application/interfaces/measurement-repository'
import type { Measurement } from '@application/models/measurement'
import type { Logger } from '@interfaces/logger'
import { ExperimentNotFoundError } from '@application/errors/experiment-errors'
import { MeasurementMetricAlreadyExistsError } from '@application/errors/measurement-errors'

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
    const result = await measurementRepository.createForExperiment({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      experimentId: input.experimentId,
      metricId: input.metricId,
      value: input.value,
      note: input.note?.trim() || null
    })

    if (result.kind === 'notFound') {
      throw new ExperimentNotFoundError()
    }

    if (result.kind === 'conflict') {
      throw new MeasurementMetricAlreadyExistsError()
    }

    const measurement = result.measurement

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
