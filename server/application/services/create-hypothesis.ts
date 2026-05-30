import type { HypothesisRepository } from '@application/interfaces/hypothesis-repository'
import type { Hypothesis, HypothesisDimension, HypothesisPriority } from '@application/models/hypothesis'
import { uniqueCanvasSectionTypes } from '@application/models/hypothesis-canvas-section'
import type { CanvasElementType } from '@application/models/canvas-element'
import type { Logger } from '@interfaces/logger'
import { IdeaVersionNotFoundError } from '@application/errors/idea-errors'

export type CreateHypothesisInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
  statement: string
  dimension: HypothesisDimension
  priority: HypothesisPriority
  canvasSectionTypes: CanvasElementType[]
}

/**
 * Builds the use case that creates one hypothesis in a specific idea version.
 */
export const createCreateHypothesis = (hypothesisRepository: HypothesisRepository, logger: Logger) => {
  return async (input: CreateHypothesisInput): Promise<Hypothesis> => {
    const createdHypothesis = await hypothesisRepository.createForIdeaVersion({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      statement: input.statement.trim(),
      dimension: input.dimension,
      priority: input.priority,
      canvasSectionTypes: uniqueCanvasSectionTypes(input.canvasSectionTypes)
    })

    if (createdHypothesis === null) {
      throw new IdeaVersionNotFoundError()
    }

    logger.debug('Hypothesis created', {
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      hypothesisId: createdHypothesis.id
    })

    return createdHypothesis
  }
}
