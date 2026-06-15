import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildUpsertMeasurement } from '@application/services/build-upsert-measurement'
import type { HypothesisStatusSyncService } from '@application/interfaces/hypothesis-status-sync'
import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'
import type { MeasurementRepository } from '@application/interfaces/measurement-repository'
import type { Logger } from '@interfaces/logger'
import { makeHypothesis, makeLogger, makeMeasurement, makeMeasurementRepository, VALID_USER_ID } from './helpers'

describe('buildUpsertMeasurement', () => {
  let measurementRepository: MeasurementRepository
  let hypothesisStatusSyncService: HypothesisStatusSyncService
  let logger: Logger
  let upsertMeasurement: ReturnType<typeof buildUpsertMeasurement>

  const validInput = {
    userId: VALID_USER_ID,
    hypothesisId: 'hypothesis-001',
    value: 42,
    note: 'Observed in first cohort'
  }

  beforeEach(() => {
    measurementRepository = makeMeasurementRepository()
    hypothesisStatusSyncService = {
      sync: vi.fn().mockResolvedValue(makeHypothesis())
    }
    logger = makeLogger()
    upsertMeasurement = buildUpsertMeasurement(measurementRepository, hypothesisStatusSyncService, logger)
    vi.mocked(measurementRepository.upsertByHypothesis).mockResolvedValue(makeMeasurement())
  })

  it('calls upsertByHypothesis with the correct input', async () => {
    await upsertMeasurement(validInput)

    expect(measurementRepository.upsertByHypothesis).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001',
      value: 42,
      note: 'Observed in first cohort'
    })
  })

  it('passes null note through unchanged', async () => {
    await upsertMeasurement({ ...validInput, note: null })

    expect(measurementRepository.upsertByHypothesis).toHaveBeenCalledWith(
      expect.objectContaining({ note: null })
    )
  })

  it('returns the upserted measurement unchanged', async () => {
    const measurement = makeMeasurement({ id: 'measurement-xyz', value: 42 })
    vi.mocked(measurementRepository.upsertByHypothesis).mockResolvedValue(measurement)

    const result = await upsertMeasurement(validInput)

    expect(result).toEqual(measurement)
  })

  it('logs the upserted measurement id', async () => {
    vi.mocked(measurementRepository.upsertByHypothesis).mockResolvedValue(makeMeasurement({ id: 'measurement-xyz' }))

    await upsertMeasurement(validInput)

    expect(logger.debug).toHaveBeenCalledWith('Measurement upserted', {
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001',
      measurementId: 'measurement-xyz'
    })
  })

  it('syncs hypothesis status after upsert', async () => {
    await upsertMeasurement(validInput)

    expect(hypothesisStatusSyncService.sync).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001'
    })
  })

  it('throws HypothesisNotFoundError when the hypothesis is not accessible', async () => {
    vi.mocked(measurementRepository.upsertByHypothesis).mockResolvedValue(null)

    await expect(upsertMeasurement(validInput)).rejects.toThrow(HypothesisNotFoundError)

    expect(hypothesisStatusSyncService.sync).not.toHaveBeenCalled()
    expect(logger.debug).not.toHaveBeenCalled()
  })
})
