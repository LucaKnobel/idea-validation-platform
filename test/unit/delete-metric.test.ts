import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDeleteMetric } from '@application/services/delete-metric'
import { MetricNotFoundError } from '@application/errors/metric-errors'
import type { MetricRepository } from '@application/interfaces/metric-repository'
import type { Logger } from '@interfaces/logger'
import {
  VALID_IDEA_ID,
  VALID_IDEA_VERSION_ID,
  VALID_USER_ID,
  makeLogger,
  makeMetricRepository
} from './helpers'

describe('createDeleteMetric', () => {
  let metricRepository: MetricRepository
  let logger: Logger
  let deleteMetric: ReturnType<typeof createDeleteMetric>

  beforeEach(() => {
    metricRepository = makeMetricRepository()
    logger = makeLogger()
    deleteMetric = createDeleteMetric(metricRepository, logger)
    vi.mocked(metricRepository.deleteByIdForUser).mockResolvedValue(true)
  })

  it('deletes the requested metric for the current user', async () => {
    await deleteMetric({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      metricId: 'metric-001'
    })

    expect(metricRepository.deleteByIdForUser).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      metricId: 'metric-001'
    })
  })

  it('resolves without a return value on success', async () => {
    const result = await deleteMetric({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      metricId: 'metric-001'
    })

    expect(result).toBeUndefined()
  })

  it('logs the deleted metric id after success', async () => {
    await deleteMetric({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      metricId: 'metric-001'
    })

    expect(logger.debug).toHaveBeenCalledWith('Metric deleted', {
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      metricId: 'metric-001'
    })
  })

  it('throws MetricNotFoundError when no metric was deleted', async () => {
    vi.mocked(metricRepository.deleteByIdForUser).mockResolvedValueOnce(false)

    await expect(
      deleteMetric({
        userId: VALID_USER_ID,
        ideaId: VALID_IDEA_ID,
        ideaVersionId: VALID_IDEA_VERSION_ID,
        hypothesisId: 'hypothesis-001',
        metricId: 'metric-001'
      })
    ).rejects.toThrow(MetricNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
