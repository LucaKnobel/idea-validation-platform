import type { HypothesisIdOwnerInput } from '@application/interfaces/ownership-inputs'
import type { Measurement } from '@application/models/measurement'

export type MeasurementFieldsInput = {
  value: number
  note: string | null
}

export type MeasurementUpsertInput = HypothesisIdOwnerInput & MeasurementFieldsInput

/**
 * Persistence contract for measurement singleton operations in one owned hypothesis.
 */
export interface MeasurementRepository {
  /**
   * Returns the measurement singleton owned by the given user.
   * Returns null when the hypothesis does not exist, is not accessible, or has no measurement.
   */
  getByHypothesis(input: HypothesisIdOwnerInput): Promise<Measurement | null>

  /**
   * Creates or updates the measurement singleton in a hypothesis owned by the given user.
   * Returns null when the hypothesis does not exist or is not accessible.
   */
  upsertByHypothesis(input: MeasurementUpsertInput): Promise<Measurement | null>

  /**
   * Deletes the measurement singleton owned by the given user.
   * Returns true when a row was deleted.
   */
  deleteByHypothesis(input: HypothesisIdOwnerInput): Promise<boolean>
}
