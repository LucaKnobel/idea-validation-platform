import type { MeasurementRepository } from '@application/interfaces/measurement-repository'
import type { HypothesisStatusSyncService } from '@application/interfaces/hypothesis-status-sync'
import type { Measurement } from '@application/models/measurement'
import type { Logger } from '@interfaces/logger'
import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'

export type UpsertMeasurementInput = {
  userId: string
  hypothesisId: string
  value: number
  note: string | null
}

/**
 * Builds the use case that creates or updates the measurement singleton for one owned hypothesis.
 */
export const buildUpsertMeasurement = (
  measurementRepository: MeasurementRepository,
  hypothesisStatusSyncService: HypothesisStatusSyncService,
  logger: Logger
) => {
  return async (input: UpsertMeasurementInput): Promise<Measurement> => {
    const measurement = await measurementRepository.upsertByHypothesis({
      userId: input.userId,
      hypothesisId: input.hypothesisId,
      value: input.value,
      note: input.note
    })

    if (measurement === null) {
      throw new HypothesisNotFoundError()
    }

    await hypothesisStatusSyncService.sync({
      userId: input.userId,
      hypothesisId: input.hypothesisId
    })

    logger.debug('Measurement upserted', {
      userId: input.userId,
      hypothesisId: input.hypothesisId,
      measurementId: measurement.id
    })

    return measurement
  }
}
