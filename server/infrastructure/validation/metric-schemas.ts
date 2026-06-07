import * as z from 'zod'
import { thresholdOperators } from '@application/models/metric-threshold'
import { HypothesisRouteParamsSchema } from '@infrastructure/validation/hypothesis-schemas'
import { createNullableTrimmedStringSchema } from '@infrastructure/validation/string-schemas'

export const MetricCollectionRouteParamsSchema = HypothesisRouteParamsSchema

export const MetricRouteParamsSchema = MetricCollectionRouteParamsSchema.extend({
  metricId: z.uuid()
})

export const ThresholdOperatorSchema = z.enum(thresholdOperators)

export const MetricThresholdInputSchema = z.object({
  operator: ThresholdOperatorSchema,
  referenceValue: z.number()
})

export const UpsertMetricBodySchema = z.object({
  name: z.string().trim().min(1, 'Metric name is required').max(200, 'Metric name is too long'),
  description: createNullableTrimmedStringSchema(1000, 'Metric description is too long'),
  unit: createNullableTrimmedStringSchema(100, 'Metric unit is too long'),
  threshold: MetricThresholdInputSchema
})

export const CreateMetricBodySchema = UpsertMetricBodySchema

export const UpdateMetricBodySchema = UpsertMetricBodySchema

export const MetricThresholdResponseSchema = z.object({
  id: z.uuid(),
  metricId: z.uuid(),
  operator: ThresholdOperatorSchema,
  referenceValue: z.number(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
})

export const MetricResponseSchema = z.object({
  id: z.uuid(),
  hypothesisId: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  unit: z.string().nullable(),
  threshold: MetricThresholdResponseSchema.nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
})

export const MetricsListResponseSchema = z.object({
  items: z.array(MetricResponseSchema)
})

export type MetricCollectionRouteParamsDto = z.infer<typeof MetricCollectionRouteParamsSchema>
export type MetricRouteParamsDto = z.infer<typeof MetricRouteParamsSchema>
export type CreateMetricBodyDto = z.infer<typeof CreateMetricBodySchema>
export type UpdateMetricBodyDto = z.infer<typeof UpdateMetricBodySchema>
export type MetricThresholdResponseDto = z.infer<typeof MetricThresholdResponseSchema>
export type MetricResponseDto = z.infer<typeof MetricResponseSchema>
export type MetricsListResponseDto = z.infer<typeof MetricsListResponseSchema>
