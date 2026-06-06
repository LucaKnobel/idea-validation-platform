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

const PERCENT_UNITS = new Set([
  '%',
  'percent',
  'percentage'
])

const CURRENCY_UNITS = new Set([
  '$',
  '€',
  '£',
  '¥',
  'usd',
  'eur',
  'gbp',
  'chf',
  'jpy',
  'cad',
  'aud',
  'nzd'
])

/**
 * Derives the stored data type from the user-facing unit field.
 */
export const inferMetricDataType = (unit: string | null): MetricDataType => {
  const normalizedUnit = unit?.trim().toLowerCase() ?? ''

  if (PERCENT_UNITS.has(normalizedUnit)) {
    return 'PERCENT'
  }

  if (CURRENCY_UNITS.has(normalizedUnit)) {
    return 'CURRENCY'
  }

  return 'NUMBER'
}

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
