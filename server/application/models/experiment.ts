/**
 * Supported lifecycle states for one experiment.
 */
export const experimentStatuses = [
  'PLANNED',
  'RUNNING',
  'COMPLETED',
  'CANCELLED'
] as const

/**
 * Union type for supported experiment statuses.
 */
export type ExperimentStatus = (typeof experimentStatuses)[number]

/**
 * Represents one persisted experiment in a specific hypothesis.
 */
export type Experiment = {
  id: string
  hypothesisId: string
  title: string
  description: string | null
  templateId: string | null
  status: ExperimentStatus
  createdAt: Date
  updatedAt: Date
}
