import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCreateMetric } from '@application/services/create-metric'
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

describe('createCreateMetric', () => {
  let metricRepository: MetricRepository
  let logger: Logger
  let createMetric: ReturnType<typeof createCreateMetric>

  beforeEach(() => {
    metricRepository = makeMetricRepository()
    logger = makeLogger()
    createMetric = createCreateMetric(metricRepository, logger)
    vi.mocked(metricRepository.createForHypothesis).mockResolvedValue(makeMetric())
  })

  it('trims text fields and forwards threshold data', async () => {
    await createMetric({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      name: '  Conversion Rate  ',
      description: '  Measures sign-up conversion.  ',
      unit: ' % ',
      threshold: {
        operator: 'GTE',
        referenceValue: 10
      }
    })

    expect(metricRepository.createForHypothesis).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      name: 'Conversion Rate',
      description: 'Measures sign-up conversion.',
      unit: '%',
      threshold: {
        operator: 'GTE',
        referenceValue: 10
      }
    })
  })

  it('normalizes empty optional fields to null', async () => {
    await createMetric({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      name: '  Interview Count ',
      description: '   ',
      unit: '   ',
      threshold: {
        operator: 'GTE',
        referenceValue: 5
      }
    })

    expect(metricRepository.createForHypothesis).toHaveBeenCalledWith(expect.objectContaining({
      description: null,
      unit: null
    }))
  })

  it('returns the created metric unchanged', async () => {
    const metric = makeMetric({ id: 'metric-xyz' })
    vi.mocked(metricRepository.createForHypothesis).mockResolvedValueOnce(metric)

    const result = await createMetric({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
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

  it('throws HypothesisNotFoundError when the target hypothesis is not accessible', async () => {
    vi.mocked(metricRepository.createForHypothesis).mockResolvedValueOnce(null)

    await expect(createMetric({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      name: 'Conversion Rate',
      description: null,
      unit: '%',
      threshold: {
        operator: 'GTE',
        referenceValue: 10
      }
    })).rejects.toThrow(HypothesisNotFoundError)
  })
})
