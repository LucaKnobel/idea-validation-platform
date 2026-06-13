import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildUpsertMetric } from '@application/services/build-upsert-metric'
import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'
import type { MetricRepository } from '@application/interfaces/metric-repository'
import type { Logger } from '@interfaces/logger'
import { makeMetric, makeMetricRepository, makeLogger, VALID_USER_ID } from './helpers'

describe('buildUpsertMetric', () => {
  let metricRepository: MetricRepository
  let logger: Logger
  let upsertMetric: ReturnType<typeof buildUpsertMetric>

  const validInput = {
    userId: VALID_USER_ID,
    hypothesisId: 'hypothesis-001',
    name: 'Conversion Rate',
    description: 'Sign-up conversion.',
    unit: '%',
    threshold: { operator: 'GTE' as const, referenceValue: 10 }
  }

  beforeEach(() => {
    metricRepository = makeMetricRepository()
    logger = makeLogger()
    upsertMetric = buildUpsertMetric(metricRepository, logger)
    vi.mocked(metricRepository.upsertByHypothesis).mockResolvedValue(makeMetric())
  })

  it('calls upsertByHypothesis with the correct input', async () => {
    await upsertMetric(validInput)

    expect(metricRepository.upsertByHypothesis).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001',
      name: 'Conversion Rate',
      description: 'Sign-up conversion.',
      unit: '%',
      threshold: { operator: 'GTE', referenceValue: 10 }
    })
  })

  it('returns the upserted metric unchanged', async () => {
    const metric = makeMetric({ id: 'metric-xyz' })
    vi.mocked(metricRepository.upsertByHypothesis).mockResolvedValue(metric)

    const result = await upsertMetric(validInput)

    expect(result).toEqual(metric)
  })

  it('logs the upserted metric id', async () => {
    vi.mocked(metricRepository.upsertByHypothesis).mockResolvedValue(makeMetric({ id: 'metric-xyz' }))

    await upsertMetric(validInput)

    expect(logger.debug).toHaveBeenCalledWith('Metric upserted', {
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001',
      metricId: 'metric-xyz'
    })
  })

  it('throws HypothesisNotFoundError when the hypothesis is not accessible', async () => {
    vi.mocked(metricRepository.upsertByHypothesis).mockResolvedValue(null)

    await expect(upsertMetric(validInput)).rejects.toThrow(HypothesisNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
