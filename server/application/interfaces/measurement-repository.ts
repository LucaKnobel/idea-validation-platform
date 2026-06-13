import type { ExperimentIdOwnerInput, MeasurementIdOwnerInput } from '@application/interfaces/ownership-inputs'
import type { Measurement } from '@application/models/measurement'

export type MeasurementFieldsInput = {
  metricId: string
  value: number
  note: string | null
}

export type MeasurementCreateInput = ExperimentIdOwnerInput & MeasurementFieldsInput

export type MeasurementUpdateInput = MeasurementIdOwnerInput & MeasurementFieldsInput

/**
 * Persistence contract for reading and mutating owned measurements.
 */
export interface MeasurementRepository {
  /**
   * Returns one measurement owned by the given user.
   * Returns null when the measurement does not exist or is not accessible.
   */
  getByIdForUser(input: MeasurementIdOwnerInput): Promise<Measurement | null>

  /**
   * Creates one measurement for an experiment owned by the given user.
   * Returns null when the experiment, metric, or ownership preconditions are not met.
   */
  createForExperiment(input: MeasurementCreateInput): Promise<Measurement | null>

  /**
   * Updates one measurement owned by the given user.
    * Returns null when the measurement or metric preconditions are not met.
   */
  updateByIdForUser(input: MeasurementUpdateInput): Promise<Measurement | null>

  /**
   * Deletes one measurement owned by the given user.
   * Returns true when a row was deleted.
   */
  deleteByIdForUser(input: MeasurementIdOwnerInput): Promise<boolean>
}
