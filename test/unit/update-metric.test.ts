import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createUpdateMetric } from '@application/services/update-metric'
import { MetricNotFoundError } from '@application/errors/metric-errors'
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

describe('createUpdateMetric', () => {
  let metricRepository: MetricRepository
  let logger: Logger
  let updateMetric: ReturnType<typeof createUpdateMetric>

  beforeEach(() => {
    metricRepository = makeMetricRepository()
    logger = makeLogger()
    updateMetric = createUpdateMetric(metricRepository, logger)
    vi.mocked(metricRepository.updateByIdForUser).mockResolvedValue(makeMetric())
  })

  it('trims text fields, derives currency data type from unit and forwards threshold data', async () => {
    await updateMetric({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      metricId: 'metric-001',
      name: '  Willingness To Pay  ',
      description: '  Average amount users are willing to pay.  ',
      unit: ' chf ',
      threshold: {
        operator: 'GTE',
        referenceValue: 19
      }
    })

    expect(metricRepository.updateByIdForUser).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      metricId: 'metric-001',
      name: 'Willingness To Pay',
      description: 'Average amount users are willing to pay.',
      dataType: 'CURRENCY',
      unit: 'chf',
      threshold: {
        operator: 'GTE',
        referenceValue: 19
      }
    })
  })

  it('returns the updated metric unchanged', async () => {
    const metric = makeMetric({ id: 'metric-xyz' })
    vi.mocked(metricRepository.updateByIdForUser).mockResolvedValueOnce(metric)

    const result = await updateMetric({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      metricId: 'metric-xyz',
      name: 'Conversion Rate',
      description: null,
      unit: '%',
      threshold: {
        operator: 'GTE',
        referenceValue: 10
      }
    })

    expect(result).toEqual(metric)
  })

  it('throws MetricNotFoundError when the metric is not accessible', async () => {
    vi.mocked(metricRepository.updateByIdForUser).mockResolvedValueOnce(null)

    await expect(updateMetric({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      metricId: 'metric-001',
      name: 'Conversion Rate',
      description: null,
      unit: '%',
      threshold: {
        operator: 'GTE',
        referenceValue: 10
      }
    })).rejects.toThrow(MetricNotFoundError)
  })
})
