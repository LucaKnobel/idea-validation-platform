import type { MetricRepository } from '@application/interfaces/metric-repository'
import type { Metric, MetricDataType } from '@application/models/metric'
import type { Logger } from '@interfaces/logger'
import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'

export type CreateMetricInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
  hypothesisId: string
  name: string
  description: string | null
  dataType: MetricDataType
  unit: string | null
}

/**
 * Builds the use case that creates one metric in a specific hypothesis.
 */
export const createCreateMetric = (metricRepository: MetricRepository, logger: Logger) => {
  return async (input: CreateMetricInput): Promise<Metric> => {
    const metric = await metricRepository.createForHypothesis({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      name: input.name.trim(),
      description: input.description,
      dataType: input.dataType,
      unit: input.unit
    })

    if (metric === null) {
      throw new HypothesisNotFoundError()
    }

    logger.debug('Metric created', {
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      metricId: metric.id
    })

    return metric
  }
}
