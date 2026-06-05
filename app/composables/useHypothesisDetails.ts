/**
 * Public contract for loading one hypothesis in the idea workspace detail context.
 */
export interface UseHypothesisDetailsComposable {
  hypothesis: Ref<HypothesisResponseDto | null>
  isLoading: Ref<boolean>
  hasError: Ref<boolean>
  loadHypothesis: (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
  }) => Promise<HypothesisResponseDto | null>
  clearHypothesis: () => void
}

/**
 * Handles loading state and error handling for one hypothesis detail resource.
 */
export const useHypothesisDetails = (): UseHypothesisDetailsComposable => {
  const { getHypothesis } = useHypothesesApi()
  const { handleRateLimitError } = useErrorHandler()

  const hypothesis = ref<HypothesisResponseDto | null>(null)
  const isLoading = ref(false)
  const hasError = ref(false)

  const loadHypothesis = async (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
  }): Promise<HypothesisResponseDto | null> => {
    isLoading.value = true
    hasError.value = false

    try {
      const response = await getHypothesis(input)
      hypothesis.value = response
      return response
    } catch (error: unknown) {
      if (handleRateLimitError(error)) {
        return null
      }

      hasError.value = true
      hypothesis.value = null
      return null
    } finally {
      isLoading.value = false
    }
  }

  const clearHypothesis = (): void => {
    hypothesis.value = null
    hasError.value = false
  }

  return {
    hypothesis,
    isLoading,
    hasError,
    loadHypothesis,
    clearHypothesis
  }
}
