/**
 * Public contract for loading and exposing hypothesis experiments.
 */
export interface UseHypothesisExperimentsComposable {
  experiments: Ref<ExperimentResponseDto[]>
  isLoading: Ref<boolean>
  hasError: Ref<boolean>
  loadExperiments: (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
  }) => Promise<void>
  clearExperiments: () => void
}

/**
 * Handles experiment list state for one hypothesis.
 */
export const useHypothesisExperiments = (): UseHypothesisExperimentsComposable => {
  const { listExperiments } = useExperimentsApi()
  const {
    hasError,
    runWithErrorHandling
  } = useRequestErrorState()

  const experiments = ref<ExperimentResponseDto[]>([])
  const isLoading = ref(false)

  const sortByNewest = (items: ExperimentResponseDto[]): ExperimentResponseDto[] => {
    return [...items].sort((left, right) => {
      return Date.parse(right.createdAt) - Date.parse(left.createdAt)
    })
  }

  const loadExperiments = async (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
  }): Promise<void> => {
    isLoading.value = true

    try {
      await runWithErrorHandling(async () => {
        const response = await listExperiments(input)
        experiments.value = sortByNewest(response.items)
      }, {
        fallback: undefined,
        onError: () => {
          experiments.value = []
        }
      })
    } finally {
      isLoading.value = false
    }
  }

  const clearExperiments = (): void => {
    experiments.value = []
  }

  return {
    experiments,
    isLoading,
    hasError,
    loadExperiments,
    clearExperiments
  }
}
