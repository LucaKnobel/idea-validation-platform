import type { CreateIdeaBodyDto, IdeaResponseDto, IdeasListResponseDto } from '../../shared/types/idea'

export interface UseIdeasApiComposable {
  listIdeas: (input: {
    page: number
    pageSize: number
    q?: string
  }) => Promise<IdeasListResponseDto>
  createIdea: (input: CreateIdeaBodyDto) => Promise<IdeaResponseDto>
  deleteIdea: (ideaId: string) => Promise<void>
}

/**
 * Encapsulates HTTP calls for idea resources.
 */
export const useIdeasApi = (): UseIdeasApiComposable => {
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

  const createIdea = async (input: CreateIdeaBodyDto): Promise<IdeaResponseDto> => {
    return await $fetch<IdeaResponseDto>('/api/ideas', {
      method: 'POST',
      body: {
        title: input.title,
        description: input.description
      }
    })
  }

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
