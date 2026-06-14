import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildDeleteMetric } from '@application/services/build-delete-metric'
import { MetricNotFoundError } from '@application/errors/metric-errors'
import type { MetricRepository } from '@application/interfaces/metric-repository'
import type { Logger } from '@interfaces/logger'
import { makeMetricRepository, makeLogger, VALID_USER_ID } from './helpers'

describe('buildDeleteMetric', () => {
  let metricRepository: MetricRepository
  let logger: Logger
  let deleteMetric: ReturnType<typeof buildDeleteMetric>

  beforeEach(() => {
    metricRepository = makeMetricRepository()
    logger = makeLogger()
    deleteMetric = buildDeleteMetric(metricRepository, logger)
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

  it('throws MetricNotFoundError when no metric was deleted', async () => {
    vi.mocked(metricRepository.deleteByHypothesis).mockResolvedValue(false)

    await expect(
      deleteMetric({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })
    ).rejects.toThrow(MetricNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
