import type { MetricThresholdRepository } from '@application/interfaces/metric-threshold-repository'
import type { MetricThreshold, ThresholdOperator } from '@application/models/metric-threshold'
import type { Logger } from '@interfaces/logger'
import { MetricNotFoundError } from '@application/errors/metric-errors'

export type UpsertMetricThresholdInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
  hypothesisId: string
  metricId: string
  operator: ThresholdOperator
  referenceValue: number
}

/**
 * Builds the use case that creates or updates one threshold for a metric.
 */
export const createUpsertMetricThreshold = (
  metricThresholdRepository: MetricThresholdRepository,
  logger: Logger
) => {
  return async (input: UpsertMetricThresholdInput): Promise<MetricThreshold> => {
    const threshold = await metricThresholdRepository.upsertByMetricForUser({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      metricId: input.metricId,
      operator: input.operator,
      referenceValue: input.referenceValue
    })

    if (threshold === null) {
      throw new MetricNotFoundError()
    }

    logger.debug('Metric threshold upserted', {
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      metricId: input.metricId,
      thresholdId: threshold.id
    })

    return threshold
  }
}
