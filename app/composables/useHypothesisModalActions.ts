/**
 * Input required to initialize shared hypothesis modal actions.
 */
export interface UseHypothesisModalActionsInput {
  createEmptyFormState: () => UpsertHypothesisBodyDto
}

/**
 * Public API for shared hypothesis create/update/delete modal workflows.
 */
export interface UseHypothesisModalActionsComposable {
  createFormTitle: ComputedRef<string>
  createSubmitLabel: ComputedRef<string>
  updateFormTitle: ComputedRef<string>
  updateSubmitLabel: ComputedRef<string>
  createFormState: UpsertHypothesisBodyDto
  updateFormState: UpsertHypothesisBodyDto
  formHypothesisId: Ref<string | null>
  deleteCandidate: Ref<HypothesisResponseDto | null>
  isCreateModalOpen: Ref<boolean>
  isUpdateModalOpen: Ref<boolean>
  isDeleteModalOpen: Ref<boolean>
  isCreateActionSubmitting: Ref<boolean>
  isUpdateActionSubmitting: Ref<boolean>
  isDeleteActionSubmitting: Ref<boolean>
  openCreateModal: () => void
  openUpdateModal: (hypothesis: HypothesisResponseDto) => void
  openEditModal: (hypothesis: HypothesisResponseDto | null) => void
  openDeleteModal: (hypothesis: HypothesisResponseDto) => void
  openDeleteConfirmation: (hypothesis: HypothesisResponseDto | null) => void
  closeCreateModal: () => void
  closeUpdateModal: () => void
  closeDeleteModal: () => void
  runCreateAction: (action: () => Promise<boolean>, onSuccess?: () => Promise<void> | void) => Promise<boolean>
  runUpdateAction: (action: () => Promise<boolean>, onSuccess?: () => Promise<void> | void) => Promise<boolean>
  runDeleteAction: (action: () => Promise<boolean>, onSuccess?: () => Promise<void> | void) => Promise<boolean>
}

/**
 * Centralizes hypothesis modal state, labels and create/update/delete feedback flows.
 */
export const useHypothesisModalActions = (
  input: UseHypothesisModalActionsInput
): UseHypothesisModalActionsComposable => {
  const { t } = useI18n()
  const { showSuccess, showError } = useToastNotification()
  const {
    isSubmitting: isCreateActionSubmitting,
    runWithSubmitGuard: runCreateSubmitGuard
  } = useAsyncSubmitGuard()
  const {
    isSubmitting: isUpdateActionSubmitting,
    runWithSubmitGuard: runUpdateSubmitGuard
  } = useAsyncSubmitGuard()
  const {
    isSubmitting: isDeleteActionSubmitting,
    runWithSubmitGuard: runDeleteSubmitGuard
  } = useAsyncSubmitGuard()

  const createModal = useHypothesisCreateModal({
    createEmptyFormState: input.createEmptyFormState
  })
  const updateModal = useHypothesisUpdateModal({
    createEmptyFormState: input.createEmptyFormState
  })
  const deleteModal = useHypothesisDeleteModal()

  const createFormTitle = computed(() => t('ideaWorkspace.hypotheses.modal.createTitle'))
  const createSubmitLabel = computed(() => t('ideaWorkspace.hypotheses.actions.create'))
  const updateFormTitle = computed(() => t('ideaWorkspace.hypotheses.modal.editTitle'))
  const updateSubmitLabel = computed(() => t('ideaWorkspace.hypotheses.actions.update'))

  const openEditModal = (hypothesis: HypothesisResponseDto | null): void => {
    if (hypothesis === null) {
      return
    }

    updateModal.openUpdateModal(hypothesis)
  }

  const openDeleteConfirmation = (hypothesis: HypothesisResponseDto | null): void => {
    if (hypothesis === null) {
      return
    }

    deleteModal.openDeleteModal(hypothesis)
  }

  const runCreateAction = async (
    action: () => Promise<boolean>,
    onSuccess?: () => Promise<void> | void
  ): Promise<boolean> => {
    const success = await runCreateSubmitGuard(action)

    if (typeof success === 'undefined') {
      return false
    }

    if (!success) {
      showError('ideaWorkspace.hypotheses.error.create.title', 'ideaWorkspace.hypotheses.error.create.message')
      return false
    }

    showSuccess('ideaWorkspace.hypotheses.success.create.title', 'ideaWorkspace.hypotheses.success.create.message')
    createModal.closeCreateModal()
    await onSuccess?.()
    return true
  }

  const runUpdateAction = async (
    action: () => Promise<boolean>,
    onSuccess?: () => Promise<void> | void
  ): Promise<boolean> => {
    const success = await runUpdateSubmitGuard(action)

    if (typeof success === 'undefined') {
      return false
    }

    if (!success) {
      showError('ideaWorkspace.hypotheses.error.update.title', 'ideaWorkspace.hypotheses.error.update.message')
      return false
    }

    showSuccess('ideaWorkspace.hypotheses.success.update.title', 'ideaWorkspace.hypotheses.success.update.message')
    updateModal.closeUpdateModal()
    await onSuccess?.()
    return true
  }

  const runDeleteAction = async (
    action: () => Promise<boolean>,
    onSuccess?: () => Promise<void> | void
  ): Promise<boolean> => {
    const success = await runDeleteSubmitGuard(action)

    if (typeof success === 'undefined') {
      return false
    }

    if (!success) {
      showError('ideaWorkspace.hypotheses.error.delete.title', 'ideaWorkspace.hypotheses.error.delete.message')
      return false
    }

    showSuccess('ideaWorkspace.hypotheses.success.delete.title', 'ideaWorkspace.hypotheses.success.delete.message')
    deleteModal.closeDeleteModal()
    await onSuccess?.()
    return true
  }

  return {
    createFormTitle,
    createSubmitLabel,
    updateFormTitle,
    updateSubmitLabel,
    createFormState: createModal.formState,
    updateFormState: updateModal.formState,
    formHypothesisId: updateModal.formHypothesisId,
    deleteCandidate: deleteModal.deleteCandidate,
    isCreateModalOpen: createModal.isCreateModalOpen,
    isUpdateModalOpen: updateModal.isUpdateModalOpen,
    isDeleteModalOpen: deleteModal.isDeleteModalOpen,
    isCreateActionSubmitting,
    isUpdateActionSubmitting,
    isDeleteActionSubmitting,
    openCreateModal: createModal.openCreateModal,
    openUpdateModal: updateModal.openUpdateModal,
    openEditModal,
    openDeleteModal: deleteModal.openDeleteModal,
    openDeleteConfirmation,
    closeCreateModal: createModal.closeCreateModal,
    closeUpdateModal: updateModal.closeUpdateModal,
    closeDeleteModal: deleteModal.closeDeleteModal,
    runCreateAction,
    runUpdateAction,
    runDeleteAction
  }
}
