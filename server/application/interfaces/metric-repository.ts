import type { Metric, MetricDataType } from '@application/models/metric'
import type { HypothesisOwnerInput, MetricOwnerInput } from '@application/interfaces/ownership-inputs'

export type MetricFieldsInput = {
  name: string
  description: string | null
  dataType: MetricDataType
  unit: string | null
}

export type MetricWriteInput = HypothesisOwnerInput & MetricFieldsInput

export type MetricMutationInput = MetricOwnerInput & MetricFieldsInput

/**
 * Persistence contract for reading and mutating metrics in one owned hypothesis.
 */
export interface MetricRepository {
  /**
   * Returns all metrics for a hypothesis owned by the given user.
   * Returns null when the hypothesis does not exist or is not accessible.
   */
  listByHypothesisForUser(input: HypothesisOwnerInput): Promise<Metric[] | null>

  /**
   * Creates one metric in a hypothesis owned by the given user.
   * Returns null when the hypothesis does not exist or is not accessible.
   */
  createForHypothesis(input: MetricWriteInput): Promise<Metric | null>

  /**
   * Updates one metric owned by the given user.
   * Returns null when the metric does not exist or is not accessible.
   */
  updateByIdForUser(input: MetricMutationInput): Promise<Metric | null>

  /**
   * Deletes one metric owned by the given user.
   * Returns true when a row was deleted.
   */
  deleteByIdForUser(input: MetricOwnerInput): Promise<boolean>
}
