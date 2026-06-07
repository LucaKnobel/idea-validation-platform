import type { Experiment } from '@application/models/experiment'
import {
  ExperimentResponseSchema,
  ExperimentsListResponseSchema,
  type ExperimentResponseDto,
  type ExperimentsListResponseDto
} from '@infrastructure/validation/experiment-schemas'

/**
 * Maps one domain experiment to the public API response DTO.
 */
export const toExperimentResponseDto = (experiment: Experiment): ExperimentResponseDto => {
  return ExperimentResponseSchema.parse({
    id: experiment.id,
    hypothesisId: experiment.hypothesisId,
    title: experiment.title,
    description: experiment.description,
    status: experiment.status,
    createdAt: experiment.createdAt.toISOString(),
    updatedAt: experiment.updatedAt.toISOString()
  })
}

/**
 * Maps a list of domain experiments to the public collection DTO.
 */
export const toExperimentsListResponseDto = (experiments: Experiment[]): ExperimentsListResponseDto => {
  return ExperimentsListResponseSchema.parse({
    items: experiments.map(toExperimentResponseDto)
  })
}
