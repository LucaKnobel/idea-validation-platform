export const useUpgradeToProModal = () => {
  const isUpgradeModalOpen = ref(false)

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
