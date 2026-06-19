/**
 * Public contract implemented by useIdeaVersionValidationApi.
 */
export interface UseIdeaVersionValidationApiComposable {
  getValidationSummary: (input: {
    ideaId: string
    versionId: string
  }) => Promise<IdeaVersionValidationOverviewResponseDto>
}

/**
 * Encapsulates HTTP calls for idea version validation summary resources.
 */
export const useIdeaVersionValidationApi = (): UseIdeaVersionValidationApiComposable => {
  const getValidationSummary = async (input: {
    ideaId: string
    versionId: string
  }): Promise<IdeaVersionValidationOverviewResponseDto> => {
    return $fetch<IdeaVersionValidationOverviewResponseDto>(`/api/ideas/${input.ideaId}/versions/${input.versionId}/validation`)
  }

  return {
    getValidationSummary
  }
}
