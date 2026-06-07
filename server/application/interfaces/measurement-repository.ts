import type { ExperimentOwnerInput, MeasurementOwnerInput } from '@application/interfaces/ownership-inputs'
import type { Measurement } from '@application/models/measurement'

export type MeasurementFieldsInput = {
  metricId: string
  value: number
  note: string | null
}

export type MeasurementWriteInput = ExperimentOwnerInput & MeasurementFieldsInput

export type MeasurementMutationInput = MeasurementOwnerInput & MeasurementFieldsInput

export type MeasurementMutationResult = {
  kind: 'success'
  measurement: Measurement
} | {
  kind: 'notFound'
} | {
  kind: 'conflict'
}

/**
 * Persistence contract for reading and mutating measurements in one owned experiment.
 */
export interface MeasurementRepository {
  /**
   * Returns all measurements for an experiment owned by the given user.
   * Returns null when the experiment does not exist or is not accessible.
   */
  listByExperimentForUser(input: ExperimentOwnerInput): Promise<Measurement[] | null>

  /**
   * Creates one measurement in an experiment owned by the given user.
    * Returns operation result including conflict state for unique-constraint collisions.
   */
  createForExperiment(input: MeasurementWriteInput): Promise<MeasurementMutationResult>

  /**
   * Updates one measurement owned by the given user.
    * Returns operation result including conflict state for unique-constraint collisions.
   */
  updateByIdForUser(input: MeasurementMutationInput): Promise<MeasurementMutationResult>

  /**
   * Deletes one measurement owned by the given user.
   * Returns true when a row was deleted.
   */
  deleteByIdForUser(input: MeasurementOwnerInput): Promise<boolean>
}
