/**
 * Exposes the state and actions required by the logout confirmation flow.
 */
export interface UseLogoutComposable {
  isOpen: Ref<boolean>
  isLoggingOut: Ref<boolean>
  hasError: Ref<boolean>
  errorTitle: Ref<string | undefined>
  errorText: Ref<string | undefined>
  openDialog: () => void
  closeDialog: () => void
  handleLogout: () => Promise<void>
}

/**
 * Coordinates the logout dialog, request state, and redirect after a successful sign-out.
 */
export const useLogout = (): UseLogoutComposable => {
  const localePath = useLocalePath()
  const { logout, hasError, errorTitle, errorText, resetError } = useAuth()
  const { showSuccess } = useToastNotification()

  const isOpen = ref(false)
  const isLoggingOut = ref(false)

  /**
   * Opens the confirmation dialog with a clean error state.
   */
  const openDialog = (): void => {
    resetError()
    isOpen.value = true
  }

  /**
   * Closes the confirmation dialog and clears any stale auth error.
   */
  const closeDialog = (): void => {
    isOpen.value = false
    resetError()
  }

  /**
   * Prevents duplicate submissions, signs the user out, and redirects to the localized login page.
   */
  const handleLogout = async (): Promise<void> => {
    if (isLoggingOut.value) {
      return
    }

    isLoggingOut.value = true

    try {
      const ok = await logout()

      if (!ok) {
        return
      }

      showSuccess('auth.logout.success.title', 'auth.logout.success.message')
      closeDialog()
      await navigateTo(localePath('/auth/login'))
    } finally {
      isLoggingOut.value = false
    }
  }

  return {
    isOpen,
    isLoggingOut,
    hasError,
    errorTitle,
    errorText,
    openDialog,
    closeDialog,
    handleLogout
  }
}
