import type { MetricThresholdRepository } from '@application/interfaces/metric-threshold-repository'
import type { Logger } from '@interfaces/logger'
import { MetricThresholdNotFoundError } from '@application/errors/metric-errors'

export type DeleteMetricThresholdInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
  hypothesisId: string
  metricId: string
}

/**
 * Builds the use case that deletes one threshold rule owned by the current user.
 */
export const createDeleteMetricThreshold = (
  metricThresholdRepository: MetricThresholdRepository,
  logger: Logger
) => {
  return async (input: DeleteMetricThresholdInput): Promise<void> => {
    const deleted = await metricThresholdRepository.deleteByMetricForUser({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      metricId: input.metricId
    })

    if (!deleted) {
      throw new MetricThresholdNotFoundError()
    }

    logger.debug('Metric threshold deleted', {
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      metricId: input.metricId
    })
  }
}
