/**
 * Public contract for loading and mutating the hypothesis metric.
 */
export interface UseHypothesisMetricsComposable {
  metric: Ref<MetricResponseDto | null>
  isLoading: Ref<boolean>
  isCreating: Ref<boolean>
  isDeletingId: Ref<string | null>
  hasError: Ref<boolean>
  loadMetrics: (input: {
    hypothesisId: string
  }) => Promise<void>
  upsertMetric: (input: {
    hypothesisId: string
    body: UpsertMetricBodyDto
  }) => Promise<MetricResponseDto | null>
  deleteMetric: (input: {
    hypothesisId: string
  }) => Promise<boolean>
}

/**
 * Handles the singleton metric state and CRUD orchestration for one hypothesis.
 */
export const useHypothesisMetrics = (): UseHypothesisMetricsComposable => {
  const {
    getMetric,
    upsertMetric: upsertMetricRequest,
    deleteMetric: deleteMetricRequest
  } = useMetricsApi()
  const {
    hasError,
    runWithErrorHandling
  } = useRequestErrorState()

  const metric = ref<MetricResponseDto | null>(null)
  const isLoading = ref(false)
  const isCreating = ref(false)
  const isDeletingId = ref<string | null>(null)

  const loadMetrics = async (input: {
    hypothesisId: string
  }): Promise<void> => {
    isLoading.value = true

    try {
      await runWithErrorHandling(async () => {
        let nextMetric: MetricResponseDto | null = null

        try {
          nextMetric = await getMetric(input)
        } catch (error: unknown) {
          if (extractStatusCode(error) === 404) {
            nextMetric = null
          } else {
            throw error
          }
        }

        metric.value = nextMetric
      }, {
        fallback: undefined,
        onError: () => {
          metric.value = null
        }
      })
    } finally {
      isLoading.value = false
    }
  }

  const upsertMetric = async (input: {
    hypothesisId: string
    body: UpsertMetricBodyDto
  }): Promise<MetricResponseDto | null> => {
    isCreating.value = true

    try {
      return await runWithErrorHandling(async () => {
        const updatedMetric = await upsertMetricRequest(input)
        metric.value = updatedMetric
        return updatedMetric
      }, {
        fallback: null
      })
    } finally {
      isCreating.value = false
    }
  }

  const deleteMetric = async (input: {
    hypothesisId: string
  }): Promise<boolean> => {
    isDeletingId.value = metric.value?.id || null

    try {
      return await runWithErrorHandling(async () => {
        await deleteMetricRequest(input)
        metric.value = null
        return true
      }, {
        fallback: false
      })
    } finally {
      isDeletingId.value = null
    }
  }

  return {
    metric,
    isLoading,
    isCreating,
    isDeletingId,
    hasError,
    loadMetrics,
    upsertMetric,
    deleteMetric
  }
}
