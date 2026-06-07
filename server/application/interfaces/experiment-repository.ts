import type { Experiment, ExperimentStatus } from '@application/models/experiment'
import type { ExperimentOwnerInput, HypothesisOwnerInput } from '@application/interfaces/ownership-inputs'

export type ExperimentFieldsInput = {
  title: string
  description: string | null
  status: ExperimentStatus
}

export type ExperimentWriteInput = HypothesisOwnerInput & ExperimentFieldsInput

export type ExperimentMutationInput = ExperimentOwnerInput & ExperimentFieldsInput

/**
 * Persistence contract for reading and mutating experiments in one owned hypothesis.
 */
export interface ExperimentRepository {
  /**
   * Returns all experiments for a hypothesis owned by the given user.
   * Returns null when the hypothesis does not exist or is not accessible.
   */
  listByHypothesisForUser(input: HypothesisOwnerInput): Promise<Experiment[] | null>

  /**
   * Creates one experiment in a hypothesis owned by the given user.
   * Returns null when the hypothesis does not exist or is not accessible.
   */
  createForHypothesis(input: ExperimentWriteInput): Promise<Experiment | null>

  /**
   * Updates one experiment owned by the given user.
   * Returns null when the experiment does not exist or is not accessible.
   */
  updateByIdForUser(input: ExperimentMutationInput): Promise<Experiment | null>

  /**
   * Deletes one experiment owned by the given user.
   * Returns true when a row was deleted.
   */
  deleteByIdForUser(input: ExperimentOwnerInput): Promise<boolean>
}
