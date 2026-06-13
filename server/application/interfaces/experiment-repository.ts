import type { Experiment, ExperimentStatus } from '@application/models/experiment'
import type { HypothesisIdOwnerInput } from '@application/interfaces/ownership-inputs'

export type ExperimentFieldsInput = {
  title: string
  description: string | null
  status: ExperimentStatus
}

export type ExperimentUpsertInput = HypothesisIdOwnerInput & ExperimentFieldsInput

/**
 * Persistence contract for experiment singleton operations in one owned hypothesis.
 */
export interface ExperimentRepository {
  /**
   * Returns the experiment singleton for a hypothesis owned by the given user.
   * Returns null when the hypothesis does not exist or is not accessible.
   */
  getByHypothesis(input: HypothesisIdOwnerInput): Promise<Experiment | null>

  /**
   * Creates or updates the experiment singleton in a hypothesis owned by the given user.
   * Returns null when the hypothesis does not exist or is not accessible.
   */
  upsertByHypothesis(input: ExperimentUpsertInput): Promise<Experiment | null>

  /**
   * Deletes the experiment singleton owned by the given user.
   * Returns true when a row was deleted.
   */
  deleteByHypothesis(input: HypothesisIdOwnerInput): Promise<boolean>
}
