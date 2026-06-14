/**
 * Public contract for loading and exposing the hypothesis experiment.
 */
export interface LoadHypothesisExperimentsInput {
  hypothesisId: string
}

export interface UpsertHypothesisExperimentInput {
  hypothesisId: string
  body: UpsertExperimentBodyDto
}

export interface DeleteHypothesisExperimentInput {
  hypothesisId: string
}

export interface UseHypothesisExperimentsComposable {
  experiment: Ref<ExperimentResponseDto | null>
  isLoading: Ref<boolean>
  isCreating: Ref<boolean>
  isDeletingId: Ref<string | null>
  hasError: Ref<boolean>
  loadExperiments: (input: LoadHypothesisExperimentsInput) => Promise<void>
  upsertExperiment: (input: UpsertHypothesisExperimentInput) => Promise<ExperimentResponseDto | null>
  deleteExperiment: (input: DeleteHypothesisExperimentInput) => Promise<boolean>
  clearExperiments: () => void
}

/**
 * Handles the singleton experiment state for one hypothesis.
 */
export const useHypothesisExperiments = (): UseHypothesisExperimentsComposable => {
  const {
    getExperiment,
    upsertExperiment: upsertExperimentRequest,
    deleteExperiment: deleteExperimentRequest
  } = useExperimentsApi()
  const {
    hasError,
    runWithErrorHandling
  } = useRequestErrorState()

  const experiment = ref<ExperimentResponseDto | null>(null)
  const isLoading = ref(false)
  const isCreating = ref(false)
  const isDeletingId = ref<string | null>(null)

  const loadExperiments = async (input: LoadHypothesisExperimentsInput): Promise<void> => {
    isLoading.value = true

    try {
      await runWithErrorHandling(async () => {
        try {
          experiment.value = await getExperiment(input)
        } catch (error: unknown) {
          if (extractStatusCode(error) === 404) {
            experiment.value = null
          } else {
            throw error
          }
        }
      }, {
        fallback: undefined,
        onError: () => {
          experiment.value = null
        }
      })
    } finally {
      isLoading.value = false
    }
  }

  const upsertExperiment = async (input: UpsertHypothesisExperimentInput): Promise<ExperimentResponseDto | null> => {
    isCreating.value = true

    try {
      return await runWithErrorHandling(async () => {
        const updatedExperiment = await upsertExperimentRequest(input)
        experiment.value = updatedExperiment
        return updatedExperiment
      }, {
        fallback: null
      })
    } finally {
      isCreating.value = false
    }
  }

  const deleteExperiment = async (input: DeleteHypothesisExperimentInput): Promise<boolean> => {
    isDeletingId.value = experiment.value?.id || null

    try {
      return await runWithErrorHandling(async () => {
        await deleteExperimentRequest(input)
        experiment.value = null
        return true
      }, {
        fallback: false
      })
    } finally {
      isDeletingId.value = null
    }
  }

  const clearExperiments = (): void => {
    experiment.value = null
  }

  return {
    experiment,
    isLoading,
    isCreating,
    isDeletingId,
    hasError,
    loadExperiments,
    upsertExperiment,
    deleteExperiment,
    clearExperiments
  }
}
