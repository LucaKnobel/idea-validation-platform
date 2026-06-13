import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createGetMeasurement } from '@application/services/get-measurement'
import { MeasurementNotFoundError } from '@application/errors/measurement-errors'
import type { MeasurementRepository } from '@application/interfaces/measurement-repository'
import type { Logger } from '@interfaces/logger'
import {
  VALID_USER_ID,
  makeLogger,
  makeMeasurement,
  makeMeasurementRepository
} from './helpers'

describe('createGetMeasurement', () => {
  let measurementRepository: MeasurementRepository
  let logger: Logger
  let getMeasurement: ReturnType<typeof createGetMeasurement>

  beforeEach(() => {
    measurementRepository = makeMeasurementRepository()
    logger = makeLogger()
    getMeasurement = createGetMeasurement(measurementRepository, logger)
    vi.mocked(measurementRepository.getByIdForUser).mockResolvedValue(makeMeasurement())
  })

  it('loads one measurement for the current user', async () => {
    await getMeasurement({
      userId: VALID_USER_ID,
      measurementId: 'measurement-001'
    })

    expect(measurementRepository.getByIdForUser).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      measurementId: 'measurement-001'
    })
  })

  it('returns the repository result unchanged', async () => {
    const measurement = makeMeasurement({ id: 'measurement-xyz' })
    vi.mocked(measurementRepository.getByIdForUser).mockResolvedValueOnce(measurement)

    const result = await getMeasurement({
      userId: VALID_USER_ID,
      measurementId: 'measurement-xyz'
    })

    expect(result).toEqual(measurement)
  })

  it('logs the loaded measurement id', async () => {
    await getMeasurement({
      userId: VALID_USER_ID,
      measurementId: 'measurement-001'
    })

    expect(logger.debug).toHaveBeenCalledWith('Measurement loaded', {
      userId: VALID_USER_ID,
      measurementId: 'measurement-001'
    })
  })

  it('throws MeasurementNotFoundError when measurement is not accessible', async () => {
    vi.mocked(measurementRepository.getByIdForUser).mockResolvedValueOnce(null)

    await expect(
      getMeasurement({
        userId: VALID_USER_ID,
        measurementId: 'measurement-001'
      })
    ).rejects.toThrow(MeasurementNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
