import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildDeleteMetric } from '@application/services/build-delete-metric'
import type { HypothesisStatusSyncService } from '@application/interfaces/hypothesis-status-sync'
import { MetricNotFoundError } from '@application/errors/metric-errors'
import type { MetricRepository } from '@application/interfaces/metric-repository'
import type { Logger } from '@interfaces/logger'
import { makeHypothesis, makeLogger, makeMetricRepository, VALID_USER_ID } from './helpers'

describe('buildDeleteMetric', () => {
  let metricRepository: MetricRepository
  let hypothesisStatusSyncService: HypothesisStatusSyncService
  let logger: Logger
  let deleteMetric: ReturnType<typeof buildDeleteMetric>

  beforeEach(() => {
    metricRepository = makeMetricRepository()
    hypothesisStatusSyncService = {
      sync: vi.fn().mockResolvedValue(makeHypothesis())
    }
    logger = makeLogger()
    deleteMetric = buildDeleteMetric(metricRepository, hypothesisStatusSyncService, logger)
    vi.mocked(metricRepository.deleteByHypothesis).mockResolvedValue(true)
  })

  it('calls deleteByHypothesis with the correct input', async () => {
    await deleteMetric({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(metricRepository.deleteByHypothesis).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001'
    })
  })

  it('resolves without a return value on success', async () => {
    const result = await deleteMetric({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(result).toBeUndefined()
  })

  it('logs the deletion', async () => {
    await deleteMetric({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(logger.debug).toHaveBeenCalledWith('Metric deleted', {
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001'
    })
  })

  it('syncs hypothesis status after deletion', async () => {
    await deleteMetric({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(hypothesisStatusSyncService.sync).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001'
    })
  })

  it('throws MetricNotFoundError when no metric was deleted', async () => {
    vi.mocked(metricRepository.deleteByHypothesis).mockResolvedValue(false)

    await expect(
      deleteMetric({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })
    ).rejects.toThrow(MetricNotFoundError)

    expect(hypothesisStatusSyncService.sync).not.toHaveBeenCalled()
    expect(logger.debug).not.toHaveBeenCalled()
  })
})
