/**
 * Public contract for loading one hypothesis in the idea workspace detail context.
 */
export interface UseHypothesisDetailsComposable {
  hypothesis: Ref<HypothesisResponseDto | null>
  isLoading: Ref<boolean>
  hasError: Ref<boolean>
  loadHypothesis: (input: {
    hypothesisId: string
  }) => Promise<HypothesisResponseDto | null>
  clearHypothesis: () => void
}

/**
 * Handles loading state and error handling for one hypothesis detail resource.
 */
export const useHypothesisDetails = (): UseHypothesisDetailsComposable => {
  const { getHypothesis } = useHypothesesApi()
  const {
    hasError,
    resetRequestError,
    runWithErrorHandling
  } = useRequestErrorState()

  const hypothesis = ref<HypothesisResponseDto | null>(null)
  const isLoading = ref(false)

  const loadHypothesis = async (input: {
    hypothesisId: string
  }): Promise<HypothesisResponseDto | null> => {
    isLoading.value = true

    try {
      return await runWithErrorHandling(async () => {
        const response = await getHypothesis(input)
        hypothesis.value = response
        return response
      }, {
        fallback: null,
        onError: () => {
          hypothesis.value = null
        }
      })
    } finally {
      isLoading.value = false
    }
  }

  const clearHypothesis = (): void => {
    hypothesis.value = null
    resetRequestError()
  }

  return {
    hypothesis,
    isLoading,
    hasError,
    loadHypothesis,
    clearHypothesis
  }
}
