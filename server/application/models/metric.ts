import type { MetricThreshold } from './metric-threshold'

/**
 * Supported metric data types for UC-13 and UC-14.
 */
export const metricDataTypes = [
  'NUMBER',
  'PERCENT',
  'CURRENCY'
] as const

/**
 * Union type for supported metric data types.
 */
export type MetricDataType = (typeof metricDataTypes)[number]

/**
 * Represents one persisted metric in a specific hypothesis.
 */
export type Metric = {
  id: string
  hypothesisId: string
  name: string
  description: string | null
  dataType: MetricDataType
  unit: string | null
  threshold: MetricThreshold | null
  createdAt: Date
  updatedAt: Date
}
