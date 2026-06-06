import type { CreateMetricBodyDto, MetricResponseDto, UpdateMetricBodyDto } from '#shared/types/metric'

/**
 * Public contract for loading and mutating hypothesis metrics.
 */
export interface UseHypothesisMetricsComposable {
  metrics: Ref<MetricResponseDto[]>
  isLoading: Ref<boolean>
  isCreating: Ref<boolean>
  isDeletingId: Ref<string | null>
  isUpdatingId: Ref<string | null>
  hasError: Ref<boolean>
  loadMetrics: (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
  }) => Promise<void>
  createMetric: (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
    body: CreateMetricBodyDto
  }) => Promise<MetricResponseDto | null>
  updateMetric: (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
    metricId: string
    body: UpdateMetricBodyDto
  }) => Promise<MetricResponseDto | null>
  deleteMetric: (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
    metricId: string
  }) => Promise<boolean>
}

/**
 * Handles metrics list state and CRUD orchestration for one hypothesis.
 */
export const useHypothesisMetrics = (): UseHypothesisMetricsComposable => {
  const {
    listMetrics,
    createMetric: createMetricRequest,
    updateMetric: updateMetricRequest,
    deleteMetric: deleteMetricRequest
  } = useMetricsApi()
  const {
    hasError,
    runWithErrorHandling
  } = useRequestErrorState()

  const metrics = ref<MetricResponseDto[]>([])
  const isLoading = ref(false)
  const isCreating = ref(false)
  const isUpdatingId = ref<string | null>(null)
  const isDeletingId = ref<string | null>(null)

  const sortByNewest = (items: MetricResponseDto[]): MetricResponseDto[] => {
    return [...items].sort((left, right) => {
      return Date.parse(right.createdAt) - Date.parse(left.createdAt)
    })
  }

  const loadMetrics = async (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
  }): Promise<void> => {
    isLoading.value = true

    try {
      await runWithErrorHandling(async () => {
        const response = await listMetrics(input)
        metrics.value = sortByNewest(response.items)
      }, {
        fallback: undefined,
        onError: () => {
          metrics.value = []
        }
      })
    } finally {
      isLoading.value = false
    }
  }

  const createMetric = async (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
    body: CreateMetricBodyDto
  }): Promise<MetricResponseDto | null> => {
    isCreating.value = true

    try {
      return await runWithErrorHandling(async () => {
        const createdMetric = await createMetricRequest(input)
        metrics.value = sortByNewest([createdMetric, ...metrics.value])
        return createdMetric
      }, {
        fallback: null
      })
    } finally {
      isCreating.value = false
    }
  }

  const updateMetric = async (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
    metricId: string
    body: UpdateMetricBodyDto
  }): Promise<MetricResponseDto | null> => {
    isUpdatingId.value = input.metricId

    try {
      return await runWithErrorHandling(async () => {
        const updatedMetric = await updateMetricRequest(input)
        metrics.value = sortByNewest(metrics.value.map((metric) => {
          return metric.id === updatedMetric.id ? updatedMetric : metric
        }))
        return updatedMetric
      }, {
        fallback: null
      })
    } finally {
      isUpdatingId.value = null
    }
  }

  const deleteMetric = async (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
    metricId: string
  }): Promise<boolean> => {
    isDeletingId.value = input.metricId

    try {
      return await runWithErrorHandling(async () => {
        await deleteMetricRequest(input)
        metrics.value = metrics.value.filter(metric => metric.id !== input.metricId)
        return true
      }, {
        fallback: false
      })
    } finally {
      isDeletingId.value = null
    }
  }

  return {
    metrics,
    isLoading,
    isCreating,
    isDeletingId,
    isUpdatingId,
    hasError,
    loadMetrics,
    createMetric,
    updateMetric,
    deleteMetric
  }
}
