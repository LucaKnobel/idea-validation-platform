import type { MetricRepository } from '@application/interfaces/metric-repository'
import type { Metric } from '@application/models/metric'
import type { ThresholdOperator } from '@application/models/metric-threshold'
import type { Logger } from '@interfaces/logger'
import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'

export type CreateMetricInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
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
 * Builds the use case that creates one metric in a specific hypothesis.
 */
export const createCreateMetric = (metricRepository: MetricRepository, logger: Logger) => {
  return async (input: CreateMetricInput): Promise<Metric> => {
    const normalizedDescription = input.description?.trim() || null
    const normalizedUnit = input.unit?.trim() || null

    const metric = await metricRepository.createForHypothesis({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      name: input.name.trim(),
      description: normalizedDescription,
      unit: normalizedUnit,
      threshold: input.threshold
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
