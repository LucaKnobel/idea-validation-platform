/**
 * Supported threshold operators for evaluating one metric value.
 */
export const thresholdOperators = [
  'GTE',
  'GT',
  'LTE',
  'LT',
  'EQ'
] as const

/**
 * Union type for supported threshold operators.
 */
export type ThresholdOperator = (typeof thresholdOperators)[number]

/**
 * Represents one persisted threshold rule for a metric.
 */
export type MetricThreshold = {
  id: string
  metricId: string
  operator: ThresholdOperator
  referenceValue: number
  createdAt: Date
  updatedAt: Date
}
