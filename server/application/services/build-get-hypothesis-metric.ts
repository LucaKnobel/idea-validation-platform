import type { MetricRepository } from '@application/interfaces/metric-repository'
import type { Metric } from '@application/models/metric'
import type { Logger } from '@interfaces/logger'
import { MetricNotFoundError } from '@application/errors/metric-errors'

export type GetHypothesisMetricInput = {
  userId: string
  hypothesisId: string
}

/**
 * Builds the use case that loads the metric singleton for one owned hypothesis.
 */
export const buildGetHypothesisMetric = (metricRepository: MetricRepository, logger: Logger) => {
  return async (input: GetHypothesisMetricInput): Promise<Metric> => {
    const metric = await metricRepository.getByHypothesis({
      userId: input.userId,
      hypothesisId: input.hypothesisId
    })

    if (metric === null) {
      throw new MetricNotFoundError()
    }

    logger.debug('Metric loaded', {
      userId: input.userId,
      hypothesisId: input.hypothesisId,
      metricId: metric.id
    })

    return metric
  }
}
