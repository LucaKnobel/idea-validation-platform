import type { CanvasRepository } from '@application/interfaces/canvas-repository'
import type { CanvasElement } from '@application/models/canvas-element'
import type { Logger } from '@interfaces/logger'
import { IdeaVersionNotFoundError } from '@application/errors/idea-errors'

export type GetIdeaVersionCanvasInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
}

/**
 * Builds the use case that loads the canvas entries for a specific idea version.
 */
export const createGetIdeaVersionCanvas = (canvasRepository: CanvasRepository, logger: Logger) => {
  return async (input: GetIdeaVersionCanvasInput): Promise<CanvasElement[]> => {
    const canvasElements = await canvasRepository.getByIdeaVersionForUser({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId
    })

    if (canvasElements === null) {
      throw new IdeaVersionNotFoundError()
    }

    logger.debug('Idea version canvas loaded', {
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      items: canvasElements.length
    })

    return canvasElements
  }
}
