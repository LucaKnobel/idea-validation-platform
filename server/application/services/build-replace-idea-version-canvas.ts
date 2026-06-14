import type { CanvasRepository } from '@application/interfaces/canvas-repository'
import type { CanvasElement, CanvasElementType } from '@application/models/canvas-element'
import type { Logger } from '@interfaces/logger'
import { IdeaVersionNotFoundError } from '@application/errors/idea-errors'

export type ReplaceIdeaVersionCanvasInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
  elements: Array<{
    type: CanvasElementType
    content: string
  }>
}

/**
 * Builds the use case that replaces all canvas elements for one owned idea version.
 */
export const buildReplaceIdeaVersionCanvas = (canvasRepository: CanvasRepository, logger: Logger) => {
  return async (input: ReplaceIdeaVersionCanvasInput): Promise<CanvasElement[]> => {
    const canvasElements = await canvasRepository.replaceByIdeaVersion({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      elements: input.elements
    })

    if (canvasElements === null) {
      throw new IdeaVersionNotFoundError()
    }

    logger.debug('Idea version canvas replaced', {
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      items: canvasElements.length
    })

    return canvasElements
  }
}
