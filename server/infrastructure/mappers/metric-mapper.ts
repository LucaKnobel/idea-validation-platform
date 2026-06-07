import type { Metric } from '@application/models/metric'
import {
  MetricResponseSchema,
  MetricsListResponseSchema,
  type MetricResponseDto,
  type MetricsListResponseDto
} from '@infrastructure/validation/metric-schemas'

/**
 * Maps one domain metric aggregate to the public API response DTO.
 */
export const toMetricResponseDto = (metric: Metric): MetricResponseDto => {
  return MetricResponseSchema.parse({
    id: metric.id,
    hypothesisId: metric.hypothesisId,
    name: metric.name,
    description: metric.description,
    unit: metric.unit,
    threshold: metric.threshold
      ? {
          id: metric.threshold.id,
          metricId: metric.threshold.metricId,
          operator: metric.threshold.operator,
          referenceValue: Number(metric.threshold.referenceValue),
          createdAt: metric.threshold.createdAt.toISOString(),
          updatedAt: metric.threshold.updatedAt.toISOString()
        }
      : null,
    createdAt: metric.createdAt.toISOString(),
    updatedAt: metric.updatedAt.toISOString()
  })
}

/**
 * Maps a list of domain metrics to the public collection DTO.
 */
export const toMetricsListResponseDto = (metrics: Metric[]): MetricsListResponseDto => {
  return MetricsListResponseSchema.parse({
    items: metrics.map(toMetricResponseDto)
  })
}
