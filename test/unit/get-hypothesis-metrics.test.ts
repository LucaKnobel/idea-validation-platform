import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createGetHypothesisMetrics } from '@application/services/get-hypothesis-metrics'
import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'
import type { MetricRepository } from '@application/interfaces/metric-repository'
import type { Logger } from '@interfaces/logger'
import {
  VALID_IDEA_ID,
  VALID_IDEA_VERSION_ID,
  VALID_USER_ID,
  makeLogger,
  makeMetric,
  makeMetricRepository
} from './helpers'

describe('createGetHypothesisMetrics', () => {
  let metricRepository: MetricRepository
  let logger: Logger
  let getHypothesisMetrics: ReturnType<typeof createGetHypothesisMetrics>

  beforeEach(() => {
    metricRepository = makeMetricRepository()
    logger = makeLogger()
    getHypothesisMetrics = createGetHypothesisMetrics(metricRepository, logger)
    vi.mocked(metricRepository.listByHypothesisForUser).mockResolvedValue([makeMetric()])
  })

  it('loads metrics for the requested user and hypothesis', async () => {
    await getHypothesisMetrics({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001'
    })

    expect(metricRepository.listByHypothesisForUser).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001'
    })
  })

  it('returns the repository result unchanged', async () => {
    const metrics = [makeMetric(), makeMetric({ id: 'metric-002', name: 'Interview Count', unit: null })]
    vi.mocked(metricRepository.listByHypothesisForUser).mockResolvedValueOnce(metrics)

    const result = await getHypothesisMetrics({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001'
    })

    expect(result).toEqual(metrics)
  })

  it('logs the loaded metric count', async () => {
    const metrics = [makeMetric(), makeMetric({ id: 'metric-002' })]
    vi.mocked(metricRepository.listByHypothesisForUser).mockResolvedValueOnce(metrics)

    await getHypothesisMetrics({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001'
    })

    expect(logger.debug).toHaveBeenCalledWith('Metrics listed', {
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      items: 2
    })
  })

  it('throws HypothesisNotFoundError when the hypothesis is not accessible', async () => {
    vi.mocked(metricRepository.listByHypothesisForUser).mockResolvedValueOnce(null)

    await expect(
      getHypothesisMetrics({
        userId: VALID_USER_ID,
        ideaId: VALID_IDEA_ID,
        ideaVersionId: VALID_IDEA_VERSION_ID,
        hypothesisId: 'hypothesis-001'
      })
    ).rejects.toThrow(HypothesisNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
