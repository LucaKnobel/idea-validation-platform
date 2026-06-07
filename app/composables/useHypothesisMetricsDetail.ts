import type { MetricFormState } from '~/components/idea-workspace/MetricFormModal.vue'

/**
 * Route-level dependencies required by the hypothesis metrics detail flow.
 */
export interface UseHypothesisMetricsDetailInput {
  ideaId: Ref<string>
  versionId: Ref<string>
  hypothesisId: Ref<string>
  hasValidRouteParams: ComputedRef<boolean>
}

/**
 * Public API for metrics section state and modal workflows on hypothesis detail pages.
 */
export interface UseHypothesisMetricsDetailComposable {
  metrics: Ref<MetricResponseDto[]>
  isMetricsLoading: Ref<boolean>
  isMetricDeletingId: Ref<string | null>
  hasMetricsError: Ref<boolean>
  isMetricModalOpen: Ref<boolean>
  isMetricDeleteModalOpen: Ref<boolean>
  metricDeleteCandidate: Ref<MetricResponseDto | null>
  metricFormState: MetricFormState
  metricFormTitle: ComputedRef<string>
  metricSubmitLabel: ComputedRef<string>
  metricOperatorOptions: ComputedRef<Array<{ label: string, value: CreateMetricBodyDto['threshold']['operator'] }>>
  isAnyMetricActionLoading: ComputedRef<boolean>
  isMetricDeleteSubmitting: Ref<boolean>
  loadMetricsForRoute: () => Promise<void>
  clearMetrics: () => void
  openCreateMetricModal: () => void
  openEditMetricModal: (metric: MetricResponseDto) => void
  openMetricDeleteModal: (metric: MetricResponseDto) => void
  formatMetricThreshold: (metric: MetricResponseDto) => string
  submitMetricForm: (state: MetricFormState) => Promise<void>
  confirmDeleteMetric: () => Promise<void>
}

/**
 * Encapsulates metrics data loading, modal state, and CRUD submit handlers for one hypothesis detail page.
 */
export const useHypothesisMetricsDetail = (
  input: UseHypothesisMetricsDetailInput
): UseHypothesisMetricsDetailComposable => {
  const { t } = useI18n()
  const { handleRateLimitError } = useErrorHandler()
  const { showSuccess, showError } = useToastNotification()
  const {
    metrics,
    isLoading: isMetricsLoading,
    isCreating: isMetricCreating,
    isDeletingId: isMetricDeletingId,
    isUpdatingId: metricUpdatingId,
    hasError: hasMetricsError,
    loadMetrics,
    createMetric,
    updateMetric,
    deleteMetric
  } = useHypothesisMetrics()
  const {
    isSubmitting: isMetricFormSubmitting,
    runWithSubmitGuard: runMetricFormAction
  } = useAsyncSubmitGuard()
  const {
    isSubmitting: isMetricDeleteSubmitting,
    runWithSubmitGuard: runMetricDeleteAction
  } = useAsyncSubmitGuard()

  const isMetricModalOpen = ref(false)
  const metricFormMode = ref<'create' | 'update'>('create')
  const activeMetricId = ref<string | null>(null)
  const metricDeleteCandidate = ref<MetricResponseDto | null>(null)
  const isMetricDeleteModalOpen = ref(false)

  const metricFormState = reactive<MetricFormState>({
    name: '',
    description: '',
    unit: '',
    threshold: {
      operator: 'GTE',
      referenceValue: 0
    }
  })

  const metricFormTitle = computed(() => {
    return metricFormMode.value === 'create'
      ? t('ideaWorkspace.hypotheses.detail.metrics.modal.createTitle')
      : t('ideaWorkspace.hypotheses.detail.metrics.modal.editTitle')
  })

  const metricSubmitLabel = computed(() => {
    return metricFormMode.value === 'create'
      ? t('ideaWorkspace.hypotheses.detail.metrics.actions.create')
      : t('ideaWorkspace.hypotheses.detail.metrics.actions.update')
  })

  const metricOperatorOptions = computed(() => {
    return [
      { label: t('ideaWorkspace.hypotheses.detail.metrics.operators.GTE'), value: 'GTE' },
      { label: t('ideaWorkspace.hypotheses.detail.metrics.operators.GT'), value: 'GT' },
      { label: t('ideaWorkspace.hypotheses.detail.metrics.operators.LTE'), value: 'LTE' },
      { label: t('ideaWorkspace.hypotheses.detail.metrics.operators.LT'), value: 'LT' },
      { label: t('ideaWorkspace.hypotheses.detail.metrics.operators.EQ'), value: 'EQ' }
    ] satisfies Array<{ label: string, value: CreateMetricBodyDto['threshold']['operator'] }>
  })

  const isAnyMetricActionLoading = computed(() => {
    return isMetricCreating.value || metricUpdatingId.value !== null || isMetricFormSubmitting.value
  })

  /**
   * Resets the editable metric form to defaults used by create mode.
   */
  const resetMetricForm = (): void => {
    metricFormState.name = ''
    metricFormState.description = ''
    metricFormState.unit = ''
    metricFormState.threshold = {
      operator: 'GTE',
      referenceValue: 0
    }
  }

  /**
   * Clears local list state when route params are invalid or navigation leaves the context.
   */
  const clearMetrics = (): void => {
    metrics.value = []
  }

  /**
   * Loads metrics for the currently active idea/version/hypothesis route.
   */
  const loadMetricsForRoute = async (): Promise<void> => {
    if (!input.hasValidRouteParams.value) {
      return
    }

    await loadMetrics({
      ideaId: input.ideaId.value,
      versionId: input.versionId.value,
      hypothesisId: input.hypothesisId.value
    })
  }

  /**
   * Opens create mode with a clean metric form.
   */
  const openCreateMetricModal = (): void => {
    metricFormMode.value = 'create'
    activeMetricId.value = null
    resetMetricForm()
    isMetricModalOpen.value = true
  }

  /**
   * Opens update mode and pre-fills the metric form from the selected metric.
   */
  const openEditMetricModal = (metric: MetricResponseDto): void => {
    metricFormMode.value = 'update'
    activeMetricId.value = metric.id
    metricFormState.name = metric.name
    metricFormState.description = metric.description || ''
    metricFormState.unit = metric.unit || ''
    metricFormState.threshold = {
      operator: metric.threshold?.operator || 'GTE',
      referenceValue: metric.threshold?.referenceValue || 0
    }
    isMetricModalOpen.value = true
  }

  /**
   * Opens delete confirmation for the selected metric.
   */
  const openMetricDeleteModal = (metric: MetricResponseDto): void => {
    metricDeleteCandidate.value = metric
    isMetricDeleteModalOpen.value = true
  }

  /**
   * Formats threshold details into a compact, human-readable expression (e.g. ">= 70 %").
   */
  const formatMetricThreshold = (metric: MetricResponseDto): string => {
    if (!metric.threshold) {
      return '-'
    }

    const unitSuffix = metric.unit ? ` ${metric.unit}` : ''
    const operatorLabel = t(`ideaWorkspace.hypotheses.detail.metrics.operators.${metric.threshold.operator}`)
    return `${operatorLabel} ${metric.threshold.referenceValue}${unitSuffix}`
  }

  /**
   * Normalizes form values to the API payload shape (nullable strings for optional fields).
   */
  const normalizeMetricBody = (state: MetricFormState): CreateMetricBodyDto => {
    return {
      name: state.name,
      description: state.description.trim().length > 0 ? state.description.trim() : null,
      unit: state.unit.trim().length > 0 ? state.unit.trim() : null,
      threshold: {
        operator: state.threshold.operator,
        referenceValue: state.threshold.referenceValue
      }
    }
  }

  /**
   * Executes create/update save flow for the metric form, including user feedback and modal transitions.
   */
  const submitMetricForm = async (state: MetricFormState): Promise<void> => {
    if (!input.hasValidRouteParams.value) {
      return
    }

    const body = normalizeMetricBody(state)

    try {
      await runMetricFormAction(async () => {
        if (metricFormMode.value === 'create') {
          const created = await createMetric({
            ideaId: input.ideaId.value,
            versionId: input.versionId.value,
            hypothesisId: input.hypothesisId.value,
            body
          })

          if (created === null) {
            showError('ideaWorkspace.hypotheses.detail.metrics.error.create.title', 'ideaWorkspace.hypotheses.detail.metrics.error.create.message')
            return false
          }

          showSuccess('ideaWorkspace.hypotheses.detail.metrics.success.create.title', 'ideaWorkspace.hypotheses.detail.metrics.success.create.message')
          isMetricModalOpen.value = false
          return true
        }

        if (activeMetricId.value === null) {
          return false
        }

        const updated = await updateMetric({
          ideaId: input.ideaId.value,
          versionId: input.versionId.value,
          hypothesisId: input.hypothesisId.value,
          metricId: activeMetricId.value,
          body
        })

        if (updated === null) {
          showError('ideaWorkspace.hypotheses.detail.metrics.error.update.title', 'ideaWorkspace.hypotheses.detail.metrics.error.update.message')
          return false
        }

        showSuccess('ideaWorkspace.hypotheses.detail.metrics.success.update.title', 'ideaWorkspace.hypotheses.detail.metrics.success.update.message')
        isMetricModalOpen.value = false
        return true
      })
    } catch (error: unknown) {
      if (handleRateLimitError(error)) {
        return
      }
    }
  }

  /**
   * Confirms deletion of the active metric candidate and closes the modal on success.
   */
  const confirmDeleteMetric = async (): Promise<void> => {
    if (!input.hasValidRouteParams.value || metricDeleteCandidate.value === null) {
      return
    }

    const candidate = metricDeleteCandidate.value

    try {
      await runMetricDeleteAction(async () => {
        const deleted = await deleteMetric({
          ideaId: input.ideaId.value,
          versionId: input.versionId.value,
          hypothesisId: input.hypothesisId.value,
          metricId: candidate.id
        })

        if (!deleted) {
          showError('ideaWorkspace.hypotheses.detail.metrics.error.delete.title', 'ideaWorkspace.hypotheses.detail.metrics.error.delete.message')
          return false
        }

        showSuccess('ideaWorkspace.hypotheses.detail.metrics.success.delete.title', 'ideaWorkspace.hypotheses.detail.metrics.success.delete.message')
        isMetricDeleteModalOpen.value = false
        metricDeleteCandidate.value = null
        return true
      })
    } catch (error: unknown) {
      if (handleRateLimitError(error)) {
        return
      }
    }
  }

  return {
    metrics,
    isMetricsLoading,
    isMetricDeletingId,
    hasMetricsError,
    isMetricModalOpen,
    isMetricDeleteModalOpen,
    metricDeleteCandidate,
    metricFormState,
    metricFormTitle,
    metricSubmitLabel,
    metricOperatorOptions,
    isAnyMetricActionLoading,
    isMetricDeleteSubmitting,
    loadMetricsForRoute,
    clearMetrics,
    openCreateMetricModal,
    openEditMetricModal,
    openMetricDeleteModal,
    formatMetricThreshold,
    submitMetricForm,
    confirmDeleteMetric
  }
}
