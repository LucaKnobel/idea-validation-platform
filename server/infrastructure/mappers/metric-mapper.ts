import type { Metric } from '@application/models/metric'
import {
  MetricResponseSchema,
  type MetricResponseDto
} from '@infrastructure/validation/metric-schemas'

/**
 * Maps one domain metric aggregate to the public API response DTO.
 */
export const toMetricResponseDto = (metric: Metric): MetricResponseDto => {
  return MetricResponseSchema.parse({
    id: metric.id,
    name: metric.name,
    description: metric.description,
    unit: metric.unit,
    threshold: metric.threshold
      ? {
          operator: metric.threshold.operator,
          referenceValue: Number(metric.threshold.referenceValue)
        }
      : null,
    createdAt: metric.createdAt.toISOString(),
    updatedAt: metric.updatedAt.toISOString()
  })
}
