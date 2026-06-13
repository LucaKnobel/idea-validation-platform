import type { Metric } from '@application/models/metric'
import type { HypothesisIdOwnerInput } from '@application/interfaces/ownership-inputs'
import type { ThresholdOperator } from '@application/models/metric-threshold'

export type MetricThresholdFieldsInput = {
  operator: ThresholdOperator
  referenceValue: number
}

export type MetricFieldsInput = {
  name: string
  description: string | null
  unit: string | null
  threshold: MetricThresholdFieldsInput
}

export type MetricUpsertInput = HypothesisIdOwnerInput & MetricFieldsInput

/**
 * Persistence contract for metric singleton operations in one owned hypothesis.
 */
export interface MetricRepository {
  /**
   * Returns the metric singleton for a hypothesis owned by the given user.
   * Returns null when the hypothesis does not exist or is not accessible.
   */
  getByHypothesis(input: HypothesisIdOwnerInput): Promise<Metric | null>

  /**
   * Creates or updates the metric singleton in a hypothesis owned by the given user.
   * Returns null when the hypothesis does not exist or is not accessible.
   */
  upsertByHypothesis(input: MetricUpsertInput): Promise<Metric | null>

  /**
   * Deletes the metric singleton owned by the given user.
   * Returns true when a row was deleted.
   */
  deleteByHypothesis(input: HypothesisIdOwnerInput): Promise<boolean>
}
