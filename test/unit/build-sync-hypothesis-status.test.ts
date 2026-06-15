import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'
import {
  buildSyncHypothesisStatus,
  deriveHypothesisStatus
} from '@application/services/build-sync-hypothesis-status'
import type { ExperimentRepository } from '@application/interfaces/experiment-repository'
import type { HypothesisRepository } from '@application/interfaces/hypothesis-repository'
import type { MeasurementRepository } from '@application/interfaces/measurement-repository'
import type { MetricRepository } from '@application/interfaces/metric-repository'
import type { Logger } from '@interfaces/logger'
import {
  makeExperiment,
  makeExperimentRepository,
  makeHypothesis,
  makeHypothesisRepository,
  makeLogger,
  makeMeasurement,
  makeMeasurementRepository,
  makeMetric,
  makeMetricRepository,
  makeMetricThreshold,
  VALID_USER_ID
} from './helpers'

describe('deriveHypothesisStatus', () => {
  it('returns NOT_TESTED when experiment is not completed', () => {
    const status = deriveHypothesisStatus({
      experimentStatus: 'RUNNING',
      threshold: makeMetricThreshold(),
      measurementValue: 12
    })

    expect(status).toBe('NOT_TESTED')
  })

  it('returns NOT_TESTED when threshold is missing', () => {
    const status = deriveHypothesisStatus({
      experimentStatus: 'COMPLETED',
      threshold: null,
      measurementValue: 12
    })

    expect(status).toBe('NOT_TESTED')
  })

  it('returns NOT_TESTED when measurement is missing', () => {
    const status = deriveHypothesisStatus({
      experimentStatus: 'COMPLETED',
      threshold: makeMetricThreshold(),
      measurementValue: null
    })

    expect(status).toBe('NOT_TESTED')
  })

  it('returns VALIDATED for a satisfied threshold', () => {
    const status = deriveHypothesisStatus({
      experimentStatus: 'COMPLETED',
      threshold: makeMetricThreshold({ operator: 'GTE', referenceValue: 10 }),
      measurementValue: 10
    })

    expect(status).toBe('VALIDATED')
  })

  it('returns INVALIDATED for an unsatisfied threshold', () => {
    const status = deriveHypothesisStatus({
      experimentStatus: 'COMPLETED',
      threshold: makeMetricThreshold({ operator: 'GT', referenceValue: 10 }),
      measurementValue: 10
    })

    expect(status).toBe('INVALIDATED')
  })

  it('returns VALIDATED for GT when value is greater than reference', () => {
    const status = deriveHypothesisStatus({
      experimentStatus: 'COMPLETED',
      threshold: makeMetricThreshold({ operator: 'GT', referenceValue: 10 }),
      measurementValue: 11
    })

    expect(status).toBe('VALIDATED')
  })

  it('returns VALIDATED for LTE when value is equal to reference', () => {
    const status = deriveHypothesisStatus({
      experimentStatus: 'COMPLETED',
      threshold: makeMetricThreshold({ operator: 'LTE', referenceValue: 10 }),
      measurementValue: 10
    })

    expect(status).toBe('VALIDATED')
  })

  it('returns INVALIDATED for LTE when value is greater than reference', () => {
    const status = deriveHypothesisStatus({
      experimentStatus: 'COMPLETED',
      threshold: makeMetricThreshold({ operator: 'LTE', referenceValue: 10 }),
      measurementValue: 11
    })

    expect(status).toBe('INVALIDATED')
  })

  it('returns VALIDATED for LT when value is lower than reference', () => {
    const status = deriveHypothesisStatus({
      experimentStatus: 'COMPLETED',
      threshold: makeMetricThreshold({ operator: 'LT', referenceValue: 10 }),
      measurementValue: 9
    })

    expect(status).toBe('VALIDATED')
  })

  it('returns INVALIDATED for LT when value is equal to reference', () => {
    const status = deriveHypothesisStatus({
      experimentStatus: 'COMPLETED',
      threshold: makeMetricThreshold({ operator: 'LT', referenceValue: 10 }),
      measurementValue: 10
    })

    expect(status).toBe('INVALIDATED')
  })

  it('returns VALIDATED for EQ when value equals reference', () => {
    const status = deriveHypothesisStatus({
      experimentStatus: 'COMPLETED',
      threshold: makeMetricThreshold({ operator: 'EQ', referenceValue: 10 }),
      measurementValue: 10
    })

    expect(status).toBe('VALIDATED')
  })

  it('returns INVALIDATED for EQ when value differs from reference', () => {
    const status = deriveHypothesisStatus({
      experimentStatus: 'COMPLETED',
      threshold: makeMetricThreshold({ operator: 'EQ', referenceValue: 10 }),
      measurementValue: 9
    })

    expect(status).toBe('INVALIDATED')
  })
})

describe('buildSyncHypothesisStatus', () => {
  let hypothesisRepository: HypothesisRepository
  let experimentRepository: ExperimentRepository
  let metricRepository: MetricRepository
  let measurementRepository: MeasurementRepository
  let logger: Logger
  let syncHypothesisStatus: ReturnType<typeof buildSyncHypothesisStatus>

  beforeEach(() => {
    hypothesisRepository = makeHypothesisRepository()
    experimentRepository = makeExperimentRepository()
    metricRepository = makeMetricRepository()
    measurementRepository = makeMeasurementRepository()
    logger = makeLogger()

    syncHypothesisStatus = buildSyncHypothesisStatus(
      hypothesisRepository,
      experimentRepository,
      metricRepository,
      measurementRepository,
      logger
    )
  })

  it('throws HypothesisNotFoundError when the hypothesis is not accessible', async () => {
    vi.mocked(hypothesisRepository.getById).mockResolvedValue(null)

    await expect(syncHypothesisStatus({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' }))
      .rejects.toThrow(HypothesisNotFoundError)

    expect(hypothesisRepository.updateStatus).not.toHaveBeenCalled()
  })

  it('returns existing hypothesis without status update when status remains unchanged', async () => {
    const hypothesis = makeHypothesis({ status: 'NOT_TESTED' })

    vi.mocked(hypothesisRepository.getById).mockResolvedValue(hypothesis)
    vi.mocked(experimentRepository.getByHypothesis).mockResolvedValue(makeExperiment({ status: 'RUNNING' }))
    vi.mocked(metricRepository.getByHypothesis).mockResolvedValue(makeMetric())
    vi.mocked(measurementRepository.getByHypothesis).mockResolvedValue(makeMeasurement())

    const result = await syncHypothesisStatus({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(result).toEqual(hypothesis)
    expect(hypothesisRepository.updateStatus).not.toHaveBeenCalled()
    expect(logger.debug).not.toHaveBeenCalled()
  })

  it('updates and returns hypothesis when status changes', async () => {
    vi.mocked(hypothesisRepository.getById).mockResolvedValue(makeHypothesis({ status: 'NOT_TESTED' }))
    vi.mocked(experimentRepository.getByHypothesis).mockResolvedValue(makeExperiment({ status: 'COMPLETED' }))
    vi.mocked(metricRepository.getByHypothesis).mockResolvedValue(
      makeMetric({ threshold: makeMetricThreshold({ operator: 'GTE', referenceValue: 10 }) })
    )
    vi.mocked(measurementRepository.getByHypothesis).mockResolvedValue(makeMeasurement({ value: 12 }))
    vi.mocked(hypothesisRepository.updateStatus).mockResolvedValue(makeHypothesis({ status: 'VALIDATED' }))

    const result = await syncHypothesisStatus({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(hypothesisRepository.updateStatus).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001',
      status: 'VALIDATED'
    })
    expect(result.status).toBe('VALIDATED')
    expect(logger.debug).toHaveBeenCalledWith('Hypothesis status synced', {
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001',
      previousStatus: 'NOT_TESTED',
      nextStatus: 'VALIDATED'
    })
  })

  it('throws HypothesisNotFoundError when status update loses ownership in race', async () => {
    vi.mocked(hypothesisRepository.getById).mockResolvedValue(makeHypothesis({ status: 'NOT_TESTED' }))
    vi.mocked(experimentRepository.getByHypothesis).mockResolvedValue(makeExperiment({ status: 'COMPLETED' }))
    vi.mocked(metricRepository.getByHypothesis).mockResolvedValue(makeMetric())
    vi.mocked(measurementRepository.getByHypothesis).mockResolvedValue(makeMeasurement({ value: 42 }))
    vi.mocked(hypothesisRepository.updateStatus).mockResolvedValue(null)

    await expect(syncHypothesisStatus({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' }))
      .rejects.toThrow(HypothesisNotFoundError)
  })
})
