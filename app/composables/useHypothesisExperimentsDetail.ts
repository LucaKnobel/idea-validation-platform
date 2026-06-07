import type { ExperimentFormState } from '~/components/idea-workspace/ExperimentFormModal.vue'

/**
 * Route-level dependencies required by the hypothesis experiments detail flow.
 */
export interface UseHypothesisExperimentsDetailInput {
  ideaId: Ref<string>
  versionId: Ref<string>
  hypothesisId: Ref<string>
  hasValidRouteParams: ComputedRef<boolean>
}

/**
 * Public API for experiments section state and modal workflows on hypothesis detail pages.
 */
export interface UseHypothesisExperimentsDetailComposable {
  experiments: Ref<ExperimentResponseDto[]>
  isExperimentsLoading: Ref<boolean>
  isExperimentDeletingId: Ref<string | null>
  hasExperimentsError: Ref<boolean>
  isExperimentModalOpen: Ref<boolean>
  isExperimentDeleteModalOpen: Ref<boolean>
  experimentDeleteCandidate: Ref<ExperimentResponseDto | null>
  experimentFormState: ExperimentFormState
  experimentFormTitle: ComputedRef<string>
  experimentSubmitLabel: ComputedRef<string>
  experimentStatusOptions: ComputedRef<Array<{ label: string, value: CreateExperimentBodyDto['status'] }>>
  isAnyExperimentActionLoading: ComputedRef<boolean>
  isExperimentDeleteSubmitting: Ref<boolean>
  loadExperimentsForRoute: () => Promise<void>
  clearExperiments: () => void
  openCreateExperimentModal: () => void
  openEditExperimentModal: (experiment: ExperimentResponseDto) => void
  openExperimentDeleteModal: (experiment: ExperimentResponseDto) => void
  submitExperimentForm: (state: ExperimentFormState) => Promise<void>
  confirmDeleteExperiment: () => Promise<void>
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

  const isExperimentModalOpen = ref(false)
  const experimentFormMode = ref<'create' | 'update'>('create')
  const activeExperimentId = ref<string | null>(null)
  const experimentDeleteCandidate = ref<ExperimentResponseDto | null>(null)
  const isExperimentDeleteModalOpen = ref(false)

  const experimentFormState = reactive<ExperimentFormState>({
    title: '',
    description: '',
    status: 'PLANNED'
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

  /**
   * Resets the editable experiment form to defaults used by create mode.
   */
  const resetExperimentForm = (): void => {
    experimentFormState.title = ''
    experimentFormState.description = ''
    experimentFormState.status = 'PLANNED'
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
        return true
      })
    } catch (error: unknown) {
      if (handleRateLimitError(error)) {
        return
      }
    }
  }

  return {
    experiments,
    isExperimentsLoading,
    isExperimentDeletingId,
    hasExperimentsError,
    isExperimentModalOpen,
    isExperimentDeleteModalOpen,
    experimentDeleteCandidate,
    experimentFormState,
    experimentFormTitle,
    experimentSubmitLabel,
    experimentStatusOptions,
    isAnyExperimentActionLoading,
    isExperimentDeleteSubmitting,
    loadExperimentsForRoute,
    clearExperiments,
    openCreateExperimentModal,
    openEditExperimentModal,
    openExperimentDeleteModal,
    submitExperimentForm,
    confirmDeleteExperiment
  }
}
