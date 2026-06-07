import type { MeasurementRepository } from '@application/interfaces/measurement-repository'
import type { Measurement } from '@application/models/measurement'
import type { Logger } from '@interfaces/logger'
import { MeasurementMetricAlreadyExistsError, MeasurementNotFoundError } from '@application/errors/measurement-errors'

export type UpdateMeasurementInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
  hypothesisId: string
  experimentId: string
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
    const result = await measurementRepository.updateByIdForUser({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      experimentId: input.experimentId,
      measurementId: input.measurementId,
      metricId: input.metricId,
      value: input.value,
      note: input.note?.trim() || null
    })

    if (result.kind === 'notFound') {
      throw new MeasurementNotFoundError()
    }

    if (result.kind === 'conflict') {
      throw new MeasurementMetricAlreadyExistsError()
    }

    const measurement = result.measurement

    logger.debug('Measurement updated', {
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      experimentId: input.experimentId,
      measurementId: input.measurementId,
      metricId: input.metricId
    })

    return measurement
  }
}
