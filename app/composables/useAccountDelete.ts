/**
 * Public contract for account deletion flow state and actions.
 */
export interface UseAccountDeleteComposable {
  isDeleteModalOpen: Ref<boolean>
  isDeletingAccount: Ref<boolean>
  openDeleteModal: () => void
  closeDeleteModal: () => void
  confirmDeleteAccount: () => Promise<void>
}

/**
 * Encapsulates account deletion UX with guarded submit and post-delete redirect.
 */
export const useAccountDelete = (): UseAccountDeleteComposable => {
  const localePath = useLocalePath()
  const { deleteAccount } = useAccountApi()
  const { showSuccess, showError } = useToastNotification()
  const { handleRateLimitError } = useErrorHandler()
  const {
    isSubmitting: isDeletingAccount,
    runWithSubmitGuard
  } = useAsyncSubmitGuard()
  const {
    isOpen: isDeleteModalOpen,
    open: openDeleteModal,
    close: closeDeleteModal
  } = useModalState()

  /**
   * Deletes the account and redirects to the localized login page.
   */
  const confirmDeleteAccount = async (): Promise<void> => {
    const deleted = await runWithSubmitGuard(async () => {
      try {
        await deleteAccount()
      } catch (error: unknown) {
        if (!handleRateLimitError(error)) {
          showError('account.delete.error.title', 'account.delete.error.message')
        }

        return false
      }

      return true
    })

    if (!deleted) {
      return
    }

    showSuccess('account.delete.success.title', 'account.delete.success.message')
    closeDeleteModal()

    // Force fresh auth state after account removal.
    clearNuxtData()

    await navigateTo(localePath('/auth/login'))
  }

  return {
    isDeleteModalOpen,
    isDeletingAccount,
    openDeleteModal,
    closeDeleteModal,
    confirmDeleteAccount
  }
}
