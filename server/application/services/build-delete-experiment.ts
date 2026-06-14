import { ExperimentNotFoundError } from '@application/errors/experiment-errors'
import type { ExperimentRepository } from '@application/interfaces/experiment-repository'
import type { Logger } from '@interfaces/logger'

export type DeleteExperimentInput = {
  userId: string
  hypothesisId: string
}

/**
 * Builds the use case that deletes the experiment singleton for one owned hypothesis.
 */
export const buildDeleteExperiment = (experimentRepository: ExperimentRepository, logger: Logger) => {
  return async (input: DeleteExperimentInput): Promise<void> => {
    const deleted = await experimentRepository.deleteByHypothesis({
      userId: input.userId,
      hypothesisId: input.hypothesisId
    })

    if (!deleted) {
      throw new ExperimentNotFoundError()
    }

    logger.debug('Experiment deleted', {
      userId: input.userId,
      hypothesisId: input.hypothesisId
    })
  }
}
