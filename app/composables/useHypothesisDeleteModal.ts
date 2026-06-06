/**
 * Public API for hypothesis delete modal state handling.
 */
export interface UseHypothesisDeleteModalComposable {
  deleteCandidate: Ref<HypothesisResponseDto | null>
  isDeleteModalOpen: Ref<boolean>
  openDeleteModal: (hypothesis: HypothesisResponseDto) => void
  closeDeleteModal: () => void
}

/**
 * Encapsulates delete confirmation modal state for hypotheses.
 */
export const useHypothesisDeleteModal = (): UseHypothesisDeleteModalComposable => {
  const deleteCandidate = ref<HypothesisResponseDto | null>(null)
  const { isOpen: isDeleteModalOpen, open: openModal, close: closeModal } = useModalState()

  /**
   * Opens the delete confirmation modal for one hypothesis.
   */
  const openDeleteModal = (hypothesis: HypothesisResponseDto): void => {
    deleteCandidate.value = hypothesis
    openModal()
  }

  /**
   * Closes and clears the delete confirmation candidate.
   */
  const closeDeleteModal = (): void => {
    closeModal()
    deleteCandidate.value = null
  }

  return {
    deleteCandidate,
    isDeleteModalOpen,
    openDeleteModal,
    closeDeleteModal
  }
}
