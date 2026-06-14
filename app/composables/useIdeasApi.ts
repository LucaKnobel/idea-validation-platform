/**
 * Public contract implemented by useIdeasApi.
 */
export interface UseIdeasApiComposable {
  /**
   * Fetches a paginated list of ideas with optional full-text query.
   */
  listIdeas: (input: {
    page: number
    pageSize: number
    q?: string
  }) => Promise<IdeasListResponseDto>

  /**
   * Creates a new idea and returns the persisted resource.
   */
  createIdea: (input: CreateIdeaBodyDto) => Promise<IdeaResponseDto>

  /**
   * Deletes an existing idea by its identifier.
   */
  deleteIdea: (ideaId: string) => Promise<void>
}

/**
 * Encapsulates HTTP calls for idea resources.
 */
export const useIdeasApi = (): UseIdeasApiComposable => {
  /**
   * Sends a list request to the ideas endpoint.
   */
  const listIdeas = async (input: {
    page: number
    pageSize: number
    q?: string
  }): Promise<IdeasListResponseDto> => {
    return await $fetch<IdeasListResponseDto>('/api/ideas', {
      query: {
        page: input.page,
        pageSize: input.pageSize,
        q: input.q
      }
    })
  }

  /**
   * Sends a create request to the ideas endpoint.
   */
  const createIdea = async (input: CreateIdeaBodyDto): Promise<IdeaResponseDto> => {
    return await $fetch<IdeaResponseDto>('/api/ideas', {
      method: 'POST',
      body: {
        title: input.title,
        description: input.description
      }
    })
  }

  /**
   * Sends a delete request for the given idea id.
   */
  const deleteIdea = async (ideaId: string): Promise<void> => {
    await $fetch(`/api/ideas/${ideaId}`, {
      method: 'DELETE'
    })
  }

  return {
    listIdeas,
    createIdea,
    deleteIdea
  }
}
