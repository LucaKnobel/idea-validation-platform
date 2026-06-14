/**
 * Input required to initialize the create modal state.
 */
export interface UseHypothesisCreateModalInput {
  createEmptyFormState: () => UpsertHypothesisBodyDto
}

/**
 * Public API for the create modal state.
 */
export interface UseHypothesisCreateModalComposable {
  formState: UpsertHypothesisBodyDto
  isCreateModalOpen: Ref<boolean>
  resetForm: () => void
  openCreateModal: () => void
  closeCreateModal: () => void
}

/**
 * Handles create modal transitions and editable form payload state.
 */
export const useHypothesisCreateModal = (
  input: UseHypothesisCreateModalInput
): UseHypothesisCreateModalComposable => {
  const formState = reactive<UpsertHypothesisBodyDto>(input.createEmptyFormState())
  const { isOpen: isCreateModalOpen, open: openModal, close: closeModal } = useModalState()

  /**
   * Resets editable form values to the baseline create payload.
   */
  const resetForm = (): void => {
    const nextState = input.createEmptyFormState()
    formState.statement = nextState.statement
    formState.dimension = nextState.dimension
    formState.priority = nextState.priority
    formState.evidenceType = nextState.evidenceType
    formState.canvasElementTypes = [...nextState.canvasElementTypes]
  }

  /**
   * Opens create mode with a clean form.
   */
  const openCreateModal = (): void => {
    resetForm()
    openModal()
  }

  /**
   * Closes the create form modal.
   */
  const closeCreateModal = (): void => {
    closeModal()
  }

  return {
    formState,
    isCreateModalOpen,
    resetForm,
    openCreateModal,
    closeCreateModal
  }
}
