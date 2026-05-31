/**
 * Public contract implemented by useUpgradeToProModal.
 */
export interface UseUpgradeToProModalComposable {
  isUpgradeModalOpen: Ref<boolean>
  openUpgradeModal: () => void
  closeUpgradeModal: () => void
}

/**
 * Provides a shared modal state for upgrade-to-pro prompts across the app.
 */
export const useUpgradeToProModal = (): UseUpgradeToProModalComposable => {
  const isUpgradeModalOpen = useState<boolean>('upgrade-to-pro-modal-open', () => false)

  /**
   * Opens the shared upgrade modal.
   */
  const openUpgradeModal = (): void => {
    isUpgradeModalOpen.value = true
  }

  /**
   * Closes the shared upgrade modal.
   */
  const closeUpgradeModal = (): void => {
    isUpgradeModalOpen.value = false
  }

  return {
    isUpgradeModalOpen,
    openUpgradeModal,
    closeUpgradeModal
  }
}
