import { ExperimentNotFoundError } from '@application/errors/experiment-errors'
import type { ExperimentRepository } from '@application/interfaces/experiment-repository'
import type { Experiment } from '@application/models/experiment'
import type { Logger } from '@interfaces/logger'

export type GetHypothesisExperimentInput = {
  userId: string
  hypothesisId: string
}

/**
 * Builds the use case that loads the experiment singleton for one owned hypothesis.
 */
export const buildGetHypothesisExperiment = (experimentRepository: ExperimentRepository, logger: Logger) => {
  return async (input: GetHypothesisExperimentInput): Promise<Experiment> => {
    const experiment = await experimentRepository.getByHypothesis({
      userId: input.userId,
      hypothesisId: input.hypothesisId
    })

    if (experiment === null) {
      throw new ExperimentNotFoundError()
    }

    logger.debug('Experiment loaded', {
      userId: input.userId,
      hypothesisId: input.hypothesisId,
      experimentId: experiment.id
    })

    return experiment
  }
}
