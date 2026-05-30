import type { IdeaVersionCanvasResponseDto, ReplaceIdeaVersionCanvasBodyDto } from '../../shared/types/canvas'

/**
 * Public contract implemented by useCanvasApi.
 *
 * Both methods throw on HTTP/network failures so callers can map errors consistently.
 */
export interface UseCanvasApiComposable {
  /**
   * Fetches all canvas entries for one idea version.
   */
  getCanvas: (input: {
    ideaId: string
    versionId: string
  }) => Promise<IdeaVersionCanvasResponseDto>

  /**
   * Replaces the complete canvas snapshot for one idea version.
   */
  replaceCanvas: (input: {
    ideaId: string
    versionId: string
    elements: ReplaceIdeaVersionCanvasBodyDto['elements']
  }) => Promise<IdeaVersionCanvasResponseDto>
}

/**
 * Encapsulates HTTP calls for idea version canvas resources.
 */
export const useCanvasApi = (): UseCanvasApiComposable => {
  /**
   * Sends a read request to the idea version canvas endpoint.
   */
  const getCanvas = async (input: {
    ideaId: string
    versionId: string
  }): Promise<IdeaVersionCanvasResponseDto> => {
    return $fetch<IdeaVersionCanvasResponseDto>(`/api/ideas/${input.ideaId}/versions/${input.versionId}/canvas`)
  }

  /**
   * Sends a replace request for the complete canvas snapshot.
   */
  const replaceCanvas = async (input: {
    ideaId: string
    versionId: string
    elements: ReplaceIdeaVersionCanvasBodyDto['elements']
  }): Promise<IdeaVersionCanvasResponseDto> => {
    return $fetch<IdeaVersionCanvasResponseDto>(`/api/ideas/${input.ideaId}/versions/${input.versionId}/canvas`, {
      method: 'PUT',
      body: {
        elements: input.elements
      }
    })
  }

  return {
    getCanvas,
    replaceCanvas
  }
}
