type UpdateIdeaVersionInputDto = {
  ideaId: string
  versionId: string
} & UpdateIdeaVersionBodyDto

/**
 * Public contract implemented by useIdeaVersionsApi.
 */
export interface UseIdeaVersionsApiComposable {
  listIdeaVersions: (input: { ideaId: string }) => Promise<IdeaVersionsListResponseDto>
  createIdeaVersion: (input: {
    ideaId: string
    baseVersionId: string
    type: CreateIdeaVersionBodyDto['type']
  }) => Promise<IdeaVersionMetadataDto>
  updateIdeaVersion: (input: UpdateIdeaVersionInputDto) => Promise<IdeaVersionMetadataDto>
}

/**
 * Encapsulates HTTP calls for idea version history resources.
 */
export const useIdeaVersionsApi = (): UseIdeaVersionsApiComposable => {
  const listIdeaVersions = async (input: { ideaId: string }): Promise<IdeaVersionsListResponseDto> => {
    return await $fetch<IdeaVersionsListResponseDto>(`/api/ideas/${input.ideaId}/versions`, {
      headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined
    })
  }

  const createIdeaVersion = async (input: {
    ideaId: string
    baseVersionId: string
    type: CreateIdeaVersionBodyDto['type']
  }): Promise<IdeaVersionMetadataDto> => {
    return await $fetch<IdeaVersionMetadataDto>(`/api/ideas/${input.ideaId}/versions`, {
      method: 'POST',
      headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
      body: {
        baseVersionId: input.baseVersionId,
        type: input.type
      }
    })
  }

  const updateIdeaVersion = async (input: UpdateIdeaVersionInputDto): Promise<IdeaVersionMetadataDto> => {
    return await $fetch<IdeaVersionMetadataDto>(`/api/ideas/${input.ideaId}/versions/${input.versionId}`, {
      method: 'PUT',
      headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
      body: {
        title: input.title,
        description: input.description
      }
    })
  }

  return {
    listIdeaVersions,
    createIdeaVersion,
    updateIdeaVersion
  }
}
