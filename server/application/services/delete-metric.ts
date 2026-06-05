import type { MetricRepository } from '@application/interfaces/metric-repository'
import type { Logger } from '@interfaces/logger'
import { MetricNotFoundError } from '@application/errors/metric-errors'

export type DeleteMetricInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
  hypothesisId: string
  metricId: string
}

/**
 * Builds the use case that deletes one metric owned by the current user.
 */
export const createDeleteMetric = (metricRepository: MetricRepository, logger: Logger) => {
  return async (input: DeleteMetricInput): Promise<void> => {
    const deleted = await metricRepository.deleteByIdForUser({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      metricId: input.metricId
    })

    if (!deleted) {
      throw new MetricNotFoundError()
    }

    logger.debug('Metric deleted', {
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      metricId: input.metricId
    })
  }
}
