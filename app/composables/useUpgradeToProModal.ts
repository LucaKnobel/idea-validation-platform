export const useUpgradeToProModal = () => {
  const isUpgradeModalOpen = useState<boolean>('upgrade-to-pro-modal-open', () => false)

  const openUpgradeModal = (): void => {
    isUpgradeModalOpen.value = true
  }

  const closeUpgradeModal = (): void => {
    isUpgradeModalOpen.value = false
  }

  return {
    isUpgradeModalOpen,
    openUpgradeModal,
    closeUpgradeModal
  }
}
