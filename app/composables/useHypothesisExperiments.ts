/**
 * Public contract for loading and exposing hypothesis experiments.
 */
export interface LoadHypothesisExperimentsInput {
  ideaId: string
  versionId: string
  hypothesisId: string
}

export interface CreateHypothesisExperimentInput {
  ideaId: string
  versionId: string
  hypothesisId: string
  body: CreateExperimentBodyDto
}

export interface UpdateHypothesisExperimentInput {
  ideaId: string
  versionId: string
  hypothesisId: string
  experimentId: string
  body: UpdateExperimentBodyDto
}

export interface DeleteHypothesisExperimentInput {
  ideaId: string
  versionId: string
  hypothesisId: string
  experimentId: string
}

export interface UseHypothesisExperimentsComposable {
  experiments: Ref<ExperimentResponseDto[]>
  isLoading: Ref<boolean>
  isCreating: Ref<boolean>
  isDeletingId: Ref<string | null>
  isUpdatingId: Ref<string | null>
  hasError: Ref<boolean>
  loadExperiments: (input: LoadHypothesisExperimentsInput) => Promise<void>
  createExperiment: (input: CreateHypothesisExperimentInput) => Promise<ExperimentResponseDto | null>
  updateExperiment: (input: UpdateHypothesisExperimentInput) => Promise<ExperimentResponseDto | null>
  deleteExperiment: (input: DeleteHypothesisExperimentInput) => Promise<boolean>
  clearExperiments: () => void
}

/**
 * Handles experiment list state for one hypothesis.
 */
export const useHypothesisExperiments = (): UseHypothesisExperimentsComposable => {
  const {
    listExperiments,
    createExperiment: createExperimentRequest,
    updateExperiment: updateExperimentRequest,
    deleteExperiment: deleteExperimentRequest
  } = useExperimentsApi()
  const {
    hasError,
    runWithErrorHandling
  } = useRequestErrorState()

  const experiments = ref<ExperimentResponseDto[]>([])
  const isLoading = ref(false)
  const isCreating = ref(false)
  const isUpdatingId = ref<string | null>(null)
  const isDeletingId = ref<string | null>(null)

  const sortByNewest = (items: ExperimentResponseDto[]): ExperimentResponseDto[] => {
    return [...items].sort((left, right) => {
      return Date.parse(right.createdAt) - Date.parse(left.createdAt)
    })
  }

  const loadExperiments = async (input: LoadHypothesisExperimentsInput): Promise<void> => {
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

  const createExperiment = async (input: CreateHypothesisExperimentInput): Promise<ExperimentResponseDto | null> => {
    isCreating.value = true

    try {
      return await runWithErrorHandling(async () => {
        const createdExperiment = await createExperimentRequest(input)
        experiments.value = sortByNewest([createdExperiment, ...experiments.value])
        return createdExperiment
      }, {
        fallback: null
      })
    } finally {
      isCreating.value = false
    }
  }

  const updateExperiment = async (input: UpdateHypothesisExperimentInput): Promise<ExperimentResponseDto | null> => {
    isUpdatingId.value = input.experimentId

    try {
      return await runWithErrorHandling(async () => {
        const updatedExperiment = await updateExperimentRequest(input)
        experiments.value = sortByNewest(experiments.value.map((experiment) => {
          return experiment.id === updatedExperiment.id ? updatedExperiment : experiment
        }))
        return updatedExperiment
      }, {
        fallback: null
      })
    } finally {
      isUpdatingId.value = null
    }
  }

  const deleteExperiment = async (input: DeleteHypothesisExperimentInput): Promise<boolean> => {
    isDeletingId.value = input.experimentId

    try {
      return await runWithErrorHandling(async () => {
        await deleteExperimentRequest(input)
        experiments.value = experiments.value.filter(experiment => experiment.id !== input.experimentId)
        return true
      }, {
        fallback: false
      })
    } finally {
      isDeletingId.value = null
    }
  }

  const clearExperiments = (): void => {
    experiments.value = []
  }

  return {
    experiments,
    isLoading,
    isCreating,
    isDeletingId,
    isUpdatingId,
    hasError,
    loadExperiments,
    createExperiment,
    updateExperiment,
    deleteExperiment,
    clearExperiments
  }
}
