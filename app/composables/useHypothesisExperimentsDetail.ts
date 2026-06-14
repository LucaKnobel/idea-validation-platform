import type { ExperimentFormState } from '~/components/idea-workspace/ExperimentFormModal.vue'
import type { MeasurementFormState } from '~/components/idea-workspace/MeasurementFormModal.vue'

/**
 * Route-level dependencies required by the hypothesis experiment detail flow.
 */
export interface UseHypothesisExperimentsDetailInput {
  hypothesisId: Ref<string>
  hasValidRouteParams: ComputedRef<boolean>
}

/**
 * Public API for experiment section state and modal workflows on hypothesis detail pages.
 */
export interface UseHypothesisExperimentsDetailComposable {
  experiment: Ref<ExperimentResponseDto | null>
  measurement: Ref<MeasurementResponseDto | null>
  isExperimentsLoading: Ref<boolean>
  isMeasurementsLoading: Ref<boolean>
  isExperimentDeletingId: Ref<string | null>
  measurementDeletingId: Ref<string | null>
  hasExperimentsError: ComputedRef<boolean>
  isExperimentModalOpen: Ref<boolean>
  isMeasurementModalOpen: Ref<boolean>
  isMeasurementDeleteModalOpen: Ref<boolean>
  isExperimentDeleteModalOpen: Ref<boolean>
  measurementDeleteCandidate: Ref<MeasurementResponseDto | null>
  experimentDeleteCandidate: Ref<ExperimentResponseDto | null>
  experimentFormState: ExperimentFormState
  measurementFormState: MeasurementFormState
  experimentFormTitle: ComputedRef<string>
  measurementFormTitle: ComputedRef<string>
  experimentSubmitLabel: ComputedRef<string>
  measurementSubmitLabel: ComputedRef<string>
  experimentStatusOptions: ComputedRef<Array<{ label: string, value: UpsertExperimentBodyDto['status'] }>>
  isAnyExperimentActionLoading: ComputedRef<boolean>
  isAnyMeasurementActionLoading: ComputedRef<boolean>
  isExperimentDeleteSubmitting: Ref<boolean>
  isMeasurementDeleteSubmitting: Ref<boolean>
  loadExperimentForRoute: () => Promise<void>
  clearExperiment: () => void
  openCreateExperimentModal: () => void
  openCreateMeasurementModal: () => void
  openEditMeasurementModal: (measurement: MeasurementResponseDto) => void
  openMeasurementDeleteModal: (measurement: MeasurementResponseDto) => void
  openEditExperimentModal: () => void
  openExperimentDeleteModal: () => void
  submitExperimentForm: (state: ExperimentFormState) => Promise<void>
  submitMeasurementForm: (state: MeasurementFormState) => Promise<void>
  confirmDeleteExperiment: () => Promise<void>
  confirmDeleteMeasurement: () => Promise<void>
  formatMeasurementValue: (measurement: MeasurementResponseDto) => string
}

/**
 * Encapsulates experiment and measurement data loading, modal state, and CRUD submit handlers for one hypothesis detail page.
 */
export const useHypothesisExperimentsDetail = (
  input: UseHypothesisExperimentsDetailInput
): UseHypothesisExperimentsDetailComposable => {
  const { t } = useI18n()
  const { handleRateLimitError } = useErrorHandler()
  const { showSuccess, showError } = useToastNotification()
  const {
    getMeasurement,
    upsertMeasurement,
    deleteMeasurement
  } = useMeasurementApi()
  const {
    experiment,
    isLoading: isExperimentsLoading,
    isCreating: isExperimentCreating,
    isDeletingId: isExperimentDeletingId,
    hasError: hasExperimentsRequestError,
    loadExperiment,
    upsertExperiment,
    deleteExperiment,
    clearExperiment
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
  const isMeasurementModalOpen = ref(false)
  const isMeasurementDeleteModalOpen = ref(false)
  const experimentFormMode = ref<'create' | 'update'>('create')
  const measurementFormMode = ref<'create' | 'update'>('create')
  const experimentDeleteCandidate = ref<ExperimentResponseDto | null>(null)
  const measurementDeleteCandidate = ref<MeasurementResponseDto | null>(null)
  const isExperimentDeleteModalOpen = ref(false)
  const measurement = ref<MeasurementResponseDto | null>(null)
  const isMeasurementsLoading = ref(false)
  const hasMeasurementsLoadError = ref(false)
  const hasExperimentsError = computed(() => {
    return hasExperimentsRequestError.value || hasMeasurementsLoadError.value
  })
  const isMeasurementCreating = ref(false)
  const measurementUpdatingId = ref<string | null>(null)
  const measurementDeletingId = ref<string | null>(null)

  const experimentFormState = reactive<ExperimentFormState>({
    title: '',
    description: '',
    status: 'PLANNED'
  })

  const measurementFormState = reactive<MeasurementFormState>({
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
    ] satisfies Array<{ label: string, value: UpsertExperimentBodyDto['status'] }>
  })

  const isAnyExperimentActionLoading = computed(() => {
    return isExperimentCreating.value || isExperimentFormSubmitting.value
  })

  const isAnyMeasurementActionLoading = computed(() => {
    return isMeasurementCreating.value || measurementUpdatingId.value !== null || isMeasurementFormSubmitting.value
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
    measurementFormState.value = 0
    measurementFormState.note = ''
  }

  /**
   * Loads the singleton measurement for the current hypothesis.
   */
  const loadMeasurement = async (): Promise<void> => {
    if (!input.hasValidRouteParams.value) {
      return
    }

    isMeasurementsLoading.value = true
    hasMeasurementsLoadError.value = false

    try {
      measurement.value = await getMeasurement({ hypothesisId: input.hypothesisId.value })
    } catch (error: unknown) {
      if (extractStatusCode(error) === 404) {
        measurement.value = null
        return
      }

      hasMeasurementsLoadError.value = true
      measurement.value = null
    } finally {
      isMeasurementsLoading.value = false
    }
  }

  /**
   * Loads the experiment for the currently active idea/version/hypothesis route.
   */
  const loadExperimentForRoute = async (): Promise<void> => {
    if (!input.hasValidRouteParams.value) {
      return
    }

    await loadExperiment({
      hypothesisId: input.hypothesisId.value
    })

    if (experiment.value === null) {
      measurement.value = null
      hasMeasurementsLoadError.value = false
      return
    }

    await loadMeasurement()
  }

  /**
   * Clears local singleton state when route params are invalid or navigation leaves the context.
   */
  const clearExperimentDetails = (): void => {
    clearExperiment()
    measurement.value = null
    hasMeasurementsLoadError.value = false
    measurementDeleteCandidate.value = null
    experimentDeleteCandidate.value = null
  }

  /**
   * Opens create mode with a clean experiment form.
   */
  const openCreateExperimentModal = (): void => {
    if (experiment.value !== null) {
      return
    }

    experimentFormMode.value = 'create'
    resetExperimentForm()
    isExperimentModalOpen.value = true
  }

  /**
   * Opens create mode for the singleton measurement.
   */
  const openCreateMeasurementModal = (): void => {
    if (experiment.value === null || measurement.value !== null) {
      return
    }

    measurementFormMode.value = 'create'
    resetMeasurementForm()
    isMeasurementModalOpen.value = true
  }

  /**
   * Opens update mode and pre-fills the measurement form from the selected measurement.
   */
  const openEditMeasurementModal = (measurement: MeasurementResponseDto): void => {
    measurementFormMode.value = 'update'
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
  const openEditExperimentModal = (): void => {
    if (experiment.value === null) {
      return
    }

    experimentFormMode.value = 'update'
    experimentFormState.title = experiment.value.title
    experimentFormState.description = experiment.value.description || ''
    experimentFormState.status = experiment.value.status
    isExperimentModalOpen.value = true
  }

  /**
   * Opens delete confirmation for the selected experiment.
   */
  const openExperimentDeleteModal = (): void => {
    if (experiment.value === null) {
      return
    }

    experimentDeleteCandidate.value = experiment.value
    isExperimentDeleteModalOpen.value = true
  }

  /**
   * Normalizes form values to the API payload shape.
   */
  const normalizeExperimentBody = (
    state: ExperimentFormState
  ): UpsertExperimentBodyDto => {
    return {
      title: state.title,
      description: state.description.trim().length > 0 ? state.description.trim() : null,
      status: state.status
    }
  }

  /**
   * Normalizes measurement form values to the API payload shape.
   */
  const normalizeMeasurementBody = (state: MeasurementFormState): UpsertMeasurementBodyDto => {
    return {
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

    const body = normalizeExperimentBody(state)

    try {
      await runExperimentFormAction(async () => {
        if (experimentFormMode.value === 'create') {
          const created = await upsertExperiment({
            hypothesisId: input.hypothesisId.value,
            body
          })

          if (created === null) {
            showError('ideaWorkspace.hypotheses.detail.experiments.error.create.title', 'ideaWorkspace.hypotheses.detail.experiments.error.create.message')
            return false
          }

          showSuccess('ideaWorkspace.hypotheses.detail.experiments.success.create.title', 'ideaWorkspace.hypotheses.detail.experiments.success.create.message')
          measurement.value = null
          isExperimentModalOpen.value = false
          return true
        }

        const updated = await upsertExperiment({
          hypothesisId: input.hypothesisId.value,
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
    if (!input.hasValidRouteParams.value || experiment.value === null) {
      return
    }

    const body = normalizeMeasurementBody(state)

    try {
      await runMeasurementFormAction(async () => {
        if (measurementFormMode.value === 'create') {
          isMeasurementCreating.value = true

          const createdMeasurement = await upsertMeasurement({
            hypothesisId: input.hypothesisId.value,
            body
          })

          if (!createdMeasurement) {
            showError('ideaWorkspace.hypotheses.detail.measurements.error.create.title', 'ideaWorkspace.hypotheses.detail.measurements.error.create.message')
            return false
          }

          showSuccess('ideaWorkspace.hypotheses.detail.measurements.success.create.title', 'ideaWorkspace.hypotheses.detail.measurements.success.create.message')
          isMeasurementModalOpen.value = false
          await loadMeasurement()
          return true
        }

        measurementUpdatingId.value = measurement.value?.id || null
        const updatedMeasurement = await upsertMeasurement({
          hypothesisId: input.hypothesisId.value,
          body
        })

        if (!updatedMeasurement) {
          showError('ideaWorkspace.hypotheses.detail.measurements.error.update.title', 'ideaWorkspace.hypotheses.detail.measurements.error.update.message')
          return false
        }

        showSuccess('ideaWorkspace.hypotheses.detail.measurements.success.update.title', 'ideaWorkspace.hypotheses.detail.measurements.success.update.message')
        isMeasurementModalOpen.value = false
        await loadMeasurement()
        return true
      })
    } catch (error: unknown) {
      if (handleRateLimitError(error)) {
        return
      }

      if (extractStatusCode(error) === 409) {
        showError('ideaWorkspace.hypotheses.detail.measurements.error.conflict.title', 'ideaWorkspace.hypotheses.detail.measurements.error.conflict.message')
        await loadMeasurement()
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

    try {
      await runExperimentDeleteAction(async () => {
        const deleted = await deleteExperiment({
          hypothesisId: input.hypothesisId.value
        })

        if (!deleted) {
          showError('ideaWorkspace.hypotheses.detail.experiments.error.delete.title', 'ideaWorkspace.hypotheses.detail.experiments.error.delete.message')
          return false
        }

        showSuccess('ideaWorkspace.hypotheses.detail.experiments.success.delete.title', 'ideaWorkspace.hypotheses.detail.experiments.success.delete.message')
        isExperimentDeleteModalOpen.value = false
        experimentDeleteCandidate.value = null
        measurement.value = null

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
    if (!input.hasValidRouteParams.value || measurementDeleteCandidate.value === null) {
      return
    }

    const candidate = measurementDeleteCandidate.value

    try {
      await runMeasurementDeleteAction(async () => {
        measurementDeletingId.value = candidate.id

        await deleteMeasurement({
          hypothesisId: input.hypothesisId.value
        })

        showSuccess('ideaWorkspace.hypotheses.detail.measurements.success.delete.title', 'ideaWorkspace.hypotheses.detail.measurements.success.delete.message')
        measurementDeleteCandidate.value = null
        isMeasurementDeleteModalOpen.value = false
        await loadMeasurement()
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
   * Formats one measurement value for compact display.
   */
  const formatMeasurementValue = (measurement: MeasurementResponseDto): string => {
    return String(measurement.value)
  }

  return {
    experiment,
    measurement,
    isExperimentsLoading,
    isMeasurementsLoading,
    isExperimentDeletingId,
    measurementDeletingId,
    hasExperimentsError,
    isExperimentModalOpen,
    isMeasurementModalOpen,
    isMeasurementDeleteModalOpen,
    isExperimentDeleteModalOpen,
    measurementDeleteCandidate,
    experimentDeleteCandidate,
    experimentFormState,
    measurementFormState,
    experimentFormTitle,
    measurementFormTitle,
    experimentSubmitLabel,
    measurementSubmitLabel,
    experimentStatusOptions,
    isAnyExperimentActionLoading,
    isAnyMeasurementActionLoading,
    isExperimentDeleteSubmitting,
    isMeasurementDeleteSubmitting,
    loadExperimentForRoute,
    clearExperiment: clearExperimentDetails,
    openCreateExperimentModal,
    openCreateMeasurementModal,
    openEditMeasurementModal,
    openMeasurementDeleteModal,
    openEditExperimentModal,
    openExperimentDeleteModal,
    submitExperimentForm,
    submitMeasurementForm,
    confirmDeleteExperiment,
    confirmDeleteMeasurement,
    formatMeasurementValue
  }
}
