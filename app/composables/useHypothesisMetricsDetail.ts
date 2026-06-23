import type { MetricFormState } from '~/components/idea-workspace/MetricFormModal.vue'

/**
 * Route-level dependencies required by the hypothesis metric detail flow.
 */
export interface UseHypothesisMetricsDetailInput {
  hypothesisId: Ref<string>
  hasValidRouteParams: ComputedRef<boolean>
  onStatusChanged?: () => Promise<void> | void
}

/**
 * Public API for metric section state and modal workflows on hypothesis detail pages.
 */
export interface UseHypothesisMetricsDetailComposable {
  metric: Ref<MetricResponseDto | null>
  isMetricsLoading: Ref<boolean>
  isMetricDeletingId: Ref<string | null>
  hasMetricsError: Ref<boolean>
  isMetricModalOpen: Ref<boolean>
  isMetricDeleteModalOpen: Ref<boolean>
  metricDeleteCandidate: Ref<MetricResponseDto | null>
  metricFormState: MetricFormState
  metricFormTitle: ComputedRef<string>
  metricSubmitLabel: ComputedRef<string>
  metricOperatorOptions: ComputedRef<Array<{ label: string, value: UpsertMetricBodyDto['threshold']['operator'] }>>
  isAnyMetricActionLoading: ComputedRef<boolean>
  isMetricDeleteSubmitting: Ref<boolean>
  loadMetricForRoute: () => Promise<void>
  clearMetric: () => void
  openCreateMetricModal: () => void
  openEditMetricModal: () => void
  openMetricDeleteModal: () => void
  formatMetricThreshold: (metric: MetricResponseDto) => string
  submitMetricForm: (state: MetricFormState) => Promise<void>
  confirmDeleteMetric: () => Promise<void>
}

/**
 * Encapsulates metric data loading, modal state, and CRUD submit handlers for one hypothesis detail page.
 */
export const useHypothesisMetricsDetail = (
  input: UseHypothesisMetricsDetailInput
): UseHypothesisMetricsDetailComposable => {
  const { t } = useI18n()
  const { handleRateLimitError } = useErrorHandler()
  const { showSuccess, showError } = useToastNotification()
  const {
    metric,
    isLoading: isMetricsLoading,
    isCreating: isMetricCreating,
    isDeletingId: isMetricDeletingId,
    hasError: hasMetricsError,
    loadMetric,
    upsertMetric,
    deleteMetric,
    clearMetric
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
    ] satisfies Array<{ label: string, value: UpsertMetricBodyDto['threshold']['operator'] }>
  })

  const isAnyMetricActionLoading = computed(() => {
    return isMetricCreating.value || isMetricFormSubmitting.value
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
   * Clears local singleton state when route params are invalid or navigation leaves the context.
   */
  const clearMetricDetails = (): void => {
    clearMetric()
    metricDeleteCandidate.value = null
  }

  /**
   * Loads the singleton metric for the currently active idea/version/hypothesis route.
   */
  const loadMetricForRoute = async (): Promise<void> => {
    if (!input.hasValidRouteParams.value) {
      return
    }

    await loadMetric({
      hypothesisId: input.hypothesisId.value
    })
  }

  /**
   * Opens create mode with a clean metric form.
   */
  const openCreateMetricModal = (): void => {
    if (metric.value !== null) {
      return
    }

    metricFormMode.value = 'create'
    resetMetricForm()
    isMetricModalOpen.value = true
  }

  /**
   * Opens update mode and pre-fills the metric form from the current metric.
   */
  const openEditMetricModal = (): void => {
    if (metric.value === null) {
      return
    }

    metricFormMode.value = 'update'
    metricFormState.name = metric.value.name
    metricFormState.description = metric.value.description || ''
    metricFormState.unit = metric.value.unit || ''
    metricFormState.threshold = {
      operator: metric.value.threshold?.operator || 'GTE',
      referenceValue: metric.value.threshold?.referenceValue || 0
    }
    isMetricModalOpen.value = true
  }

  /**
   * Opens delete confirmation for the current metric.
   */
  const openMetricDeleteModal = (): void => {
    if (metric.value === null) {
      return
    }

    metricDeleteCandidate.value = metric.value
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
  const normalizeMetricBody = (state: MetricFormState): UpsertMetricBodyDto => {
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
          const created = await upsertMetric({
            hypothesisId: input.hypothesisId.value,
            body
          })

          if (created === null) {
            showError('ideaWorkspace.hypotheses.detail.metrics.error.create.title', 'ideaWorkspace.hypotheses.detail.metrics.error.create.message')
            return false
          }

          showSuccess('ideaWorkspace.hypotheses.detail.metrics.success.create.title', 'ideaWorkspace.hypotheses.detail.metrics.success.create.message')
          isMetricModalOpen.value = false
          await input.onStatusChanged?.()
          return true
        }

        const updated = await upsertMetric({
          hypothesisId: input.hypothesisId.value,
          body
        })

        if (updated === null) {
          showError('ideaWorkspace.hypotheses.detail.metrics.error.update.title', 'ideaWorkspace.hypotheses.detail.metrics.error.update.message')
          return false
        }

        showSuccess('ideaWorkspace.hypotheses.detail.metrics.success.update.title', 'ideaWorkspace.hypotheses.detail.metrics.success.update.message')
        isMetricModalOpen.value = false
        await input.onStatusChanged?.()
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

    try {
      await runMetricDeleteAction(async () => {
        const deleted = await deleteMetric({
          hypothesisId: input.hypothesisId.value
        })

        if (!deleted) {
          showError('ideaWorkspace.hypotheses.detail.metrics.error.delete.title', 'ideaWorkspace.hypotheses.detail.metrics.error.delete.message')
          return false
        }

        showSuccess('ideaWorkspace.hypotheses.detail.metrics.success.delete.title', 'ideaWorkspace.hypotheses.detail.metrics.success.delete.message')
        isMetricDeleteModalOpen.value = false
        metricDeleteCandidate.value = null
        await input.onStatusChanged?.()
        return true
      })
    } catch (error: unknown) {
      if (handleRateLimitError(error)) {
        return
      }
    }
  }

  return {
    metric,
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
    loadMetricForRoute,
    clearMetric: clearMetricDetails,
    openCreateMetricModal,
    openEditMetricModal,
    openMetricDeleteModal,
    formatMetricThreshold,
    submitMetricForm,
    confirmDeleteMetric
  }
}
