import type { CanvasElement } from '@application/models/canvas-element'
import {
  CanvasElementResponseSchema,
  IdeaVersionCanvasResponseSchema,
  type CanvasElementResponseDto,
  type IdeaVersionCanvasResponseDto
} from '@infrastructure/validation/canvas-schemas'

/**
 * Maps one canvas element aggregate to the public API response DTO.
 */
export const toCanvasElementResponseDto = (element: CanvasElement): CanvasElementResponseDto => {
  return CanvasElementResponseSchema.parse({
    id: element.id,
    ideaVersionId: element.ideaVersionId,
    type: element.type,
    content: element.content,
    createdAt: element.createdAt.toISOString(),
    updatedAt: element.updatedAt.toISOString()
  })
}

/**
 * Maps a list of canvas elements to the public collection DTO.
 */
export const toIdeaVersionCanvasResponseDto = (canvasElements: CanvasElement[]): IdeaVersionCanvasResponseDto => {
  return IdeaVersionCanvasResponseSchema.parse({
    elements: canvasElements.map(toCanvasElementResponseDto)
  })
}
