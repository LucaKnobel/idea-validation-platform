import * as z from 'zod'
import { thresholdOperators } from '@application/models/metric-threshold'
import { createNullableTrimmedStringSchema } from '@infrastructure/validation/string-schemas'

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

export const MetricThresholdResponseSchema = z.object({
  operator: ThresholdOperatorSchema,
  referenceValue: z.number()
})

export const MetricResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  unit: z.string().nullable(),
  threshold: MetricThresholdResponseSchema.nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
})

export type UpsertMetricBodyDto = z.infer<typeof UpsertMetricBodySchema>
export type MetricThresholdResponseDto = z.infer<typeof MetricThresholdResponseSchema>
export type MetricResponseDto = z.infer<typeof MetricResponseSchema>
