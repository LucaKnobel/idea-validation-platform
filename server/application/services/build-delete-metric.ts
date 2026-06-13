import type { MetricRepository } from '@application/interfaces/metric-repository'
import type { Logger } from '@interfaces/logger'
import { MetricNotFoundError } from '@application/errors/metric-errors'

export type DeleteMetricInput = {
  userId: string
  hypothesisId: string
}

/**
 * Builds the use case that deletes the metric singleton for one owned hypothesis.
 */
export const buildDeleteMetric = (metricRepository: MetricRepository, logger: Logger) => {
  return async (input: DeleteMetricInput): Promise<void> => {
    const deleted = await metricRepository.deleteByHypothesis({
      userId: input.userId,
      hypothesisId: input.hypothesisId
    })

    if (!deleted) {
      throw new MetricNotFoundError()
    }

    logger.debug('Metric deleted', {
      userId: input.userId,
      hypothesisId: input.hypothesisId
    })
  }
}
