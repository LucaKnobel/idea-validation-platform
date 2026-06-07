import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createUpdateMeasurement } from '@application/services/update-measurement'
import { MeasurementMetricAlreadyExistsError, MeasurementNotFoundError } from '@application/errors/measurement-errors'
import type { MeasurementRepository } from '@application/interfaces/measurement-repository'
import type { Logger } from '@interfaces/logger'
import {
  VALID_IDEA_ID,
  VALID_IDEA_VERSION_ID,
  VALID_USER_ID,
  makeLogger,
  makeMeasurement,
  makeMeasurementRepository
} from './helpers'

describe('createUpdateMeasurement', () => {
  let measurementRepository: MeasurementRepository
  let logger: Logger
  let updateMeasurement: ReturnType<typeof createUpdateMeasurement>

  beforeEach(() => {
    measurementRepository = makeMeasurementRepository()
    logger = makeLogger()
    updateMeasurement = createUpdateMeasurement(measurementRepository, logger)
    vi.mocked(measurementRepository.updateByIdForUser).mockResolvedValue({
      kind: 'success',
      measurement: makeMeasurement()
    })
  })

  it('trims note and forwards all measurement fields', async () => {
    await updateMeasurement({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      experimentId: 'experiment-001',
      measurementId: 'measurement-001',
      metricId: 'metric-002',
      value: 9,
      note: '  Updated after second cohort  '
    })

    expect(measurementRepository.updateByIdForUser).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      experimentId: 'experiment-001',
      measurementId: 'measurement-001',
      metricId: 'metric-002',
      value: 9,
      note: 'Updated after second cohort'
    })
  })

  it('returns the updated measurement unchanged', async () => {
    const measurement = makeMeasurement({ id: 'measurement-xyz', metricId: 'metric-002', value: 9 })
    vi.mocked(measurementRepository.updateByIdForUser).mockResolvedValueOnce({
      kind: 'success',
      measurement
    })

    const result = await updateMeasurement({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      experimentId: 'experiment-001',
      measurementId: 'measurement-xyz',
      metricId: 'metric-002',
      value: 9,
      note: null
    })

    expect(result).toEqual(measurement)
  })

  it('logs the updated measurement id after success', async () => {
    vi.mocked(measurementRepository.updateByIdForUser).mockResolvedValueOnce({
      kind: 'success',
      measurement: makeMeasurement({ id: 'measurement-xyz' })
    })

    await updateMeasurement({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      experimentId: 'experiment-001',
      measurementId: 'measurement-xyz',
      metricId: 'metric-002',
      value: 9,
      note: null
    })

    expect(logger.debug).toHaveBeenCalledWith('Measurement updated', {
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      experimentId: 'experiment-001',
      measurementId: 'measurement-xyz',
      metricId: 'metric-002'
    })
  })

  it('throws MeasurementNotFoundError when measurement access fails', async () => {
    vi.mocked(measurementRepository.updateByIdForUser).mockResolvedValueOnce({ kind: 'notFound' })

    await expect(
      updateMeasurement({
        userId: VALID_USER_ID,
        ideaId: VALID_IDEA_ID,
        ideaVersionId: VALID_IDEA_VERSION_ID,
        hypothesisId: 'hypothesis-001',
        experimentId: 'experiment-001',
        measurementId: 'measurement-001',
        metricId: 'metric-002',
        value: 9,
        note: null
      })
    ).rejects.toThrow(MeasurementNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })

  it('throws MeasurementMetricAlreadyExistsError on duplicate metric within the experiment', async () => {
    vi.mocked(measurementRepository.updateByIdForUser).mockResolvedValueOnce({ kind: 'conflict' })

    await expect(
      updateMeasurement({
        userId: VALID_USER_ID,
        ideaId: VALID_IDEA_ID,
        ideaVersionId: VALID_IDEA_VERSION_ID,
        hypothesisId: 'hypothesis-001',
        experimentId: 'experiment-001',
        measurementId: 'measurement-001',
        metricId: 'metric-002',
        value: 9,
        note: null
      })
    ).rejects.toThrow(MeasurementMetricAlreadyExistsError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
