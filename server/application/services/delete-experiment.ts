import { ExperimentNotFoundError } from '@application/errors/experiment-errors'
import type { ExperimentRepository } from '@application/interfaces/experiment-repository'
import type { Logger } from '@interfaces/logger'

export type DeleteExperimentInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
  hypothesisId: string
  experimentId: string
}

/**
 * Builds the use case that deletes one experiment owned by the current user.
 */
export const createDeleteExperiment = (experimentRepository: ExperimentRepository, logger: Logger) => {
  return async (input: DeleteExperimentInput): Promise<void> => {
    const deleted = await experimentRepository.deleteByIdForUser({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      experimentId: input.experimentId
    })

    if (!deleted) {
      throw new ExperimentNotFoundError()
    }

    logger.debug('Experiment deleted', {
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      experimentId: input.experimentId
    })
  }
}
