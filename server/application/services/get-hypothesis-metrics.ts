import type { MetricRepository } from '@application/interfaces/metric-repository'
import type { Metric } from '@application/models/metric'
import type { Logger } from '@interfaces/logger'
import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'

export type GetHypothesisMetricsInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
  hypothesisId: string
}

/**
 * Builds the use case that lists all metrics for one specific hypothesis.
 */
export const createGetHypothesisMetrics = (metricRepository: MetricRepository, logger: Logger) => {
  return async (input: GetHypothesisMetricsInput): Promise<Metric[]> => {
    const metrics = await metricRepository.listByHypothesisForUser({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId
    })

    if (metrics === null) {
      throw new HypothesisNotFoundError()
    }

    logger.debug('Metrics listed', {
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      items: metrics.length
    })

    return metrics
  }
}
