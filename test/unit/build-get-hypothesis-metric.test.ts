import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildGetHypothesisMetric } from '@application/services/build-get-hypothesis-metric'
import { MetricNotFoundError } from '@application/errors/metric-errors'
import type { MetricRepository } from '@application/interfaces/metric-repository'
import type { Logger } from '@interfaces/logger'
import { makeMetric, makeMetricRepository, makeLogger, VALID_USER_ID } from './helpers'

describe('buildGetHypothesisMetric', () => {
  let metricRepository: MetricRepository
  let logger: Logger
  let getHypothesisMetric: ReturnType<typeof buildGetHypothesisMetric>

  beforeEach(() => {
    metricRepository = makeMetricRepository()
    logger = makeLogger()
    getHypothesisMetric = buildGetHypothesisMetric(metricRepository, logger)
    vi.mocked(metricRepository.getByHypothesis).mockResolvedValue(makeMetric())
  })

  it('calls getByHypothesis with the correct input', async () => {
    await getHypothesisMetric({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(metricRepository.getByHypothesis).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001'
    })
  })

  it('returns the repository result unchanged', async () => {
    const metric = makeMetric({ id: 'metric-xyz' })
    vi.mocked(metricRepository.getByHypothesis).mockResolvedValue(metric)

    const result = await getHypothesisMetric({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(result).toEqual(metric)
  })

  it('logs the loaded metric id', async () => {
    vi.mocked(metricRepository.getByHypothesis).mockResolvedValue(makeMetric({ id: 'metric-xyz' }))

    await getHypothesisMetric({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(logger.debug).toHaveBeenCalledWith('Metric loaded', {
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001',
      metricId: 'metric-xyz'
    })
  })

  it('throws MetricNotFoundError when no metric exists for the hypothesis', async () => {
    vi.mocked(metricRepository.getByHypothesis).mockResolvedValue(null)

    await expect(
      getHypothesisMetric({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })
    ).rejects.toThrow(MetricNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
