import type { MetricRepository } from '@application/interfaces/metric-repository'
import type { Metric, MetricDataType } from '@application/models/metric'
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
  dataType: MetricDataType
  unit: string | null
}

/**
 * Builds the use case that updates one metric owned by the current user.
 */
export const createUpdateMetric = (metricRepository: MetricRepository, logger: Logger) => {
  return async (input: UpdateMetricInput): Promise<Metric> => {
    const metric = await metricRepository.updateByIdForUser({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      metricId: input.metricId,
      name: input.name.trim(),
      description: input.description,
      dataType: input.dataType,
      unit: input.unit
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
