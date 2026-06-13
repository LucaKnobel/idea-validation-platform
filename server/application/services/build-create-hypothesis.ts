import type { HypothesisRepository } from '@application/interfaces/hypothesis-repository'
import type {
  Hypothesis,
  HypothesisDimension,
  HypothesisEvidenceType,
  HypothesisPriority
} from '@application/models/hypothesis'
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
  evidenceType: HypothesisEvidenceType
  canvasElementTypes: CanvasElementType[]
}

/**
 * Builds the use case that creates one hypothesis in one owned idea version.
 */
export const buildCreateHypothesis = (hypothesisRepository: HypothesisRepository, logger: Logger) => {
  return async (input: CreateHypothesisInput): Promise<Hypothesis> => {
    const createdHypothesis = await hypothesisRepository.create({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      statement: input.statement,
      dimension: input.dimension,
      priority: input.priority,
      evidenceType: input.evidenceType,
      canvasElementTypes: input.canvasElementTypes
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
