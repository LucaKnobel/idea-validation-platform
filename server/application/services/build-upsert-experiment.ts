import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'
import type { ExperimentRepository } from '@application/interfaces/experiment-repository'
import type { Experiment, ExperimentStatus } from '@application/models/experiment'
import type { Logger } from '@interfaces/logger'

export type UpsertExperimentInput = {
  userId: string
  hypothesisId: string
  title: string
  description: string | null
  status: ExperimentStatus
}

/**
 * Builds the use case that creates or updates the experiment singleton of one owned hypothesis.
 */
export const buildUpsertExperiment = (experimentRepository: ExperimentRepository, logger: Logger) => {
  return async (input: UpsertExperimentInput): Promise<Experiment> => {
    const experiment = await experimentRepository.upsertByHypothesis({
      userId: input.userId,
      hypothesisId: input.hypothesisId,
      title: input.title,
      description: input.description,
      status: input.status
    })

    if (experiment === null) {
      throw new HypothesisNotFoundError()
    }

    logger.debug('Experiment upserted', {
      userId: input.userId,
      hypothesisId: input.hypothesisId,
      experimentId: experiment.id
    })

    return experiment
  }
}
