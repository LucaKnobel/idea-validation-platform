import type { MetricRepository } from '@application/interfaces/metric-repository'
import { inferMetricDataType, type Metric } from '@application/models/metric'
import type { ThresholdOperator } from '@application/models/metric-threshold'
import type { Logger } from '@interfaces/logger'
import { MetricNotFoundError } from '@application/errors/metric-errors'

export type UpdateMetricInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
  hypothesisId: string
  metricId: string
  name: string
  description: string | null
  unit: string | null
  threshold: {
    operator: ThresholdOperator
    referenceValue: number
  }
}

/**
 * Builds the use case that updates one metric owned by the current user.
 */
export const createUpdateMetric = (metricRepository: MetricRepository, logger: Logger) => {
  return async (input: UpdateMetricInput): Promise<Metric> => {
    const normalizedDescription = input.description?.trim() || null
    const normalizedUnit = input.unit?.trim() || null

    const metric = await metricRepository.updateByIdForUser({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      metricId: input.metricId,
      name: input.name.trim(),
      description: normalizedDescription,
      dataType: inferMetricDataType(normalizedUnit),
      unit: normalizedUnit,
      threshold: input.threshold
    })

    if (metric === null) {
      throw new MetricNotFoundError()
    }

    logger.debug('Metric updated', {
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      metricId: input.metricId
    })

    return metric
  }
}
