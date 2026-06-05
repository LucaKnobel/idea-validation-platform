import type { CanvasElement, CanvasElementType } from '@application/models/canvas-element'
import type { IdeaVersionOwnerInput } from '@application/interfaces/ownership-inputs'

export type CanvasElementWriteInput = {
  type: CanvasElementType
  content: string
}

export type CanvasReplaceInput = IdeaVersionOwnerInput & {
  elements: CanvasElementWriteInput[]
}

/**
 * Persistence contract for reading and replacing the canvas entries of an idea version.
 */
export interface CanvasRepository {
  /**
   * Returns all canvas entries for a version owned by the given user.
   * Returns null when the version does not exist or is not accessible.
   */
  getByIdeaVersionForUser(input: IdeaVersionOwnerInput): Promise<CanvasElement[] | null>

  /**
   * Replaces the complete canvas snapshot for a version owned by the given user.
   * Returns null when the version does not exist or is not accessible.
   */
  replaceByIdeaVersionForUser(input: CanvasReplaceInput): Promise<CanvasElement[] | null>
}
