import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDeleteMeasurement } from '@application/services/delete-measurement'
import { MeasurementNotFoundError } from '@application/errors/measurement-errors'
import type { MeasurementRepository } from '@application/interfaces/measurement-repository'
import type { Logger } from '@interfaces/logger'
import {
  VALID_USER_ID,
  makeLogger,
  makeMeasurementRepository
} from './helpers'

describe('createDeleteMeasurement', () => {
  let measurementRepository: MeasurementRepository
  let logger: Logger
  let deleteMeasurement: ReturnType<typeof createDeleteMeasurement>

  beforeEach(() => {
    measurementRepository = makeMeasurementRepository()
    logger = makeLogger()
    deleteMeasurement = createDeleteMeasurement(measurementRepository, logger)
    vi.mocked(measurementRepository.deleteByIdForUser).mockResolvedValue(true)
  })

  it('deletes the requested measurement for the current user', async () => {
    await deleteMeasurement({
      userId: VALID_USER_ID,
      measurementId: 'measurement-001'
    })

    expect(measurementRepository.deleteByIdForUser).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      measurementId: 'measurement-001'
    })
  })

  it('resolves without a return value on success', async () => {
    const result = await deleteMeasurement({
      userId: VALID_USER_ID,
      measurementId: 'measurement-001'
    })

    expect(result).toBeUndefined()
  })

  it('logs the deleted measurement id after success', async () => {
    await deleteMeasurement({
      userId: VALID_USER_ID,
      measurementId: 'measurement-001'
    })

    expect(logger.debug).toHaveBeenCalledWith('Measurement deleted', {
      userId: VALID_USER_ID,
      measurementId: 'measurement-001'
    })
  })

  it('throws MeasurementNotFoundError when no measurement was deleted', async () => {
    vi.mocked(measurementRepository.deleteByIdForUser).mockResolvedValueOnce(false)

    await expect(
      deleteMeasurement({
        userId: VALID_USER_ID,
        measurementId: 'measurement-001'
      })
    ).rejects.toThrow(MeasurementNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
