import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'
import type { ExperimentRepository } from '@application/interfaces/experiment-repository'
import type { Experiment, ExperimentStatus } from '@application/models/experiment'
import type { Logger } from '@interfaces/logger'

export type CreateExperimentInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
  hypothesisId: string
  title: string
  description: string | null
  templateId: string | null
  status: ExperimentStatus
}

/**
 * Builds the use case that creates one experiment in a specific hypothesis.
 */
export const createCreateExperiment = (experimentRepository: ExperimentRepository, logger: Logger) => {
  return async (input: CreateExperimentInput): Promise<Experiment> => {
    const experiment = await experimentRepository.createForHypothesis({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      templateId: input.templateId?.trim() || null,
      status: input.status
    })

    if (experiment === null) {
      throw new HypothesisNotFoundError()
    }

    logger.debug('Experiment created', {
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      experimentId: experiment.id
    })

    return experiment
  }
}
