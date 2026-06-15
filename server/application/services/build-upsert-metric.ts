import type { MetricRepository } from '@application/interfaces/metric-repository'
import type { HypothesisStatusSyncService } from '@application/interfaces/hypothesis-status-sync'
import type { Metric } from '@application/models/metric'
import type { ThresholdOperator } from '@application/models/metric-threshold'
import type { Logger } from '@interfaces/logger'
import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'

export type UpsertMetricInput = {
  userId: string
  hypothesisId: string
  name: string
  description: string | null
  unit: string | null
  threshold: {
    operator: ThresholdOperator
    referenceValue: number
  }
}

/**
 * Builds the use case that creates or updates the metric singleton for one owned hypothesis.
 */
export const buildUpsertMetric = (
  metricRepository: MetricRepository,
  hypothesisStatusSyncService: HypothesisStatusSyncService,
  logger: Logger
) => {
  return async (input: UpsertMetricInput): Promise<Metric> => {
    const metric = await metricRepository.upsertByHypothesis({
      userId: input.userId,
      hypothesisId: input.hypothesisId,
      name: input.name,
      description: input.description,
      unit: input.unit,
      threshold: input.threshold
    })

    if (metric === null) {
      throw new HypothesisNotFoundError()
    }

    await hypothesisStatusSyncService.sync({
      userId: input.userId,
      hypothesisId: input.hypothesisId
    })

    logger.debug('Metric upserted', {
      userId: input.userId,
      hypothesisId: input.hypothesisId,
      metricId: metric.id
    })

    return metric
  }
}
