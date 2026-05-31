import type { CanvasRepository } from '@application/interfaces/canvas-repository'
import type { CanvasElement, CanvasElementType } from '@application/models/canvas-element'
import type { Logger } from '@interfaces/logger'
import { IdeaVersionNotFoundError } from '@application/errors/idea-errors'

export type UpdateIdeaVersionCanvasInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
  elements: Array<{
    type: CanvasElementType
    content: string
  }>
}

/**
 * Builds the use case that replaces the complete canvas snapshot of a specific idea version.
 */
export const createUpdateIdeaVersionCanvas = (canvasRepository: CanvasRepository, logger: Logger) => {
  return async (input: UpdateIdeaVersionCanvasInput): Promise<CanvasElement[]> => {
    const canvasElements = await canvasRepository.replaceByIdeaVersionForUser({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      elements: input.elements
    })

    if (canvasElements === null) {
      throw new IdeaVersionNotFoundError()
    }

    logger.debug('Idea version canvas updated', {
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      items: canvasElements.length
    })

    return canvasElements
  }
}
