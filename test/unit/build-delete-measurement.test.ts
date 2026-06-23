import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildDeleteMeasurement } from '@application/services/build-delete-measurement'
import type { HypothesisStatusSyncService } from '@application/interfaces/hypothesis-status-sync'
import { MeasurementNotFoundError } from '@application/errors/measurement-errors'
import type { MeasurementRepository } from '@application/interfaces/measurement-repository'
import type { Logger } from '@interfaces/logger'
import { makeHypothesis, makeLogger, makeMeasurementRepository, VALID_USER_ID } from './helpers'

describe('buildDeleteMeasurement', () => {
  let measurementRepository: MeasurementRepository
  let hypothesisStatusSyncService: HypothesisStatusSyncService
  let logger: Logger
  let deleteMeasurement: ReturnType<typeof buildDeleteMeasurement>

  beforeEach(() => {
    measurementRepository = makeMeasurementRepository()
    hypothesisStatusSyncService = {
      sync: vi.fn().mockResolvedValue(makeHypothesis())
    }
    logger = makeLogger()
    deleteMeasurement = buildDeleteMeasurement(measurementRepository, hypothesisStatusSyncService, logger)
    vi.mocked(measurementRepository.deleteByHypothesis).mockResolvedValue(true)
  })

  it('calls deleteByHypothesis with the correct input', async () => {
    await deleteMeasurement({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(measurementRepository.deleteByHypothesis).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001'
    })
  })

  it('resolves without a return value on success', async () => {
    const result = await deleteMeasurement({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(result).toBeUndefined()
  })

  it('logs the deletion', async () => {
    await deleteMeasurement({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(logger.debug).toHaveBeenCalledWith('Measurement deleted', {
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001'
    })
  })

  it('syncs hypothesis status after deletion', async () => {
    await deleteMeasurement({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(hypothesisStatusSyncService.sync).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001'
    })
  })

  it('throws MeasurementNotFoundError when no measurement was deleted', async () => {
    vi.mocked(measurementRepository.deleteByHypothesis).mockResolvedValue(false)

    await expect(
      deleteMeasurement({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })
    ).rejects.toThrow(MeasurementNotFoundError)

    expect(hypothesisStatusSyncService.sync).not.toHaveBeenCalled()
    expect(logger.debug).not.toHaveBeenCalled()
  })
})
