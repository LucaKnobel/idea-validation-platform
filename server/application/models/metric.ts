import type { MetricThreshold } from './metric-threshold'

/**
 * Represents one persisted metric in a specific hypothesis.
 */
export type Metric = {
  id: string
  hypothesisId: string
  name: string
  description: string | null
  unit: string | null
  threshold: MetricThreshold | null
  createdAt: Date
  updatedAt: Date
}
