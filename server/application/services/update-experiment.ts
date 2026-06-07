import { ExperimentNotFoundError } from '@application/errors/experiment-errors'
import type { ExperimentRepository } from '@application/interfaces/experiment-repository'
import type { Experiment, ExperimentStatus } from '@application/models/experiment'
import type { Logger } from '@interfaces/logger'

export type UpdateExperimentInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
  hypothesisId: string
  experimentId: string
  title: string
  description: string | null
  status: ExperimentStatus
}

/**
 * Builds the use case that updates one experiment owned by the current user.
 */
export const createUpdateExperiment = (experimentRepository: ExperimentRepository, logger: Logger) => {
  return async (input: UpdateExperimentInput): Promise<Experiment> => {
    const experiment = await experimentRepository.updateByIdForUser({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      experimentId: input.experimentId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status: input.status
    })

    if (experiment === null) {
      throw new ExperimentNotFoundError()
    }

    logger.debug('Experiment updated', {
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: input.hypothesisId,
      experimentId: input.experimentId
    })

    return experiment
  }
}
