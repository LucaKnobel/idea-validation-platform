import type { ExperimentFormState } from '~/components/idea-workspace/ExperimentFormModal.vue'
import type { MeasurementFormState } from '~/components/idea-workspace/MeasurementFormModal.vue'

/**
 * Route-level dependencies required by the hypothesis experiments detail flow.
 */
export interface UseHypothesisExperimentsDetailInput {
  ideaId: Ref<string>
  versionId: Ref<string>
  hypothesisId: Ref<string>
  metrics: Ref<MetricResponseDto[]>
  hasValidRouteParams: ComputedRef<boolean>
}

/**
 * Public API for experiments section state and modal workflows on hypothesis detail pages.
 */
export interface UseHypothesisExperimentsDetailComposable {
  experiments: Ref<ExperimentResponseDto[]>
  measurements: Ref<MeasurementResponseDto[]>
  measurementCountsByExperiment: Ref<Record<string, number>>
  isExperimentsLoading: Ref<boolean>
  isMeasurementsLoading: Ref<boolean>
  isExperimentDeletingId: Ref<string | null>
  measurementDeletingId: Ref<string | null>
  hasExperimentsError: Ref<boolean>
  hasMeasurementsError: Ref<boolean>
  isExperimentModalOpen: Ref<boolean>
  isExperimentMeasurementsModalOpen: Ref<boolean>
  isMeasurementModalOpen: Ref<boolean>
  isMeasurementDeleteModalOpen: Ref<boolean>
  isExperimentDeleteModalOpen: Ref<boolean>
  activeMeasurementsExperiment: Ref<ExperimentResponseDto | null>
  measurementDeleteCandidate: Ref<MeasurementResponseDto | null>
  experimentDeleteCandidate: Ref<ExperimentResponseDto | null>
  experimentFormState: ExperimentFormState
  measurementFormState: MeasurementFormState
  experimentFormTitle: ComputedRef<string>
  measurementFormTitle: ComputedRef<string>
  experimentSubmitLabel: ComputedRef<string>
  measurementSubmitLabel: ComputedRef<string>
  experimentStatusOptions: ComputedRef<Array<{ label: string, value: CreateExperimentBodyDto['status'] }>>
  measurementMetricOptions: ComputedRef<Array<{ label: string, value: string }>>
  isAnyExperimentActionLoading: ComputedRef<boolean>
  isAnyMeasurementActionLoading: ComputedRef<boolean>
  isExperimentDeleteSubmitting: Ref<boolean>
  isMeasurementDeleteSubmitting: Ref<boolean>
  loadExperimentsForRoute: () => Promise<void>
  reloadMeasurements: () => Promise<void>
  clearExperiments: () => void
  openCreateExperimentModal: () => void
  openExperimentMeasurementsModal: (experiment: ExperimentResponseDto) => Promise<void>
  openCreateMeasurementModal: () => void
  openEditMeasurementModal: (measurement: MeasurementResponseDto) => void
  openMeasurementDeleteModal: (measurement: MeasurementResponseDto) => void
  openEditExperimentModal: (experiment: ExperimentResponseDto) => void
  openExperimentDeleteModal: (experiment: ExperimentResponseDto) => void
  submitExperimentForm: (state: ExperimentFormState) => Promise<void>
  submitMeasurementForm: (state: MeasurementFormState) => Promise<void>
  confirmDeleteExperiment: () => Promise<void>
  confirmDeleteMeasurement: () => Promise<void>
  resolveMetricName: (metricId: string) => string
  formatMeasurementValue: (measurement: MeasurementResponseDto) => string
}

/**
 * Encapsulates experiments data loading, modal state, and CRUD submit handlers for one hypothesis detail page.
 */
export const useHypothesisExperimentsDetail = (
  input: UseHypothesisExperimentsDetailInput
): UseHypothesisExperimentsDetailComposable => {
  const { t } = useI18n()
  const { handleRateLimitError } = useErrorHandler()
  const { showSuccess, showError } = useToastNotification()
  const {
    listMeasurements,
    createMeasurement,
    updateMeasurement,
    deleteMeasurement
  } = useMeasurementsApi()
  const {
    experiments,
    isLoading: isExperimentsLoading,
    isCreating: isExperimentCreating,
    isDeletingId: isExperimentDeletingId,
    isUpdatingId: experimentUpdatingId,
    hasError: hasExperimentsError,
    loadExperiments,
    createExperiment,
    updateExperiment,
    deleteExperiment,
    clearExperiments
  } = useHypothesisExperiments()
  const {
    isSubmitting: isExperimentFormSubmitting,
    runWithSubmitGuard: runExperimentFormAction
  } = useAsyncSubmitGuard()
  const {
    isSubmitting: isExperimentDeleteSubmitting,
    runWithSubmitGuard: runExperimentDeleteAction
  } = useAsyncSubmitGuard()
  const {
    isSubmitting: isMeasurementFormSubmitting,
    runWithSubmitGuard: runMeasurementFormAction
  } = useAsyncSubmitGuard()
  const {
    isSubmitting: isMeasurementDeleteSubmitting,
    runWithSubmitGuard: runMeasurementDeleteAction
  } = useAsyncSubmitGuard()

  const isExperimentModalOpen = ref(false)
  const isExperimentMeasurementsModalOpen = ref(false)
  const isMeasurementModalOpen = ref(false)
  const isMeasurementDeleteModalOpen = ref(false)
  const experimentFormMode = ref<'create' | 'update'>('create')
  const measurementFormMode = ref<'create' | 'update'>('create')
  const activeExperimentId = ref<string | null>(null)
  const activeMeasurementsExperiment = ref<ExperimentResponseDto | null>(null)
  const activeMeasurementId = ref<string | null>(null)
  const experimentDeleteCandidate = ref<ExperimentResponseDto | null>(null)
  const measurementDeleteCandidate = ref<MeasurementResponseDto | null>(null)
  const isExperimentDeleteModalOpen = ref(false)
  const measurements = ref<MeasurementResponseDto[]>([])
  const measurementCountsByExperiment = ref<Record<string, number>>({})
  const isMeasurementsLoading = ref(false)
  const hasMeasurementsError = ref(false)
  const isMeasurementCreating = ref(false)
  const measurementUpdatingId = ref<string | null>(null)
  const measurementDeletingId = ref<string | null>(null)

  const experimentFormState = reactive<ExperimentFormState>({
    title: '',
    description: '',
    status: 'PLANNED'
  })

  const measurementFormState = reactive<MeasurementFormState>({
    metricId: '',
    value: 0,
    note: ''
  })

  const experimentFormTitle = computed(() => {
    return experimentFormMode.value === 'create'
      ? t('ideaWorkspace.hypotheses.detail.experiments.modal.createTitle')
      : t('ideaWorkspace.hypotheses.detail.experiments.modal.editTitle')
  })

  const experimentSubmitLabel = computed(() => {
    return experimentFormMode.value === 'create'
      ? t('ideaWorkspace.hypotheses.detail.experiments.actions.create')
      : t('ideaWorkspace.hypotheses.detail.experiments.actions.update')
  })

  const measurementFormTitle = computed(() => {
    return measurementFormMode.value === 'create'
      ? t('ideaWorkspace.hypotheses.detail.measurements.modal.createTitle')
      : t('ideaWorkspace.hypotheses.detail.measurements.modal.editTitle')
  })

  const measurementSubmitLabel = computed(() => {
    return measurementFormMode.value === 'create'
      ? t('ideaWorkspace.hypotheses.detail.measurements.actions.create')
      : t('ideaWorkspace.hypotheses.detail.measurements.actions.update')
  })

  const experimentStatusOptions = computed(() => {
    return [
      { label: t('ideaWorkspace.hypotheses.detail.experiments.status.PLANNED'), value: 'PLANNED' },
      { label: t('ideaWorkspace.hypotheses.detail.experiments.status.RUNNING'), value: 'RUNNING' },
      { label: t('ideaWorkspace.hypotheses.detail.experiments.status.COMPLETED'), value: 'COMPLETED' },
      { label: t('ideaWorkspace.hypotheses.detail.experiments.status.CANCELLED'), value: 'CANCELLED' }
    ] satisfies Array<{ label: string, value: CreateExperimentBodyDto['status'] }>
  })

  const isAnyExperimentActionLoading = computed(() => {
    return isExperimentCreating.value || experimentUpdatingId.value !== null || isExperimentFormSubmitting.value
  })

  const isAnyMeasurementActionLoading = computed(() => {
    return isMeasurementCreating.value || measurementUpdatingId.value !== null || isMeasurementFormSubmitting.value
  })

  const metricById = computed(() => {
    return new Map(input.metrics.value.map(metric => [metric.id, metric]))
  })

  const measurementMetricOptions = computed(() => {
    const usedMetricIds = new Set(
      measurements.value
        .filter(measurement => measurement.id !== activeMeasurementId.value)
        .map(measurement => measurement.metricId)
    )

    return input.metrics.value
      .filter(metric => !usedMetricIds.has(metric.id))
      .map((metric) => {
        const unit = metric.unit ? ` (${metric.unit})` : ''

        return {
          label: `${metric.name}${unit}`,
          value: metric.id
        }
      })
  })

  /**
   * Resets the editable experiment form to defaults used by create mode.
   */
  const resetExperimentForm = (): void => {
    experimentFormState.title = ''
    experimentFormState.description = ''
    experimentFormState.status = 'PLANNED'
  }

  /**
   * Resets the editable measurement form to defaults used by create mode.
   */
  const resetMeasurementForm = (): void => {
    measurementFormState.metricId = measurementMetricOptions.value[0]?.value || ''
    measurementFormState.value = 0
    measurementFormState.note = ''
  }

  /**
   * Loads all measurements for one experiment and updates section state.
   */
  const loadMeasurementsForExperiment = async (experimentId: string): Promise<void> => {
    if (!input.hasValidRouteParams.value) {
      return
    }

    isMeasurementsLoading.value = true
    hasMeasurementsError.value = false

    try {
      const response = await listMeasurements({
        ideaId: input.ideaId.value,
        versionId: input.versionId.value,
        hypothesisId: input.hypothesisId.value,
        experimentId
      })

      measurements.value = [...response.items].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
      measurementCountsByExperiment.value = {
        ...measurementCountsByExperiment.value,
        [experimentId]: response.items.length
      }
    } catch {
      measurements.value = []
      hasMeasurementsError.value = true
    } finally {
      isMeasurementsLoading.value = false
    }
  }

  /**
   * Preloads measurement counts for all experiments to render cards without opening the modal first.
   */
  const preloadMeasurementCounts = async (items: ExperimentResponseDto[]): Promise<void> => {
    if (!input.hasValidRouteParams.value || items.length === 0) {
      measurementCountsByExperiment.value = {}
      return
    }

    const entries = await Promise.all(items.map(async (experiment) => {
      try {
        const response = await listMeasurements({
          ideaId: input.ideaId.value,
          versionId: input.versionId.value,
          hypothesisId: input.hypothesisId.value,
          experimentId: experiment.id
        })

        return [experiment.id, response.items.length] as const
      } catch {
        return [experiment.id, 0] as const
      }
    }))

    measurementCountsByExperiment.value = Object.fromEntries(entries)
  }

  /**
   * Loads experiments for the currently active idea/version/hypothesis route.
   */
  const loadExperimentsForRoute = async (): Promise<void> => {
    if (!input.hasValidRouteParams.value) {
      return
    }

    await loadExperiments({
      ideaId: input.ideaId.value,
      versionId: input.versionId.value,
      hypothesisId: input.hypothesisId.value
    })

    await preloadMeasurementCounts(experiments.value)
  }

  /**
   * Opens create mode with a clean experiment form.
   */
  const openCreateExperimentModal = (): void => {
    experimentFormMode.value = 'create'
    activeExperimentId.value = null
    resetExperimentForm()
    isExperimentModalOpen.value = true
  }

  /**
   * Opens the measurements modal for one experiment and loads all current measurements.
   */
  const openExperimentMeasurementsModal = async (experiment: ExperimentResponseDto): Promise<void> => {
    activeMeasurementsExperiment.value = experiment
    isExperimentMeasurementsModalOpen.value = true
    await loadMeasurementsForExperiment(experiment.id)
  }

  /**
   * Opens create mode with a clean measurement form.
   */
  const openCreateMeasurementModal = (): void => {
    if (measurementMetricOptions.value.length === 0) {
      showError('ideaWorkspace.hypotheses.detail.measurements.error.noAvailableMetric.title', 'ideaWorkspace.hypotheses.detail.measurements.error.noAvailableMetric.message')
      return
    }

    measurementFormMode.value = 'create'
    activeMeasurementId.value = null
    resetMeasurementForm()
    isMeasurementModalOpen.value = true
  }

  /**
   * Opens update mode and pre-fills the measurement form from the selected measurement.
   */
  const openEditMeasurementModal = (measurement: MeasurementResponseDto): void => {
    measurementFormMode.value = 'update'
    activeMeasurementId.value = measurement.id
    measurementFormState.metricId = measurement.metricId
    measurementFormState.value = measurement.value
    measurementFormState.note = measurement.note || ''
    isMeasurementModalOpen.value = true
  }

  /**
   * Opens delete confirmation for the selected measurement.
   */
  const openMeasurementDeleteModal = (measurement: MeasurementResponseDto): void => {
    measurementDeleteCandidate.value = measurement
    isMeasurementDeleteModalOpen.value = true
  }

  /**
   * Opens update mode and pre-fills the experiment form from the selected experiment.
   */
  const openEditExperimentModal = (experiment: ExperimentResponseDto): void => {
    experimentFormMode.value = 'update'
    activeExperimentId.value = experiment.id
    experimentFormState.title = experiment.title
    experimentFormState.description = experiment.description || ''
    experimentFormState.status = experiment.status
    isExperimentModalOpen.value = true
  }

  /**
   * Opens delete confirmation for the selected experiment.
   */
  const openExperimentDeleteModal = (experiment: ExperimentResponseDto): void => {
    experimentDeleteCandidate.value = experiment
    isExperimentDeleteModalOpen.value = true
  }

  /**
   * Normalizes form values to the API payload shape.
   */
  const normalizeExperimentBody = (
    state: ExperimentFormState,
    currentExperiment?: ExperimentResponseDto
  ): CreateExperimentBodyDto => {
    return {
      title: state.title,
      description: state.description.trim().length > 0 ? state.description.trim() : null,
      status: state.status,
      templateId: currentExperiment?.templateId || null
    }
  }

  /**
   * Normalizes measurement form values to the API payload shape.
   */
  const normalizeMeasurementBody = (state: MeasurementFormState): CreateMeasurementBodyDto => {
    return {
      metricId: state.metricId,
      value: state.value,
      note: state.note.trim().length > 0 ? state.note.trim() : null
    }
  }

  /**
   * Executes create/update save flow for the experiment form, including user feedback and modal transitions.
   */
  const submitExperimentForm = async (state: ExperimentFormState): Promise<void> => {
    if (!input.hasValidRouteParams.value) {
      return
    }

    const activeExperiment = activeExperimentId.value
      ? experiments.value.find(experiment => experiment.id === activeExperimentId.value)
      : undefined
    const body = normalizeExperimentBody(state, activeExperiment)

    try {
      await runExperimentFormAction(async () => {
        if (experimentFormMode.value === 'create') {
          const created = await createExperiment({
            ideaId: input.ideaId.value,
            versionId: input.versionId.value,
            hypothesisId: input.hypothesisId.value,
            body
          })

          if (created === null) {
            showError('ideaWorkspace.hypotheses.detail.experiments.error.create.title', 'ideaWorkspace.hypotheses.detail.experiments.error.create.message')
            return false
          }

          showSuccess('ideaWorkspace.hypotheses.detail.experiments.success.create.title', 'ideaWorkspace.hypotheses.detail.experiments.success.create.message')
          measurementCountsByExperiment.value = {
            ...measurementCountsByExperiment.value,
            [created.id]: 0
          }
          isExperimentModalOpen.value = false
          return true
        }

        if (activeExperimentId.value === null) {
          return false
        }

        const updated = await updateExperiment({
          ideaId: input.ideaId.value,
          versionId: input.versionId.value,
          hypothesisId: input.hypothesisId.value,
          experimentId: activeExperimentId.value,
          body
        })

        if (updated === null) {
          showError('ideaWorkspace.hypotheses.detail.experiments.error.update.title', 'ideaWorkspace.hypotheses.detail.experiments.error.update.message')
          return false
        }

        showSuccess('ideaWorkspace.hypotheses.detail.experiments.success.update.title', 'ideaWorkspace.hypotheses.detail.experiments.success.update.message')
        isExperimentModalOpen.value = false
        return true
      })
    } catch (error: unknown) {
      if (handleRateLimitError(error)) {
        return
      }
    }
  }

  /**
   * Executes create/update save flow for the measurement form.
   */
  const submitMeasurementForm = async (state: MeasurementFormState): Promise<void> => {
    if (!input.hasValidRouteParams.value || activeMeasurementsExperiment.value === null) {
      return
    }

    const experimentId = activeMeasurementsExperiment.value.id
    const body = normalizeMeasurementBody(state)

    try {
      await runMeasurementFormAction(async () => {
        if (measurementFormMode.value === 'create') {
          isMeasurementCreating.value = true

          const createdMeasurement = await createMeasurement({
            ideaId: input.ideaId.value,
            versionId: input.versionId.value,
            hypothesisId: input.hypothesisId.value,
            experimentId,
            body
          })

          if (!createdMeasurement) {
            showError('ideaWorkspace.hypotheses.detail.measurements.error.create.title', 'ideaWorkspace.hypotheses.detail.measurements.error.create.message')
            return false
          }

          showSuccess('ideaWorkspace.hypotheses.detail.measurements.success.create.title', 'ideaWorkspace.hypotheses.detail.measurements.success.create.message')
          isMeasurementModalOpen.value = false
          await loadMeasurementsForExperiment(experimentId)
          return true
        }

        if (activeMeasurementId.value === null) {
          return false
        }

        measurementUpdatingId.value = activeMeasurementId.value
        const updatedMeasurement = await updateMeasurement({
          ideaId: input.ideaId.value,
          versionId: input.versionId.value,
          hypothesisId: input.hypothesisId.value,
          experimentId,
          measurementId: activeMeasurementId.value,
          body
        })

        if (!updatedMeasurement) {
          showError('ideaWorkspace.hypotheses.detail.measurements.error.update.title', 'ideaWorkspace.hypotheses.detail.measurements.error.update.message')
          return false
        }

        showSuccess('ideaWorkspace.hypotheses.detail.measurements.success.update.title', 'ideaWorkspace.hypotheses.detail.measurements.success.update.message')
        isMeasurementModalOpen.value = false
        await loadMeasurementsForExperiment(experimentId)
        return true
      })
    } catch (error: unknown) {
      if (handleRateLimitError(error)) {
        return
      }

      if (extractStatusCode(error) === 409) {
        showError('ideaWorkspace.hypotheses.detail.measurements.error.conflict.title', 'ideaWorkspace.hypotheses.detail.measurements.error.conflict.message')
        await loadMeasurementsForExperiment(experimentId)
        return
      }

      showError(
        measurementFormMode.value === 'create'
          ? 'ideaWorkspace.hypotheses.detail.measurements.error.create.title'
          : 'ideaWorkspace.hypotheses.detail.measurements.error.update.title',
        measurementFormMode.value === 'create'
          ? 'ideaWorkspace.hypotheses.detail.measurements.error.create.message'
          : 'ideaWorkspace.hypotheses.detail.measurements.error.update.message'
      )
    } finally {
      isMeasurementCreating.value = false
      measurementUpdatingId.value = null
    }
  }

  /**
   * Confirms deletion of the active experiment candidate and closes the modal on success.
   */
  const confirmDeleteExperiment = async (): Promise<void> => {
    if (!input.hasValidRouteParams.value || experimentDeleteCandidate.value === null) {
      return
    }

    const candidate = experimentDeleteCandidate.value

    try {
      await runExperimentDeleteAction(async () => {
        const deleted = await deleteExperiment({
          ideaId: input.ideaId.value,
          versionId: input.versionId.value,
          hypothesisId: input.hypothesisId.value,
          experimentId: candidate.id
        })

        if (!deleted) {
          showError('ideaWorkspace.hypotheses.detail.experiments.error.delete.title', 'ideaWorkspace.hypotheses.detail.experiments.error.delete.message')
          return false
        }

        showSuccess('ideaWorkspace.hypotheses.detail.experiments.success.delete.title', 'ideaWorkspace.hypotheses.detail.experiments.success.delete.message')
        isExperimentDeleteModalOpen.value = false
        experimentDeleteCandidate.value = null
        const nextCounts = {
          ...measurementCountsByExperiment.value
        }
        const { [candidate.id]: _removedCount, ...remainingCounts } = nextCounts
        measurementCountsByExperiment.value = remainingCounts

        if (activeMeasurementsExperiment.value?.id === candidate.id) {
          isExperimentMeasurementsModalOpen.value = false
          activeMeasurementsExperiment.value = null
          measurements.value = []
        }

        return true
      })
    } catch (error: unknown) {
      if (handleRateLimitError(error)) {
        return
      }
    }
  }

  /**
   * Confirms deletion of the active measurement candidate and closes the modal on success.
   */
  const confirmDeleteMeasurement = async (): Promise<void> => {
    if (!input.hasValidRouteParams.value || measurementDeleteCandidate.value === null || activeMeasurementsExperiment.value === null) {
      return
    }

    const candidate = measurementDeleteCandidate.value
    const experimentId = activeMeasurementsExperiment.value.id

    try {
      await runMeasurementDeleteAction(async () => {
        measurementDeletingId.value = candidate.id

        await deleteMeasurement({
          ideaId: input.ideaId.value,
          versionId: input.versionId.value,
          hypothesisId: input.hypothesisId.value,
          experimentId,
          measurementId: candidate.id
        })

        showSuccess('ideaWorkspace.hypotheses.detail.measurements.success.delete.title', 'ideaWorkspace.hypotheses.detail.measurements.success.delete.message')
        measurementDeleteCandidate.value = null
        isMeasurementDeleteModalOpen.value = false
        await loadMeasurementsForExperiment(experimentId)
        return true
      })
    } catch (error: unknown) {
      if (handleRateLimitError(error)) {
        return
      }

      showError('ideaWorkspace.hypotheses.detail.measurements.error.delete.title', 'ideaWorkspace.hypotheses.detail.measurements.error.delete.message')
    } finally {
      measurementDeletingId.value = null
    }
  }

  /**
   * Reloads measurements for the currently active experiment modal.
   */
  const reloadMeasurements = async (): Promise<void> => {
    if (activeMeasurementsExperiment.value === null) {
      return
    }

    await loadMeasurementsForExperiment(activeMeasurementsExperiment.value.id)
  }

  /**
   * Resolves the display label for one metric id.
   */
  const resolveMetricName = (metricId: string): string => {
    return metricById.value.get(metricId)?.name || '-'
  }

  /**
   * Formats one measurement value using the unit of its linked metric.
   */
  const formatMeasurementValue = (measurement: MeasurementResponseDto): string => {
    const metric = metricById.value.get(measurement.metricId)

    if (!metric?.unit) {
      return String(measurement.value)
    }

    return `${measurement.value} ${metric.unit}`
  }

  return {
    experiments,
    measurements,
    measurementCountsByExperiment,
    isExperimentsLoading,
    isMeasurementsLoading,
    isExperimentDeletingId,
    measurementDeletingId,
    hasExperimentsError,
    hasMeasurementsError,
    isExperimentModalOpen,
    isExperimentMeasurementsModalOpen,
    isMeasurementModalOpen,
    isMeasurementDeleteModalOpen,
    isExperimentDeleteModalOpen,
    activeMeasurementsExperiment,
    measurementDeleteCandidate,
    experimentDeleteCandidate,
    experimentFormState,
    measurementFormState,
    experimentFormTitle,
    measurementFormTitle,
    experimentSubmitLabel,
    measurementSubmitLabel,
    experimentStatusOptions,
    measurementMetricOptions,
    isAnyExperimentActionLoading,
    isAnyMeasurementActionLoading,
    isExperimentDeleteSubmitting,
    isMeasurementDeleteSubmitting,
    loadExperimentsForRoute,
    reloadMeasurements,
    clearExperiments,
    openCreateExperimentModal,
    openExperimentMeasurementsModal,
    openCreateMeasurementModal,
    openEditMeasurementModal,
    openMeasurementDeleteModal,
    openEditExperimentModal,
    openExperimentDeleteModal,
    submitExperimentForm,
    submitMeasurementForm,
    confirmDeleteExperiment,
    confirmDeleteMeasurement,
    resolveMetricName,
    formatMeasurementValue
  }
}
