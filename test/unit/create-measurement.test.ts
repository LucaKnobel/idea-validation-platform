import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCreateMeasurement } from '@application/services/create-measurement'
import { ExperimentNotFoundError } from '@application/errors/experiment-errors'
import { MeasurementMetricAlreadyExistsError } from '@application/errors/measurement-errors'
import { UniqueConstraintViolationError } from '@application/errors/persistence-errors'
import type { MeasurementRepository } from '@application/interfaces/measurement-repository'
import type { Logger } from '@interfaces/logger'
import {
  VALID_USER_ID,
  makeLogger,
  makeMeasurement,
  makeMeasurementRepository
} from './helpers'

describe('createCreateMeasurement', () => {
  let measurementRepository: MeasurementRepository
  let logger: Logger
  let createMeasurement: ReturnType<typeof createCreateMeasurement>

  beforeEach(() => {
    measurementRepository = makeMeasurementRepository()
    logger = makeLogger()
    createMeasurement = createCreateMeasurement(measurementRepository, logger)
    vi.mocked(measurementRepository.createForExperiment).mockResolvedValue(makeMeasurement())
  })

  it('trims note and forwards all measurement fields', async () => {
    await createMeasurement({
      userId: VALID_USER_ID,
      experimentId: 'experiment-001',
      metricId: 'metric-001',
      value: 12.5,
      note: '  First cohort  '
    })

    expect(measurementRepository.createForExperiment).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      experimentId: 'experiment-001',
      metricId: 'metric-001',
      value: 12.5,
      note: 'First cohort'
    })
  })

  it('normalizes an empty note to null', async () => {
    await createMeasurement({
      userId: VALID_USER_ID,
      experimentId: 'experiment-001',
      metricId: 'metric-001',
      value: 12.5,
      note: '   '
    })

    expect(measurementRepository.createForExperiment).toHaveBeenCalledWith(expect.objectContaining({
      note: null
    }))
  })

  it('returns the created measurement unchanged', async () => {
    const measurement = makeMeasurement({ id: 'measurement-xyz' })
    vi.mocked(measurementRepository.createForExperiment).mockResolvedValueOnce(measurement)

    const result = await createMeasurement({
      userId: VALID_USER_ID,
      experimentId: 'experiment-001',
      metricId: 'metric-001',
      value: 12.5,
      note: null
    })

    expect(result).toEqual(measurement)
  })

  it('logs the created measurement id after success', async () => {
    vi.mocked(measurementRepository.createForExperiment).mockResolvedValueOnce(makeMeasurement({ id: 'measurement-xyz' }))

    await createMeasurement({
      userId: VALID_USER_ID,
      experimentId: 'experiment-001',
      metricId: 'metric-001',
      value: 12.5,
      note: null
    })

    expect(logger.debug).toHaveBeenCalledWith('Measurement created', {
      userId: VALID_USER_ID,
      experimentId: 'experiment-001',
      measurementId: 'measurement-xyz',
      metricId: 'metric-001'
    })
  })

  it('throws ExperimentNotFoundError when experiment access fails', async () => {
    vi.mocked(measurementRepository.createForExperiment).mockResolvedValueOnce(null)

    await expect(
      createMeasurement({
        userId: VALID_USER_ID,
        experimentId: 'experiment-001',
        metricId: 'metric-001',
        value: 12.5,
        note: null
      })
    ).rejects.toThrow(ExperimentNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })

  it('throws MeasurementMetricAlreadyExistsError on duplicate metric within the experiment', async () => {
    vi.mocked(measurementRepository.createForExperiment).mockRejectedValueOnce(new UniqueConstraintViolationError())

    await expect(
      createMeasurement({
        userId: VALID_USER_ID,
        experimentId: 'experiment-001',
        metricId: 'metric-001',
        value: 12.5,
        note: null
      })
    ).rejects.toThrow(MeasurementMetricAlreadyExistsError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
