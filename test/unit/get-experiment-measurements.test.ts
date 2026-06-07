import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createGetExperimentMeasurements } from '@application/services/get-experiment-measurements'
import { ExperimentNotFoundError } from '@application/errors/experiment-errors'
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

describe('createGetExperimentMeasurements', () => {
  let measurementRepository: MeasurementRepository
  let logger: Logger
  let getExperimentMeasurements: ReturnType<typeof createGetExperimentMeasurements>

  beforeEach(() => {
    measurementRepository = makeMeasurementRepository()
    logger = makeLogger()
    getExperimentMeasurements = createGetExperimentMeasurements(measurementRepository, logger)
    vi.mocked(measurementRepository.listByExperimentForUser).mockResolvedValue([makeMeasurement()])
  })

  it('loads measurements for the requested user and experiment', async () => {
    await getExperimentMeasurements({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      experimentId: 'experiment-001'
    })

    expect(measurementRepository.listByExperimentForUser).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      experimentId: 'experiment-001'
    })
  })

  it('returns the repository result unchanged', async () => {
    const measurements = [
      makeMeasurement(),
      makeMeasurement({ id: 'measurement-002', metricId: 'metric-002', value: 17, note: null })
    ]
    vi.mocked(measurementRepository.listByExperimentForUser).mockResolvedValueOnce(measurements)

    const result = await getExperimentMeasurements({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      experimentId: 'experiment-001'
    })

    expect(result).toEqual(measurements)
  })

  it('logs the loaded measurement count', async () => {
    const measurements = [
      makeMeasurement(),
      makeMeasurement({ id: 'measurement-002', metricId: 'metric-002', value: 17 })
    ]
    vi.mocked(measurementRepository.listByExperimentForUser).mockResolvedValueOnce(measurements)

    await getExperimentMeasurements({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      experimentId: 'experiment-001'
    })

    expect(logger.debug).toHaveBeenCalledWith('Measurements listed', {
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      experimentId: 'experiment-001',
      items: 2
    })
  })

  it('throws ExperimentNotFoundError when the experiment is not accessible', async () => {
    vi.mocked(measurementRepository.listByExperimentForUser).mockResolvedValueOnce(null)

    await expect(
      getExperimentMeasurements({
        userId: VALID_USER_ID,
        ideaId: VALID_IDEA_ID,
        ideaVersionId: VALID_IDEA_VERSION_ID,
        hypothesisId: 'hypothesis-001',
        experimentId: 'experiment-001'
      })
    ).rejects.toThrow(ExperimentNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
