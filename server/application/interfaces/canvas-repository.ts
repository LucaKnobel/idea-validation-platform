import type { CanvasElement, CanvasElementType } from '@application/models/canvas-element'

/**
 * Persistence contract for reading and replacing the canvas entries of an idea version.
 */
export interface CanvasRepository {
  /**
   * Returns all canvas entries for a version owned by the given user.
   * Returns null when the version does not exist or is not accessible.
   */
  getByIdeaVersionForUser(input: {
    userId: string
    ideaId: string
    ideaVersionId: string
  }): Promise<CanvasElement[] | null>

  /**
   * Replaces the complete canvas snapshot for a version owned by the given user.
   * Returns null when the version does not exist or is not accessible.
   */
  replaceByIdeaVersionForUser(input: {
    userId: string
    ideaId: string
    ideaVersionId: string
    elements: Array<{
      type: CanvasElementType
      content: string
    }>
  }): Promise<CanvasElement[] | null>
}
