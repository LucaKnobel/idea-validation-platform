import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'
import type { ExperimentRepository } from '@application/interfaces/experiment-repository'
import type { Experiment } from '@application/models/experiment'
import type { Logger } from '@interfaces/logger'

export type GetHypothesisExperimentsInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
  hypothesisId: string
}

/**
 * Builds the use case that lists all experiments for one specific hypothesis.
 */
export const createGetHypothesisExperiments = (experimentRepository: ExperimentRepository, logger: Logger) => {
  return async (input: GetHypothesisExperimentsInput): Promise<Experiment[]> => {
    const experiments = await experimentRepository.listByHypothesisForUser({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId
    })

    if (experiments === null) {
      throw new HypothesisNotFoundError()
    }

    logger.debug('Experiments listed', {
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      items: experiments.length
    })

    return experiments
  }
}
