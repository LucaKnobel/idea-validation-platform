/**
 * Input required to initialize the update modal state.
 */
export interface UseHypothesisUpdateModalInput {
  createEmptyFormState: () => UpsertHypothesisBodyDto
}

/**
 * Public API for the update modal state.
 */
export interface UseHypothesisUpdateModalComposable {
  formState: UpsertHypothesisBodyDto
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
  const formState = reactive<UpsertHypothesisBodyDto>(input.createEmptyFormState())
  const formHypothesisId = ref<string | null>(null)
  const { isOpen: isUpdateModalOpen, open: openModal, close: closeModal } = useModalState()

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
   * Opens update mode and pre-fills the form from the selected hypothesis.
   */
  const openUpdateModal = (hypothesis: HypothesisResponseDto): void => {
    formHypothesisId.value = hypothesis.id
    formState.statement = hypothesis.statement
    formState.dimension = hypothesis.dimension
    formState.priority = hypothesis.priority
    formState.evidenceType = hypothesis.evidenceType
    formState.canvasElementTypes = hypothesis.canvasSections
    openModal()
  }

  /**
   * Closes the update form modal.
   */
  const closeUpdateModal = (): void => {
    closeModal()
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
