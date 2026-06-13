import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildGetHypothesisMeasurement } from '@application/services/build-get-hypothesis-measurement'
import { MeasurementNotFoundError } from '@application/errors/measurement-errors'
import type { MeasurementRepository } from '@application/interfaces/measurement-repository'
import type { Logger } from '@interfaces/logger'
import { makeMeasurement, makeMeasurementRepository, makeLogger, VALID_USER_ID } from './helpers'

describe('buildGetHypothesisMeasurement', () => {
  let measurementRepository: MeasurementRepository
  let logger: Logger
  let getHypothesisMeasurement: ReturnType<typeof buildGetHypothesisMeasurement>

  beforeEach(() => {
    measurementRepository = makeMeasurementRepository()
    logger = makeLogger()
    getHypothesisMeasurement = buildGetHypothesisMeasurement(measurementRepository, logger)
    vi.mocked(measurementRepository.getByHypothesis).mockResolvedValue(makeMeasurement())
  })

  it('calls getByHypothesis with the correct input', async () => {
    await getHypothesisMeasurement({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(measurementRepository.getByHypothesis).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001'
    })
  })

  it('returns the repository result unchanged', async () => {
    const measurement = makeMeasurement({ id: 'measurement-xyz', value: 99 })
    vi.mocked(measurementRepository.getByHypothesis).mockResolvedValue(measurement)

    const result = await getHypothesisMeasurement({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(result).toEqual(measurement)
  })

  it('logs the loaded measurement id', async () => {
    vi.mocked(measurementRepository.getByHypothesis).mockResolvedValue(makeMeasurement({ id: 'measurement-xyz' }))

    await getHypothesisMeasurement({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(logger.debug).toHaveBeenCalledWith('Measurement loaded', {
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001',
      measurementId: 'measurement-xyz'
    })
  })

  it('throws MeasurementNotFoundError when no measurement exists for the hypothesis', async () => {
    vi.mocked(measurementRepository.getByHypothesis).mockResolvedValue(null)

    await expect(
      getHypothesisMeasurement({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })
    ).rejects.toThrow(MeasurementNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
