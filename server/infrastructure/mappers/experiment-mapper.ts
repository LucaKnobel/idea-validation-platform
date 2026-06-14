import type { Experiment } from '@application/models/experiment'
import {
  ExperimentResponseSchema,
  type ExperimentResponseDto
} from '@infrastructure/validation/experiment-schemas'

/**
 * Maps one domain experiment to the public API response DTO.
 */
export const toExperimentResponseDto = (experiment: Experiment): ExperimentResponseDto => {
  return ExperimentResponseSchema.parse({
    id: experiment.id,
    title: experiment.title,
    description: experiment.description,
    status: experiment.status,
    createdAt: experiment.createdAt.toISOString(),
    updatedAt: experiment.updatedAt.toISOString()
  })
}
