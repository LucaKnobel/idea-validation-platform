/**
 * Represents one persisted measured value for a metric within one experiment.
 */
export type Measurement = {
  id: string
  experimentId: string
  metricId: string
  value: number
  note: string | null
  createdAt: Date
  updatedAt: Date
}
