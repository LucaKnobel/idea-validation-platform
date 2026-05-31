/**
 * Input required to initialize the create modal state.
 */
export interface UseHypothesisCreateModalInput {
  createEmptyFormState: () => CreateHypothesisBodyDto
}

/**
 * Public API for the create modal state.
 */
export interface UseHypothesisCreateModalComposable {
  formState: CreateHypothesisBodyDto
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
  const formState = reactive<CreateHypothesisBodyDto>(input.createEmptyFormState())
  const isCreateModalOpen = ref(false)

  /**
   * Resets editable form values to the baseline create payload.
   */
  const resetForm = (): void => {
    const nextState = input.createEmptyFormState()
    formState.statement = nextState.statement
    formState.dimension = nextState.dimension
    formState.priority = nextState.priority
    formState.canvasSectionTypes = [...nextState.canvasSectionTypes]
  }

  /**
   * Opens create mode with a clean form.
   */
  const openCreateModal = (): void => {
    resetForm()
    isCreateModalOpen.value = true
  }

  /**
   * Closes the create form modal.
   */
  const closeCreateModal = (): void => {
    isCreateModalOpen.value = false
  }

  return {
    formState,
    isCreateModalOpen,
    resetForm,
    openCreateModal,
    closeCreateModal
  }
}
