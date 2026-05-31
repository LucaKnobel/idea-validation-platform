/**
 * Input required to initialize the update modal state.
 */
export interface UseHypothesisUpdateModalInput {
  createEmptyFormState: () => CreateHypothesisBodyDto
}

/**
 * Public API for the update modal state.
 */
export interface UseHypothesisUpdateModalComposable {
  formState: CreateHypothesisBodyDto
  formHypothesisId: Ref<string | null>
  isUpdateModalOpen: Ref<boolean>
  resetForm: () => void
  openUpdateModal: (hypothesis: HypothesisResponseDto) => void
  closeUpdateModal: () => void
}

/**
 * Handles update modal transitions and editable form payload state.
 */
export const useHypothesisUpdateModal = (
  input: UseHypothesisUpdateModalInput
): UseHypothesisUpdateModalComposable => {
  const formState = reactive<CreateHypothesisBodyDto>(input.createEmptyFormState())
  const formHypothesisId = ref<string | null>(null)
  const isUpdateModalOpen = ref(false)

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
   * Opens update mode and pre-fills the form from the selected hypothesis.
   */
  const openUpdateModal = (hypothesis: HypothesisResponseDto): void => {
    formHypothesisId.value = hypothesis.id
    formState.statement = hypothesis.statement
    formState.dimension = hypothesis.dimension
    formState.priority = hypothesis.priority
    formState.canvasSectionTypes = hypothesis.canvasSectionLinks.map(link => link.canvasElementType)
    isUpdateModalOpen.value = true
  }

  /**
   * Closes the update form modal.
   */
  const closeUpdateModal = (): void => {
    isUpdateModalOpen.value = false
  }

  return {
    formState,
    formHypothesisId,
    isUpdateModalOpen,
    resetForm,
    openUpdateModal,
    closeUpdateModal
  }
}
