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

export const useLogout = (): UseLogoutComposable => {
  const localePath = useLocalePath()
  const { logout, hasError, errorTitle, errorText, resetError } = useAuth()
  const { showSuccess } = useToastNotification()

  const isOpen = ref(false)
  const isLoggingOut = ref(false)

  const openDialog = (): void => {
    resetError()
    isOpen.value = true
  }

  const closeDialog = (): void => {
    isOpen.value = false
    resetError()
  }

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
