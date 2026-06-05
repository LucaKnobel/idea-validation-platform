import type { MetricThreshold, ThresholdOperator } from '@application/models/metric-threshold'
import type { MetricOwnerInput } from '@application/interfaces/ownership-inputs'

export type MetricThresholdMutationInput = MetricOwnerInput & {
  operator: ThresholdOperator
  referenceValue: number
}

/**
 * Persistence contract for upserting and deleting threshold rules for owned metrics.
 */
export interface MetricThresholdRepository {
  /**
   * Upserts one threshold for a metric owned by the given user.
   * Returns null when the metric does not exist or is not accessible.
   */
  upsertByMetricForUser(input: MetricThresholdMutationInput): Promise<MetricThreshold | null>

  /**
   * Deletes one threshold of a metric owned by the given user.
   * Returns true when a row was deleted.
   */
  deleteByMetricForUser(input: MetricOwnerInput): Promise<boolean>
}
